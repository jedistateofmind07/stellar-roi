const { list } = require('@vercel/blob');

const DIAG_KEY = 'bp-diag-7f3k9x2m';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const url = new URL(req.url, 'http://x');
  if (url.searchParams.get('k') !== DIAG_KEY) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const out = {
    envNames: Object.keys(process.env).sort(),
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    blobs: null
  };
  if (out.hasBlobToken) {
    try {
      const { blobs } = await list({ limit: 1000 });
      out.blobs = blobs.map(b => ({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt }));
    } catch (e) {
      out.blobs = 'error: ' + (e && e.message);
    }
  }
  res.status(200).json(out);
};
