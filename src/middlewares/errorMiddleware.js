// Middleware untuk menangani 404 - Not Found
const notFound = (req, res, next) => {
  const error = new Error(`URL tidak ditemukan - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware untuk menangani semua jenis error
const errorHandler = (err, req, res, next) => {
  // Jika status code masih 200, ubah ke 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode);
  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
    // Tambahkan data error tambahan jika diperlukan
    errors: err.errors || undefined,
    code: err.code || undefined,
  });
};

module.exports = { notFound, errorHandler };
