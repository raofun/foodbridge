export default function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }
  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Resource not found or invalid ID format.' });
  }
  if (err.name === 'ValidationError') {
    const firstMsg = Object.values(err.errors || {})[0]?.message || 'Validation error.';
    return res.status(400).json({ message: firstMsg });
  }
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong.' });
}
