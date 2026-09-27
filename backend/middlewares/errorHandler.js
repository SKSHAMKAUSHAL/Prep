const logger = require("../utils/logger");

const AppError = require("../utils/AppError");

/**
 * Format MongoDB duplicate key errors
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || "field";
  const message = `Duplicate value for ${field}. Please use another value.`;
  return new AppError(message, 409, { field, value: err.keyValue ? err.keyValue[field] : undefined });
};

/**
 * Format Mongoose CastError (e.g. invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, { path: err.path, value: err.value });
};

/**
 * Format Mongoose ValidationError
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  const message = `Validation error in submitted data`;
  return new AppError(message, 400, errors);
};

/**
 * Format Zod validation errors
 */
const handleZodError = (err) => {
  const details = (err.issues || []).map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
  return new AppError("Invalid request data", 400, details);
};

/**
 * Format JWT errors
 */
const handleJWTError = () =>
  new AppError("Invalid authentication token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your authentication token has expired. Please log in again.", 401);

/**
 * Global Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Transform known library errors into AppError
  if (err.name === "ZodError" || err.issues) {
    error = handleZodError(err);
  } else if (err.name === "CastError") {
    error = handleCastErrorDB(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === "ValidationError") {
    error = handleValidationErrorDB(err);
  } else if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  } else if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || "error";
  const reqId = req.id || req.headers["x-request-id"] || "unknown";

  // Structured logging
  const logPayload = {
    reqId,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: error.message,
    isOperational: !!error.isOperational,
  };

  if (statusCode >= 500) {
    logger.error(
      { ...logPayload, stack: error.stack },
      `Internal Server Error: ${error.message}`
    );
  } else {
    logger.warn(logPayload, `Client Error (${statusCode}): ${error.message}`);
  }

  // Response payload
  const isDev = process.env.NODE_ENV !== "production";
  const response = {
    success: false,
    status,
    message:
      !error.isOperational && !isDev
        ? "Something went wrong on our end. Please try again later."
        : error.message,
    reqId,
  };

  if (error.details) {
    response.details = error.details;
  }

  if (isDev && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  AppError,
  errorHandler,
};
