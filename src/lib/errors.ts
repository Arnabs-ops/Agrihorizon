/**
 * Error handling utilities
 * Centralized error classes and error handling functions
 */

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public translationKey?: string
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Error codes used throughout the application
 */
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  INVALID_ROLE: 'INVALID_ROLE',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ACCESS_DENIED: 'ACCESS_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  GENERIC_ERROR: 'GENERIC_ERROR',
} as const;

/**
 * Error messages (can be replaced with translation keys)
 */
export const ErrorMessages = {
  UNAUTHORIZED: 'User must be authenticated',
  PROFILE_NOT_FOUND: 'User profile not found',
  INVALID_ROLE: 'Invalid user role',
  PRODUCT_NOT_FOUND: 'Product not found or not available',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  ORDER_NOT_FOUND: 'Order not found',
  ACCESS_DENIED: 'Access denied',
  VALIDATION_ERROR: 'Validation error',
  GENERIC_ERROR: 'An error occurred',
} as const;

/**
 * Create an AppError instance
 */
export function createError(
  code: keyof typeof ErrorCodes,
  message?: string,
  translationKey?: string
): AppError {
  return new AppError(
    message || ErrorMessages[code],
    ErrorCodes[code],
    400,
    translationKey
  );
}

/**
 * Check if an error is an AppError instance
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return ErrorMessages.GENERIC_ERROR;
}

