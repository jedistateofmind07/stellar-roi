const { put } = require('@vercel/blob');
const { readUpdates, DEFAULT_PATH } = require('./state.js');

const MAX_FILES = 6;
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|gif|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  try {
    const body = req.body || {};
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const files = (Array.isArray(body.files) ? body.files : [])
      .slice(0, MAX_FILES)
      .filter(f => f && typeof f.dataUrl === 'string' && DATA_URL_RE.test(f.dataUrl))
      .map(f => ({
        name: typeof f.name === 'string' ? f.name.slice(0, 120) : '',
        type: f.dataUrl.slice(5, f.dataUrl.indexOf(';')),
        dataUrl: f.dataUrl
      }));
    if (!text && files.length === 0) {
      res.status(400).json({ error: 'empty' });
      return;
    }

    const { updates, pathname } = await readUpdates();
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
