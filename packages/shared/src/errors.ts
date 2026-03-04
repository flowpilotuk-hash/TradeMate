export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(args: { code: string; message: string; status: number; details?: Record<string, unknown> }) {
    super(args.message);
    this.name = "AppError";
    this.code = args.code;
    this.status = args.status;
    this.details = args.details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: "VALIDATION_ERROR", message, status: 400, details });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: "NOT_FOUND", message, status: 404, details });
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: Record<string, unknown>) {
    super({ code: "UNAUTHORIZED", message, status: 401, details });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: Record<string, unknown>) {
    super({ code: "FORBIDDEN", message, status: 403, details });
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: "CONFLICT", message, status: 409, details });
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", details?: Record<string, unknown>) {
    super({ code: "RATE_LIMITED", message, status: 429, details });
    this.name = "RateLimitError";
  }
}