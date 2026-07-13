const { put } = require('@vercel/blob');
const { readUpdates, readBrief, DEFAULT_PATH } = require('./state.js');
const { storeFiles } = require('./add-info.js');

const MAX_REQUEST_FILES = 10;
const MAX_STORED_FILES = 6;
const MAX_HISTORY = 20;
const MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 6000;

// Extract the note object from the model's reply. Tolerant of a leading
// preamble and of a response that got truncated mid-JSON: falls back to
// pulling each field out individually so a cut-off answer still shows.
function parseNote(textOut) {
  const start = textOut.indexOf('{');
  const end = textOut.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(textOut.slice(start, end + 1)); } catch (e) { /* fall through */ }
  }
  const grab = key => {
    const m = textOut.match(new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)', 'i'));
    if (!m) return '';
    return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, ' ').replace(/\\\\/g, '\\');
  };
  const note = {
    titleES: grab('titleES'),
    titleEN: grab('titleEN'),
    noteES: grab('noteES'),
    noteEN: grab('noteEN'),
    urgent: /"urgent"\s*:\s*true/i.test(textOut)
  };
  if (!note.titleES && !note.titleEN && !note.noteES && !note.noteEN) {
    throw new Error('unparseable reply: ' + textOut.slice(0, 150));
  }
  return note;
}
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|gif|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/;

const PLAN_CONTEXT = `You are the assistant embedded in a private pregnancy-planning website used by a couple in Bogotá, Colombia (he reads English, she reads Spanish — always answer in both). This site is their single repository for everything about the pregnancy and birth, and your job is to analyze what they add, give feedback and general medical guidance, and keep the plan and next steps up to date.

Their situation and plan:
- She was ~10 weeks pregnant in early July 2026 (due around late January / early February 2027). Compute the current week from today's date.
- Top medical priority: complete the thrombophilia workup (e.g. Factor V Leiden) — results affect anticoagulation decisions during pregnancy.
- Insurance plan A (the site's recommendation): Colmédica prepagada. Base plan Rubí Integral or Colina Integral (from ~COP 282,000/month); plus the Anexo de Maternidad, a one-time rider for already-pregnant women (~COP 8,810,445 on Rubí; ~10,192,455 on Zafiro) that covers delivery/C-section, hospitalization, physician fees, meds, the newborn's first month and 3 ultrasounds — it MUST be bought before week 27 (~late October 2026); plus Bebé Colmédica enrollment before month 5 to remove the newborn's pre-existing/congenital exclusions (NICU coverage); an EPS affiliation is mandatory first (sister EPS: Aliansalud). Delivery at Clínica La Colina, private room.
- Alternative under comparison: Medisanitas Integral (Keralty/Colsanitas group). Base from ~COP 231,000/month + IVA (collective rate). Its normal maternity benefit only covers delivery from month 11 of affiliation, so an already-pregnant enrollee needs the Contrato de Maternidad (buy before week 31; price only by quote) plus the Anexo Bebé en Gestación (must be filed between weeks 12 and 22 — deadline ~late September 2026 — removes newborn congenital/pre-existing exclusions; requires recent gynecologist evaluation and ultrasound) plus the Contrato Neonatal (newborn's first 15 days). Requires EPS in the contributory regime (sister: EPS Sanitas). Network: Clínica Reina Sofía and Clínica Universitaria Colombia in Bogotá.

Attached photos and PDFs (lab results, doctor's notes, ultrasounds) are included in the message, along with the running log of saved notes. Read them carefully. Give practical, specific guidance: what results mean in plain language, what to ask the obstetrician, concrete next steps, and how the new information changes the plan and its deadlines. General guidance, not diagnoses. Warm and honest. Set "urgent" true only for genuine red flags that warrant contacting a doctor promptly.

The very first character of your response MUST be "{". Output ONLY a single JSON object and nothing else — no preamble, no explanation, no markdown fences. Exact shape:
{"titleES":"...","titleEN":"...","noteES":"...","noteEN":"...","urgent":false}
titleES/noteES in Colombian Spanish, titleEN/noteEN in English. Put the full analysis, feedback, and next steps inside noteES/noteEN (use \\n for line breaks). Titles are one short line. Keep each note focused — aim for a few paragraphs, not an essay.`;

function validFile(f) {
  return f && typeof f.dataUrl === 'string' && DATA_URL_RE.test(f.dataUrl);
}
function usableAttachment(f) {
  return f && (validFile(f) || typeof f.url === 'string');
}

