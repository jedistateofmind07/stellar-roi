const { list } = require('@vercel/blob');

const DEFAULT_PATH = 'babyplan/updates.json';

async function readUpdates() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { updates: [], pathname: DEFAULT_PATH };
  const { blobs } = await list({ limit: 1000 });
  const hit =
    blobs.find(b => /updat|note|entrad/i.test(b.pathname) && b.pathname.endsWith('.json')) ||
    blobs.find(b => b.pathname.endsWith('.json')) ||
    null;
  if (!hit) return { updates: [], pathname: DEFAULT_PATH };
  const res = await fetch(hit.url + (hit.url.includes('?') ? '&' : '?') + 't=' + Date.now());
  if (!res.ok) return { updates: [], pathname: hit.pathname };
  const data = await res.json().catch(() => null);
  const updates = Array.isArray(data)
    ? data
    : data && Array.isArray(data.updates)
      ? data.updates
      : [];
  return { updates, pathname: hit.pathname };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { updates } = await readUpdates();
    res.status(200).json({ updates });
  } catch (e) {
    res.status(200).json({ updates: [] });
  }
};

module.exports.readUpdates = readUpdates;
module.exports.DEFAULT_PATH = DEFAULT_PATH;
