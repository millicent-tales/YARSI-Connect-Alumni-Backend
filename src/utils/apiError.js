// utils/ApiError.js
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.errors = errors;
  }
}

// middlewares/errorMiddleware.js
const { Prisma } = require("@prisma/client");
const { ZodError } = require("zod");

// Middleware untuk URL yang tidak ditemukan
const notFound = (req, res, next) => {
  const error = new ApiError(404, `URL tidak ditemukan - ${req.originalUrl}`);
  next(error);
};

// Middleware untuk handling error
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Prisma Error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // Unique constraint failed
        error = new ApiError(400, "Data dengan nilai tersebut sudah ada");
        break;
      case "P2025": // Record not found
        error = new ApiError(404, "Data tidak ditemukan");
        break;
      default:
        error = new ApiError(500, "Terjadi kesalahan pada database");
    }
  }

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    error = new ApiError(400, "Validasi gagal", err.errors);
  }

  // Response
  res.status(error.statusCode || 500).json({
    status: error.status || "error",
    message: error.message || "Terjadi kesalahan pada server",
    errors: error.errors || undefined,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler, ApiError };
