export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequest extends AppError {
  constructor(message = 'Bad request') {
    super(400, message);
  }
}

export class Unauthorized extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class NotFound extends AppError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

export class Conflict extends AppError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}
