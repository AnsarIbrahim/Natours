class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Operational errors are errors that we can trust
    this.isOperational = true;

    // Capture the stack trace without polluting it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
