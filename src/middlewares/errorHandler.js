// src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.message && err.message.includes('Only XML files')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  res.status(500).json({ error: 'Internal Server Error' });
}

module.exports = errorHandler;
