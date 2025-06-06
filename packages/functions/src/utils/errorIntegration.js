/**
 * Integration module for centralized error logging system
 * 
 * This module integrates the centralized error logging system with existing modules
 * to ensure consistent error handling across the platform.
 */

const { errorLogging } = require('../utils');
const { ReachSparkError, ErrorTypes, SeverityLevels } = errorLogging;

/**
 * Convert module-specific errors to ReachSparkError
 * @param {Error} error - Original error
 * @param {string} source - Source module
 * @returns {ReachSparkError} Standardized error
 */
const standardizeError = (error, source) => {
  if (error instanceof ReachSparkError) {
    return error;
  }
  
  // Map module-specific error types to standard types
  let errorType = ErrorTypes.UNKNOWN_ERROR;
  let severity = SeverityLevels.ERROR;
  
  // Handle Marketing Copilot errors
  if (error.name === 'MarketingCopilotError') {
    switch (error.type) {
      case 'DATABASE_ERROR':
        errorType = ErrorTypes.DATABASE_ERROR;
        severity = SeverityLevels.CRITICAL;
        break;
      case 'AI_SERVICE_ERROR':
        errorType = ErrorTypes.API_ERROR;
        severity = SeverityLevels.ERROR;
        break;
      case 'VALIDATION_ERROR':
        errorType = ErrorTypes.VALIDATION_ERROR;
        severity = SeverityLevels.WARNING;
        break;
      case 'PARSING_ERROR':
        errorType = ErrorTypes.PARSING_ERROR;
        severity = SeverityLevels.WARNING;
        break;
      case 'NOT_FOUND_ERROR':
        errorType = ErrorTypes.NOT_FOUND_ERROR;
        severity = SeverityLevels.ERROR;
        break;
      case 'PERMISSION_ERROR':
        errorType = ErrorTypes.PERMISSION_ERROR;
        severity = SeverityLevels.ERROR;
        break;
      case 'RATE_LIMIT_ERROR':
        errorType = ErrorTypes.RATE_LIMIT_ERROR;
        severity = SeverityLevels.WARNING;
        break;
    }
  }
  
  // Handle OpenAI API errors
  if (error.name === 'OpenAIError') {
    switch (error.type) {
      case 'API_ERROR':
        errorType = ErrorTypes.API_ERROR;
        severity = SeverityLevels.ERROR;
        break;
      case 'RATE_LIMIT_ERROR':
        errorType = ErrorTypes.RATE_LIMIT_ERROR;
        severity = SeverityLevels.WARNING;
        break;
      case 'AUTHENTICATION_ERROR':
        errorType = ErrorTypes.AUTHENTICATION_ERROR;
        severity = SeverityLevels.ERROR;
        break;
      case 'NETWORK_ERROR':
        errorType = ErrorTypes.NETWORK_ERROR;
        severity = SeverityLevels.ERROR;
        break;
      case 'TIMEOUT_ERROR':
        errorType = ErrorTypes.TIMEOUT_ERROR;
        severity = SeverityLevels.WARNING;
        break;
      case 'VALIDATION_ERROR':
        errorType = ErrorTypes.VALIDATION_ERROR;
        severity = SeverityLevels.WARNING;
        break;
    }
  }
  
  return new ReachSparkError(
    error.message,
    errorType,
    severity,
    error,
    error.context || {}
  );
};

/**
 * Log error using the centralized system
 * @param {Error} error - Error to log
 * @param {string} source - Source module
 * @param {string} functionName - Function where error occurred
 * @param {Object} context - Additional context
 * @returns {Promise<string>} Error ID
 */
const logError = async (error, source, functionName, context = {}) => {
  const standardError = standardizeError(error, source);
  return errorLogging.logError(standardError, source, functionName, context);
};

/**
 * Retry function with backoff using centralized system
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Function result
 */
const retryWithBackoff = async (fn, options) => {
  return errorLogging.retryWithBackoff(fn, options);
};

module.exports = {
  standardizeError,
  logError,
  retryWithBackoff,
  ReachSparkError,
  ErrorTypes,
  SeverityLevels
};
