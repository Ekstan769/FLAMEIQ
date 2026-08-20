export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

export class OrderNotFoundError extends AppError {
  constructor(message = "Order Not Found") {
    super(message, 404);
  }
}

export class InvalidOrderStatusError extends AppError {
    constructor(message = "Invalid Order Status") {
        super(message, 400);
    }
}
