const { put } = require('@vercel/blob');
const Anthropic = require('@anthropic-ai/sdk');
const { readUpdates, DEFAULT_PATH } = require('./state.js');

const MAX_FILES = 6;

const SYSTEM = `You are the assistant for a private pregnancy-planning website used by a couple in Bogotá, Colombia. She is pregnant (around week 11 as of early July 2026). They are planning prenatal care and delivery in Bogotá, comparing prepaid health plans (Colmédica base plan + Anexo de Maternidad with delivery at Clínica La Colina; Medisanitas Integral as the alternative), and tracking lab results — thrombophilia (e.g. Factor V Leiden) is a known topic of interest.

The user submits a short note and/or photos of lab results or medical documents. Reply with personalized, practical notes: what it means in plain language, and what specific questions to ask the obstetrician. Give general guidance, not diagnoses. Be warm and reassuring but honest. Set "urgent" to true only for genuine red flags that warrant contacting a doctor promptly.

Write titleES/noteES in Colombian Spanish and titleEN/noteEN in English. Keep notes focused: a few short paragraphs at most.`;

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

function fileToBlock(f) {
  if (!f || typeof f.dataUrl !== 'string') return null;
  const m = f.dataUrl.match(/^data:([^;,]+);base64,(.+)$/s);
  if (!m) return null;
  const mediaType = m[1];
  const data = m[2];
  if (/^image\/(jpeg|png|gif|webp)$/.test(mediaType)) {
    return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
  }
  if (mediaType === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } };
  }
  return null;
}

async function generateNote(text, files, priorTitles) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return {
      titleES: 'Nota guardada',
      titleEN: 'Note saved',
      noteES: 'Tu nota quedó guardada. (El asistente no está configurado en este momento — falta la clave de API. Robbie puede agregarla en Vercel como ANTHROPIC_API_KEY.)',
      noteEN: 'Your note was saved. (The assistant is not configured right now — the API key is missing. Robbie can add it in Vercel as ANTHROPIC_API_KEY.)',
      urgent: false
    };
  }

  const client = new Anthropic({ apiKey });

  const content = [];
  for (const f of (files || []).slice(0, MAX_FILES)) {
    const block = fileToBlock(f);
    if (block) content.push(block);
  }
  const context = priorTitles.length
    ? `Previously saved notes (titles): ${priorTitles.join(' | ')}\n\n`
    : '';
  content.push({
    type: 'text',
    text: context + (text ? `New submission: ${text}` : 'New submission: (attached files only, no text)')
  });

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content }],
    output_config: { format: { type: 'json_schema', schema: NOTE_SCHEMA } }
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('assistant_refused');
  }
  const textBlock = response.content.find(b => b.type === 'text');
  return JSON.parse(textBlock.text);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  try {
    const body = req.body || {};
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const files = Array.isArray(body.files) ? body.files : [];
    if (!text && files.length === 0) {
      res.status(400).json({ error: 'empty' });
      return;
    }

    const { updates, pathname } = await readUpdates();
    const priorTitles = updates.slice(-5).map(u => u.titleEN || u.titleES).filter(Boolean);

    let note;
    try {
      note = await generateNote(text, files, priorTitles);
    } catch (e) {
      note = {
        titleES: 'Nota guardada',
        titleEN: 'Note saved',
        noteES: 'Tu nota quedó guardada, pero el asistente no pudo responder esta vez. Inténtalo de nuevo más tarde.',
        noteEN: "Your note was saved, but the assistant couldn't reply this time. Try again later.",
        urgent: false
      };
    }

    const update = {
      ts: Date.now(),
      userText: text,
      titleES: note.titleES || '',
      titleEN: note.titleEN || '',
      noteES: note.noteES || '',
      noteEN: note.noteEN || '',
      urgent: !!note.urgent
    };
    updates.push(update);

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
