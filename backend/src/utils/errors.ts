export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    // Capture stack trace for better debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export class OrderNotFoundError extends AppError {
  constructor(message: string = 'Order not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 403);
  }
}

export class InvalidOrderStatusError extends AppError {
  constructor(message: string = 'Invalid order status for this operation') {
    super(message, 400);
  }
}
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}
