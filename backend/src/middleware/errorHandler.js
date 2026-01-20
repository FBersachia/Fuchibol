function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.errors });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Unique constraint error', details: err.errors });
  }
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
