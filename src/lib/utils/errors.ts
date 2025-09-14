import { PostgrestError } from '@supabase/supabase-js';
import { DatabaseError, ValidationError, ApiResponse } from '@/types/database';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationFailedError extends AppError {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed', 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

// Error handling utilities
export const handleSupabaseError = (error: PostgrestError, context: string = ''): string => {
  console.error(`Supabase error ${context}:`, error);

  // Handle specific Supabase error codes
  switch (error.code) {
    case 'PGRST116':
      return 'The requested resource was not found';
    case 'PGRST301':
      return 'You do not have permission to access this resource';
    case '23505':
      return 'A record with this information already exists';
    case '23503':
      return 'Cannot delete this record as it is referenced by other data';
    case '23514':
      return 'The provided data does not meet the required constraints';
    case '42501':
      return 'You do not have permission to perform this action';
    default:
      return error.message || 'An unexpected database error occurred';
  }
};

export const handleApiError = (error: unknown): ApiResponse => {
  console.error('API Error:', error);

  if (error instanceof ValidationFailedError) {
    return {
      error: 'Validation failed',
      message: 'Please check your input and try again',
    };
  }

  if (error instanceof NotFoundError) {
    return {
      error: 'Resource not found',
      message: error.message,
    };
  }

  if (error instanceof UnauthorizedError) {
    return {
      error: 'Unauthorized',
      message: error.message,
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      error: 'Forbidden',
      message: error.message,
    };
  }

  if (error instanceof AppError) {
    return {
      error: 'Application error',
      message: error.message,
    };
  }

  // Handle PostgrestError from Supabase
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    return {
      error: 'Database error',
      message: handleSupabaseError(pgError),
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    };
  }

  return {
    error: 'Unknown error',
    message: 'An unexpected error occurred',
  };
};

// Success response helper
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  data,
  message,
});

// Error response helper
export const createErrorResponse = (error: string, message?: string): ApiResponse => ({
  error,
  message,
});

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return async (req: any, res: any, next?: any) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (next) {
        next(error);
      } else {
        const errorResponse = handleApiError(error);
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        res.status(statusCode).json(errorResponse);
      }
    }
  };
};

// Validation helpers
export const validateRequired = (value: any, fieldName: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`,
    });
  }
  
  return errors;
};

export const validateEmail = (email: string, fieldName: string = 'email'): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!email) {
    return errors; // Allow empty emails (optional)
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    errors.push({
      field: fieldName,
      message: 'Please enter a valid email address',
    });
  }
  
  return errors;
};

export const validateNumber = (
  value: any, 
  fieldName: string, 
  options: { min?: number; max?: number; positive?: boolean } = {}
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  const num = Number(value);
  
  if (isNaN(num)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a valid number`,
    });
    return errors;
  }
  
  if (options.positive && num < 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a positive number`,
    });
  }
  
  if (options.min !== undefined && num < options.min) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be at least ${options.min}`,
    });
  }
  
  if (options.max !== undefined && num > options.max) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be at most ${options.max}`,
    });
  }
  
  return errors;
};

// Helper to combine validation errors
export const combineValidationErrors = (...errorArrays: ValidationError[][]): ValidationError[] => {
  return errorArrays.flat();
};

// Retry utility for database operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};