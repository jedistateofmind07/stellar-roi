const { put } = require('@vercel/blob');
const { readUpdates, BRIEF_PATH } = require('./state.js');
const { toContentBlock } = require('./ask.js');

const MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 3000;
const MAX_ATTACH = 12;      // newest documents sent for analysis
const MAX_NOTES_CHARS = 8000;

const EXTRACT_PROMPT = `You are analyzing the uploaded medical documents and saved notes of a private pregnancy record for a couple in Bogotá, Colombia (he reads English, she reads Spanish). She is pregnant, has a genetic thrombophilia and a history of two losses; the record's top open question is the EXACT thrombophilia diagnosis.

Attached are their uploaded documents/photos (newest first) plus the log of saved notes. Extract ONLY facts supported by those documents and notes — no guesses.

The very first character of your response MUST be "{". Output ONLY one JSON object, exact shape:
{"thrombophiliaES":"","thrombophiliaEN":"","gestES":"","gestEN":"","medsES":[],"medsEN":[],"findingsES":[],"findingsEN":[],"stepsES":[],"stepsEN":[],"urgent":false}

- thrombophilia*: the exact thrombophilia diagnosis if any document or note names it (e.g. "Factor V Leiden heterocigoto", "SAF"), including zygosity if stated. Empty string if the documents don't say yet.
- gest*: current gestational age (computed to today's date) and estimated due date, citing the source document date. One short line. Empty if not derivable.
- meds*: current medications/supplements with doses that appear in the record.
- findings*: up to 6 key findings in plain language (labs, ultrasounds, diagnoses), newest first.
- steps*: up to 5 concrete next steps the documents imply (pending tests, deadlines, follow-ups).
- urgent: true ONLY for genuine red flags that warrant contacting a doctor promptly.

Each string ≤160 characters. *ES fields in Colombian Spanish, *EN in English. No markdown, no commentary — JSON only.`;

function parseBrief(textOut) {
  const start = textOut.indexOf('{');
  const end = textOut.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no JSON in digest reply');
  const b = JSON.parse(textOut.slice(start, end + 1));
  // normalize shape so the frontend can rely on it
  const arr = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
  const str = v => (typeof v === 'string' ? v : '');
  return {
    thrombophiliaES: str(b.thrombophiliaES), thrombophiliaEN: str(b.thrombophiliaEN),
    gestES: str(b.gestES), gestEN: str(b.gestEN),
    medsES: arr(b.medsES), medsEN: arr(b.medsEN),
    findingsES: arr(b.findingsES), findingsEN: arr(b.findingsEN),
    stepsES: arr(b.stepsES), stepsEN: arr(b.stepsEN),
    urgent: !!b.urgent
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  try {
    const oauth = process.env.CLAUDE_CODE_OAUTH_TOKEN;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!oauth && !apiKey) {
      res.status(200).json({ ok: false, error: 'not-configured' });
      return;
    }

    const { updates } = await readUpdates();

    // Newest attachments first, capped.
    const attachments = [];
    for (let i = updates.length - 1; i >= 0 && attachments.length < MAX_ATTACH; i--) {
      for (const f of updates[i].files || []) {
        if (attachments.length >= MAX_ATTACH) break;
        if (f && (f.url || f.dataUrl)) attachments.push(f);
      }
    }

    const notesText = updates.map(u => {
      const when = new Date(u.ts).toISOString().slice(0, 10);
      const parts = [`[${when}]`];
      if (u.userText) parts.push(`user: ${u.userText}`);
      if (u.noteEN || u.noteES) parts.push(`note: ${u.noteEN || u.noteES}`);
      return parts.join(' ');
    }).join('\n').slice(-MAX_NOTES_CHARS);

    if (!attachments.length && !notesText.trim()) {
      res.status(200).json({ ok: false, error: 'empty' });
      return;
    }

    const content = [];
    for (const f of attachments) {
      try {
        const block = await toContentBlock(f);
        if (block) content.push(block);
      } catch (e) { /* skip unreadable attachment */ }
    }
    content.push({
      type: 'text',
      text: "Today's date: " + new Date().toISOString().slice(0, 10) +
        '\n\nSaved notes (oldest to newest):\n' + (notesText || '(none)')
    });

    const headers = {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01'
    };
    if (oauth) {
      headers['authorization'] = 'Bearer ' + oauth;
      headers['anthropic-beta'] = 'oauth-2025-04-20';
    } else {
      headers['x-api-key'] = apiKey;
    }
    const system = oauth
      ? [
          { type: 'text', text: "You are Claude Code, Anthropic's official CLI for Claude." },
          { type: 'text', text: EXTRACT_PROMPT }
        ]
      : [{ type: 'text', text: EXTRACT_PROMPT }];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 110000);
    let apiRes;
    try {
      apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system, messages: [{ role: 'user', content }] })
      });
    } finally {
      clearTimeout(timer);
    }

    const raw = await apiRes.text();
    if (!apiRes.ok) {
      let msg = raw.slice(0, 300);
      try { msg = JSON.parse(raw).error.message || msg; } catch (e) {}
      throw new Error('API ' + apiRes.status + ': ' + msg);
    }
    const data = JSON.parse(raw);
    const textOut = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    const brief = parseBrief(textOut);

    const doc = { brief, ts: Date.now(), docCount: attachments.length };
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(BRIEF_PATH, JSON.stringify(doc), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60
      });
    }

    res.status(200).json({ ok: true, brief: doc });
  } catch (e) {
    console.error('digest: failed:', e && e.message);
    res.status(200).json({ ok: false, error: ((e && e.message) || 'unknown').slice(0, 300) });
  }
};