// Turn an attachment (inline data URL or stored blob URL) into an Anthropic
// content block. Returns null if it can't be fetched/decoded.
async function toContentBlock(f) {
  let mediaType, base64;
  if (typeof f.dataUrl === 'string') {
    mediaType = f.dataUrl.slice(5, f.dataUrl.indexOf(';'));
    base64 = f.dataUrl.slice(f.dataUrl.indexOf(',') + 1);
  } else {
    const r = await fetch(f.url);
    if (!r.ok) return null;
    mediaType = f.type || r.headers.get('content-type') || 'application/octet-stream';
    base64 = Buffer.from(await r.arrayBuffer()).toString('base64');
  }
  if (mediaType === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } };
  }
  if (/^image\/(jpeg|png|gif|webp)$/.test(mediaType)) {
    return { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };
  }
  return null;
}

async function askClaude(question, attachments, history, brief) {
  const oauth = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const content = [];
  for (const f of attachments) {
    try {
      const block = await toContentBlock(f);
      if (block) content.push(block);
    } catch (e) { /* skip unreadable attachment */ }
  }
  content.push({
    type: 'text',
    text:
      "Today's date: " + new Date().toISOString().slice(0, 10) + '\n\n' +
      (brief
        ? 'Verified facts already extracted from their uploaded documents (trust these; do NOT ask for information they contain — e.g. if the exact thrombophilia type is here, use it instead of saying it is unknown):\n' +
          JSON.stringify(brief) + '\n\n'
        : '') +
      (history ? 'Saved notes so far (oldest to newest):\n' + history + '\n\n' : '') +
      'Question: ' + question
  });

  const headers = {
    'content-type': 'application/json',
    'anthropic-version': '2023-06-01'
  };
  // Prefer the Claude Max OAuth token (bills to the subscription, no API charge).
  if (oauth) {
    headers['authorization'] = 'Bearer ' + oauth;
    headers['anthropic-beta'] = 'oauth-2025-04-20';
  } else {
    headers['x-api-key'] = apiKey;
  }

  // OAuth (Claude Code) tokens require the Claude Code identity as the first
  // system block; the plan context follows as a second block.
  const system = oauth
    ? [
        { type: 'text', text: "You are Claude Code, Anthropic's official CLI for Claude." },
        { type: 'text', text: PLAN_CONTEXT }
      ]
    : [{ type: 'text', text: PLAN_CONTEXT }];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: 'user', content }]
      })
    });
  } finally {
    clearTimeout(timer);
  }

  const raw = await res.text();
  if (!res.ok) {
    let msg = raw.slice(0, 300);
    try { msg = JSON.parse(raw).error.message || msg; } catch (e) {}
    throw new Error('API ' + res.status + ': ' + msg);
  }
  const data = JSON.parse(raw);
  const textOut = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
  return parseNote(textOut);
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
      .filter(usableAttachment);

    const { updates, pathname } = await readUpdates();

    if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
      res.status(200).json({
        updates: updates.concat([{
          ts: Date.now(),
          userText: question,
          titleES: 'Asistente no configurado',
          titleEN: 'Assistant not configured',
          noteES: 'Falta CLAUDE_CODE_OAUTH_TOKEN en Vercel. Ejecuta `claude setup-token` y agrégalo en el proyecto babyplan. Tu pregunta no quedó guardada.',
          noteEN: 'CLAUDE_CODE_OAUTH_TOKEN is missing in Vercel. Run `claude setup-token` and add it to the babyplan project. Your question was not saved.',
          urgent: false
        }])
      });
      return;
    }

    // Attach files sent with this question, then the most recent stored ones.
    const attachments = reqFiles.slice();
    for (let i = updates.length - 1; i >= 0 && attachments.length < MAX_REQUEST_FILES + MAX_STORED_FILES; i--) {
      for (const f of updates[i].files || []) {
        if (attachments.length >= MAX_REQUEST_FILES + MAX_STORED_FILES) break;
        if (usableAttachment(f)) attachments.push(f);
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

    const briefDoc = await readBrief().catch(() => null);
    const note = await askClaude(question, attachments, history, briefDoc && briefDoc.brief);

    const storedFiles = await storeFiles(reqFiles);
    updates.push({
      ts: Date.now(),
      userText: question,
      files: storedFiles,
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
    console.error('ask: failed:', e && e.message);
    let updates = [];
    try { updates = (await readUpdates()).updates; } catch (e2) {}
    res.status(200).json({
      updates: updates.concat([{
        ts: Date.now(),
        titleES: 'El asistente falló',
        titleEN: 'Assistant error',
        noteES: 'Detalle técnico (para Robbie): ' + ((e && e.message) || 'desconocido').slice(0, 400),
        noteEN: 'Technical detail (for Robbie): ' + ((e && e.message) || 'unknown').slice(0, 400),
        urgent: false
      }])
    });
  }
};

module.exports.toContentBlock = toContentBlock;
