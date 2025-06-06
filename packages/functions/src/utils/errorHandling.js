/**
 * Utility module for logging errors to Firestore and console
 * 
 * This module provides standardized error logging functionality
 * for consistent error tracking and debugging across the platform.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { logger } = functions;

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Error types for specific handling
const ErrorTypes = {
  DATABASE_ERROR: 'DATABASE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Custom error class for ReachSpark platform errors
 */
class ReachSparkError extends Error {
  constructor(message, type, originalError = null, context = {}) {
    super(message);
    this.name = 'ReachSparkError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Log error to Firestore and console
 * @param {Error} error - Error object
 * @param {string} functionName - Name of the function where error occurred
 * @param {Object} context - Additional context for the error
 */
const logError = async (error, functionName, context = {}) => {
  const errorData = {
    message: error.message,
    name: error.name,
    type: error.type || ErrorTypes.UNKNOWN_ERROR,
    functionName,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    context: {
      ...context,
      originalError: error.originalError ? {
        message: error.originalError.message,
        name: error.originalError.name,
        stack: error.originalError.stack
      } : null
    },
    stack: error.stack
  };

  // Log to Firestore
  try {
    await db.collection('errorLogs').add(errorData);
  } catch (logError) {
    // If Firestore logging fails, ensure we at least log to console
    logger.error('Failed to log error to Firestore:', logError);
  }

  // Log to console
  logger.error(`[${functionName}] ${error.message}`, {
    type: error.type || ErrorTypes.UNKNOWN_ERROR,
    context,
    originalError: error.originalError ? error.originalError.message : null
  });
};

module.exports = {
  ErrorTypes,
  ReachSparkError,
  logError
};
