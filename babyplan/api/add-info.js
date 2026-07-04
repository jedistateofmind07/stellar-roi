const { put } = require('@vercel/blob');
const { readUpdates, DEFAULT_PATH } = require('./state.js');

const MAX_FILES = 10;
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|gif|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/;
const BLOB_URL_RE = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

function acceptedFile(f) {
  if (!f) return false;
  if (typeof f.dataUrl === 'string' && DATA_URL_RE.test(f.dataUrl)) return true;
  return typeof f.url === 'string' && BLOB_URL_RE.test(f.url) && ALLOWED_TYPES.includes(f.type);
}

function extFor(type) {
  if (type === 'application/pdf') return '.pdf';
  if (type === 'image/png') return '.png';
  if (type === 'image/gif') return '.gif';
  if (type === 'image/webp') return '.webp';
  return '.jpg';
}

// Store each attachment as its own blob and keep only the URL in updates.json,
// so the notes index (and /api/state responses) stay small.
async function storeFiles(rawFiles) {
  const stored = [];
  for (const f of rawFiles) {
    const name = typeof f.name === 'string' ? f.name.slice(0, 120) : '';
    if (typeof f.url === 'string') {
      // Already uploaded directly from the browser to Blob.
      stored.push({ name, type: f.type, url: f.url });
      continue;
    }
    const type = f.dataUrl.slice(5, f.dataUrl.indexOf(';'));
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      stored.push({ name, type, dataUrl: f.dataUrl });
      continue;
    }
    const buf = Buffer.from(f.dataUrl.slice(f.dataUrl.indexOf(',') + 1), 'base64');
    const blob = await put('babyplan/files/' + Date.now() + extFor(type), buf, {
      access: 'public',
      addRandomSuffix: true,
      contentType: type
    });
    stored.push({ name, type, url: blob.url });
  }
  return stored;
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
    const rawFiles = (Array.isArray(body.files) ? body.files : [])
      .slice(0, MAX_FILES)
      .filter(acceptedFile);
    if (!text && rawFiles.length === 0) {
      res.status(400).json({ error: 'empty' });
      return;
    }

    const { updates, pathname } = await readUpdates();
    const files = await storeFiles(rawFiles);
    updates.push({ ts: Date.now(), userText: text, files, urgent: false });

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

module.exports.storeFiles = storeFiles;
