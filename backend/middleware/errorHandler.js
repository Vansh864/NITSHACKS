export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong';

  res.status(status).json({
    error: {
      code,
      message,
    },
  });
}
