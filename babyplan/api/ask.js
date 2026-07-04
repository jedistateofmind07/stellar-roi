const { put } = require('@vercel/blob');
const Anthropic = require('@anthropic-ai/sdk');
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

The user may attach photos of lab results or documents, and earlier saved notes/photos are provided as context. Give practical, specific guidance: what results mean in plain language, what to ask the obstetrician, how new information affects the plan and its deadlines. General guidance, not diagnoses. Warm and honest. Set "urgent" true only for genuine red flags.

Answer as a note with titleES/titleEN and noteES/noteEN (Colombian Spanish / English). Keep it focused — a few short paragraphs.`;

const NOTE_SCHEMA = {
  type: 'object',
  properties: {
    titleES: { type: 'string' },
    titleEN: { type: 'string' },
    noteES: { type: 'string' },
    noteEN: { type: 'string' },
    urgent: { type: 'boolean' }
  },
  required: ['titleES', 'titleEN', 'noteES', 'noteEN', 'urgent'],
  additionalProperties: false
};

function dataUrlToBlock(dataUrl) {
  if (typeof dataUrl !== 'string' || !DATA_URL_RE.test(dataUrl)) return null;
  const mediaType = dataUrl.slice(5, dataUrl.indexOf(';'));
  const data = dataUrl.slice(dataUrl.indexOf(',') + 1);
  if (mediaType === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } };
  }
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
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
    const reqFiles = (Array.isArray(body.files) ? body.files : []).slice(0, MAX_REQUEST_FILES);

    const { updates, pathname } = await readUpdates();

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      // Not configured: answer ephemerally (nothing saved) so the page explains itself.
      res.status(200).json({
        updates: updates.concat([{
          ts: Date.now(),
          userText: question,
          titleES: 'Asistente no configurado',
          titleEN: 'Assistant not configured',
          noteES: 'Para activar las preguntas, agrega la variable ANTHROPIC_API_KEY en Vercel (proyecto babyplan → Settings → Environment Variables). Tu pregunta no quedó guardada.',
          noteEN: 'To enable questions, add the ANTHROPIC_API_KEY environment variable in Vercel (babyplan project → Settings → Environment Variables). Your question was not saved.',
          urgent: false
        }])
      });
      return;
    }

    // Content: files attached right now, then the most recent stored attachments.
    const content = [];
    for (const f of reqFiles) {
      const block = f && dataUrlToBlock(f.dataUrl);
      if (block) content.push(block);
    }
    let storedCount = 0;
    for (let i = updates.length - 1; i >= 0 && storedCount < MAX_STORED_FILES; i--) {
      for (const f of updates[i].files || []) {
        if (storedCount >= MAX_STORED_FILES) break;
        const block = f && dataUrlToBlock(f.dataUrl);
        if (block) { content.push(block); storedCount++; }
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

    content.push({
      type: 'text',
      text:
        `Today's date: ${new Date().toISOString().slice(0, 10)}\n\n` +
        (history ? `Saved notes so far (oldest to newest):\n${history}\n\n` : '') +
        `New question: ${question}`
    });

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      system: PLAN_CONTEXT,
      messages: [{ role: 'user', content }],
      output_config: { format: { type: 'json_schema', schema: NOTE_SCHEMA } }
    });

    if (response.stop_reason === 'refusal') throw new Error('refused');
    const textBlock = response.content.find(b => b.type === 'text');
    const note = JSON.parse(textBlock.text);

    // Persist the Q&A (and any newly attached files) as a note.
    const savedFiles = reqFiles
      .filter(f => f && typeof f.dataUrl === 'string' && DATA_URL_RE.test(f.dataUrl))
      .map(f => ({
        name: typeof f.name === 'string' ? f.name.slice(0, 120) : '',
        type: f.dataUrl.slice(5, f.dataUrl.indexOf(';')),
        dataUrl: f.dataUrl
      }));
    updates.push({
      ts: Date.now(),
      userText: question,
      files: savedFiles,
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
