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

const BRIEF_PATH = 'babyplan/brief.json';

// The "brief" is the digest of everything uploaded: structured facts extracted
// by Claude from the documents (thrombophilia type, gestational age, meds, ...).
// Written by /api/digest, read here and by /api/ask.
async function readBrief() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: 'babyplan/brief', limit: 10 });
  const hit = blobs.find(b => b.pathname === BRIEF_PATH);
  if (!hit) return null;
  const res = await fetch(hit.url + (hit.url.includes('?') ? '&' : '?') + 't=' + Date.now());
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const [{ updates }, brief] = await Promise.all([
      readUpdates(),
      readBrief().catch(() => null)
    ]);
    res.status(200).json({ updates, brief });
  } catch (e) {
    res.status(200).json({ updates: [], brief: null });
  }
};

module.exports.readUpdates = readUpdates;
module.exports.readBrief = readBrief;
module.exports.DEFAULT_PATH = DEFAULT_PATH;
module.exports.BRIEF_PATH = BRIEF_PATH;
