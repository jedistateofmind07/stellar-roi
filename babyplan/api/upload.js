// Grants the browser a scoped token to upload files directly to Vercel Blob,
// bypassing the 4.5MB serverless request-body limit.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  try {
    const { handleUpload } = await import('@vercel/blob/client');
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf'
        ],
        maximumSizeInBytes: 25 * 1024 * 1024,
        addRandomSuffix: true
      }),
      onUploadCompleted: async () => {}
    });
    res.status(200).json(jsonResponse);
  } catch (e) {
    res.status(400).json({ error: (e && e.message) || 'upload' });
  }
};
