// src/lib/errors.js
import { authLogger } from './logger';

export const isAuthError = (error) => {
  if (!error) return false;
  
  const authErrorCodes = [401, 403];
  const authErrorTypes = [
    'general_unauthorized_scope',
    'user_unauthorized',
    'user_session_not_found',
    'user_invalid_credentials',
  ];

  return (
    authErrorCodes.includes(error.code) ||
    authErrorTypes.includes(error.type) ||
    error.message?.toLowerCase().includes('unauthorized')
  );
};

export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';
  if (typeof error === 'string') return error;

  const message = error?.message || '';

  const errorMap = {
    'Invalid credentials': 'Invalid email or password',
    'user_already_exists': 'An account with this email already exists',
    'user_invalid_credentials': 'Invalid email or password',
    'Rate limit': 'Too many attempts. Please try again later',
    'Network request failed': 'Network error. Please check your connection',
    'document_not_found': 'The requested resource was not found',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return message;
};

export const handleError = (error, context = 'Operation') => {
  authLogger.error(`${context} failed:`, error);
  return {
    success: false,
    error: getErrorMessage(error),
  };
};