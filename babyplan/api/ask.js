const fs = require('fs');
const os = require('os');
const path = require('path');
const { put } = require('@vercel/blob');
const { query } = require('@anthropic-ai/claude-agent-sdk');
const { readUpdates, DEFAULT_PATH } = require('./state.js');

const MAX_REQUEST_FILES = 4;
const MAX_STORED_FILES = 4;
const MAX_HISTORY = 15;
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|gif|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/;

const PLAN_CONTEXT = `You are the assistant embedded in a private pregnancy-planning website used by a couple in Bogotá, Colombia (he reads English, she reads Spanish — always answer in both).

Their situation and plan:
- She was ~10 weeks pregnant in early July 2026 (due around late January / early February 2027). Compute the current week from today's date.
- Top medical priority: complete the thrombophilia workup (e.g. Factor V Leiden) — results affect anticoagulation decisions during pregnancy.
- Insurance plan A (the site's recommendation): Colmédica prepagada. Base plan Rubí Integral or Colina Integral (from ~COP 282,000/month); plus the Anexo de Maternidad, a one-time rider for already-pregnant women (~COP 8,810,445 on Rubí; ~10,192,455 on Zafiro) that covers delivery/C-section, hospitalization, physician fees, meds, the newborn's first month and 3 ultrasounds — it MUST be bought before week 27 (~late October 2026); plus Bebé Colmédica enrollment before month 5 to remove the newborn's pre-existing/congenital exclusions (NICU coverage); an EPS affiliation is mandatory first (sister EPS: Aliansalud). Delivery at Clínica La Colina, private room.
- Alternative under comparison: Medisanitas Integral (Keralty/Colsanitas group). Base from ~COP 231,000/month + IVA (collective rate). Its normal maternity benefit only covers delivery from month 11 of affiliation, so an already-pregnant enrollee needs the Contrato de Maternidad (buy before week 31; price only by quote) plus the Anexo Bebé en Gestación (must be filed between weeks 12 and 22 — deadline ~late September 2026 — removes newborn congenital/pre-existing exclusions; requires recent gynecologist evaluation and ultrasound) plus the Contrato Neonatal (newborn's first 15 days). Requires EPS in the contributory regime (sister: EPS Sanitas). Network: Clínica Reina Sofía and Clínica Universitaria Colombia in Bogotá.

The question may reference attached photos of lab results or documents (read them with the Read tool), and earlier saved notes are provided as context. Give practical, specific guidance: what results mean in plain language, what to ask the obstetrician, how new information affects the plan and its deadlines. General guidance, not diagnoses. Warm and honest. Set "urgent" true only for genuine red flags.

Respond with ONLY a JSON object, no markdown fences, in exactly this shape:
{"titleES":"...","titleEN":"...","noteES":"...","noteEN":"...","urgent":false}
titleES/noteES in Colombian Spanish, titleEN/noteEN in English. Keep notes focused — a few short paragraphs.`;

function extFor(type) {
  if (type === 'application/pdf') return '.pdf';
  if (type === 'image/png') return '.png';
  if (type === 'image/gif') return '.gif';
  if (type === 'image/webp') return '.webp';
  return '.jpg';
}

function validFile(f) {
  return f && typeof f.dataUrl === 'string' && DATA_URL_RE.test(f.dataUrl);
}

async function askClaude(question, attachments, history) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ask-'));
  const filePaths = attachments.map((f, i) => {
    const type = f.dataUrl.slice(5, f.dataUrl.indexOf(';'));
    const p = path.join(dir, 'attachment-' + (i + 1) + extFor(type));
    fs.writeFileSync(p, Buffer.from(f.dataUrl.slice(f.dataUrl.indexOf(',') + 1), 'base64'));
    return p;
  });

  const prompt = [
    "Today's date: " + new Date().toISOString().slice(0, 10),
    history ? 'Saved notes so far (oldest to newest):\n' + history : '',
    filePaths.length
      ? 'Attached documents/photos — read each with the Read tool before answering:\n' + filePaths.join('\n')
      : '',
    'Question: ' + question
  ].filter(Boolean).join('\n\n');

  let resultText = '';
  const q = query({
    prompt,
    options: {
      cwd: dir,
      systemPrompt: PLAN_CONTEXT,
      allowedTools: ['Read'],
      permissionMode: 'bypassPermissions',
      maxTurns: 12,
      env: {
        ...process.env,
        HOME: os.tmpdir(),
        DISABLE_AUTOUPDATER: '1',
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
      }
    }
  });
  for await (const msg of q) {
    if (msg.type === 'result') {
      resultText = msg.subtype === 'success' && typeof msg.result === 'string' ? msg.result : '';
    }
  }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}

  const m = resultText.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no_json');
  return JSON.parse(m[0]);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  try {
    const body = req.body || {};
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!question) {
      res.status(400).json({ error: 'empty' });
      return;
    }
    const reqFiles = (Array.isArray(body.files) ? body.files : [])
      .slice(0, MAX_REQUEST_FILES)
      .filter(validFile);

    const { updates, pathname } = await readUpdates();

    const configured = !!(process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY);
    if (!configured) {
      // Ephemeral answer (nothing saved) so the page explains itself.
      res.status(200).json({
        updates: updates.concat([{
          ts: Date.now(),
          userText: question,
          titleES: 'Asistente no configurado',
          titleEN: 'Assistant not configured',
          noteES: 'Para activar las preguntas: en tu computador ejecuta `claude setup-token` (usa la suscripción Claude Max) y agrega el token en Vercel como CLAUDE_CODE_OAUTH_TOKEN (proyecto babyplan → Settings → Environment Variables). Tu pregunta no quedó guardada.',
          noteEN: 'To enable questions: run `claude setup-token` on your computer (it uses the Claude Max subscription) and add the token in Vercel as CLAUDE_CODE_OAUTH_TOKEN (babyplan project → Settings → Environment Variables). Your question was not saved.',
          urgent: false
        }])
      });
      return;
    }

    // Attachments: files sent with this question first, then the most recent stored ones.
    const attachments = reqFiles.slice();
    for (let i = updates.length - 1; i >= 0 && attachments.length < MAX_REQUEST_FILES + MAX_STORED_FILES; i--) {
      for (const f of updates[i].files || []) {
        if (attachments.length >= MAX_REQUEST_FILES + MAX_STORED_FILES) break;
        if (validFile(f)) attachments.push(f);
      }
    }

    const history = updates.slice(-MAX_HISTORY).map(u => {
      const when = new Date(u.ts).toISOString().slice(0, 10);
      const parts = [`[${when}]`];
      if (u.userText) parts.push(`user: ${u.userText}`);
      if (u.noteEN || u.noteES) parts.push(`note: ${u.noteEN || u.noteES}`);
      if ((u.files || []).length) parts.push(`(${u.files.length} attachment(s))`);
      return parts.join(' ');
    }).join('\n');

    const note = await askClaude(question, attachments, history);

    updates.push({
      ts: Date.now(),
      userText: question,
      files: reqFiles.map(f => ({
        name: typeof f.name === 'string' ? f.name.slice(0, 120) : '',
        type: f.dataUrl.slice(5, f.dataUrl.indexOf(';')),
        dataUrl: f.dataUrl
      })),
      titleES: note.titleES || '',
      titleEN: note.titleEN || '',
      noteES: note.noteES || '',
      noteEN: note.noteEN || '',
      urgent: !!note.urgent
    });

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(pathname || DEFAULT_PATH, JSON.stringify({ updates }), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60
      });
    }

    res.status(200).json({ updates });
  } catch (e) {
    res.status(500).json({ error: 'server' });
  }
};
