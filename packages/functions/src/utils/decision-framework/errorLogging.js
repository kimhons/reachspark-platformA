/**
 * Centralized Error Logging and Monitoring System
 * 
 * This module provides a unified approach to error handling, logging, and monitoring
 * across the ReachSpark platform. It includes:
 * 
 * - Standardized error classes and types
 * - Centralized error logging to Firestore and console
 * - Error monitoring with severity levels
 * - Retry logic for transient failures
 * - Alert generation for critical errors
 * - Error analytics and reporting
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Create a robust logger that falls back to console if functions.logger is undefined
const logger = (functions && functions.logger) || {
  info: console.info,
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Failed to initialize Firebase admin:', error);
  }
}

// Get Firestore instance with fallback for testing environments
let db;
try {
  db = admin.firestore();
} catch (error) {
  console.warn('Failed to initialize Firestore, using mock implementation for testing');
  // Mock Firestore for testing environments
  db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          add: async () => ({}),
          get: async () => ({ docs: [], forEach: () => {} })
        }),
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async () => ({}),
        update: async () => ({})
      }),
      add: async () => ({}),
      where: () => ({ where: () => ({ get: async () => ({ docs: [], forEach: () => {} }) }) }),
      orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [], forEach: () => {} }) }) })
    }),
    runTransaction: async (fn) => fn({ get: async () => ({ exists: false, data: () => ({}) }), set: async () => ({}), update: async () => ({}) })
  };
}

// Severity levels for errors
const SeverityLevels = {
  CRITICAL: 'CRITICAL',   // System is unusable, immediate attention required
  ERROR: 'ERROR',         // Error that prevents normal operation
  WARNING: 'WARNING',     // Potential issue that doesn't prevent operation
  INFO: 'INFO'            // Informational message about an error
};

// Error types for specific handling
const ErrorTypes = {
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  
  // API errors
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  
  // Access errors
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  
  // System errors
  MEMORY_ERROR: 'MEMORY_ERROR',
  RESOURCE_ERROR: 'RESOURCE_ERROR',
  
  // Ethical violations
  ETHICAL_VIOLATION: 'ETHICAL_VIOLATION',
  
  // Other
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Base error class for ReachSpark platform
 */
class ReachSparkError extends Error {
  constructor(message, type, severity = SeverityLevels.ERROR, originalError = null, context = {}) {
    super(message);
    this.name = 'ReachSparkError';
    this.type = type || ErrorTypes.UNKNOWN_ERROR;
    this.severity = severity;
    this.originalError = originalError;
    this.context = context || {};
    this.timestamp = new Date().toISOString();
    this.errorId = generateErrorId();
  }
}

/**
 * Generate a unique error ID
 * @returns {string} Unique error ID
 */
const generateErrorId = () => {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Determine severity level based on error type and context
 * @param {string} errorType - Type of error
 * @param {Object} context - Error context
 * @returns {string} Severity level
 */
const determineSeverity = (errorType, context = {}) => {
  // Critical errors that affect system operation
  if ([
    ErrorTypes.DATABASE_ERROR,
    ErrorTypes.TRANSACTION_ERROR,
    ErrorTypes.MEMORY_ERROR,
    ErrorTypes.RESOURCE_ERROR
  ].includes(errorType)) {
    return SeverityLevels.CRITICAL;
  }
  
  // Errors that affect user experience but don't break the system
  if ([
    ErrorTypes.API_ERROR,
    ErrorTypes.NETWORK_ERROR,
    ErrorTypes.AUTHENTICATION_ERROR
  ].includes(errorType)) {
    return SeverityLevels.ERROR;
  }
  
  // Warnings that should be monitored but don't immediately affect users
  if ([
    ErrorTypes.RATE_LIMIT_ERROR,
    ErrorTypes.VALIDATION_ERROR,
    ErrorTypes.PARSING_ERROR
  ].includes(errorType)) {
    return SeverityLevels.WARNING;
  }
  
  // Consider user impact for severity escalation
  if (context.userImpact === 'high') {
    return SeverityLevels.CRITICAL;
  }
  
  if (context.userImpact === 'medium') {
    return SeverityLevels.ERROR;
  }
  
  return SeverityLevels.ERROR; // Default severity
};

/**
 * Log error to Firestore, console, and trigger alerts if needed
 * @param {Error} error - Error object
 * @param {string} source - Source of the error (module/feature name)
 * @param {string} functionName - Name of the function where error occurred
 * @param {Object} context - Additional context for the error
 * @returns {Promise<string>} Error ID
 */
const logError = async (error, source, functionName, context = {}) => {
  try {
    // Convert to ReachSparkError if it's not already
    let reachSparkError;
    if (!(error instanceof ReachSparkError)) {
      const errorType = error.type || ErrorTypes.UNKNOWN_ERROR;
      const severity = determineSeverity(errorType, context);
      
      reachSparkError = new ReachSparkError(
        error.message || 'Unknown error',
        errorType,
        severity,
        error,
        context
      );
    } else {
      reachSparkError = error;
    }
    
    const errorData = {
      errorId: reachSparkError.errorId,
      message: reachSparkError.message,
      name: reachSparkError.name,
      type: reachSparkError.type,
      severity: reachSparkError.severity,
      source,
      functionName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      context: {
        ...reachSparkError.context,
        ...context,
        originalError: reachSparkError.originalError ? {
          message: reachSparkError.originalError.message,
          name: reachSparkError.originalError.name,
          stack: reachSparkError.originalError.stack
        } : null
      },
      stack: reachSparkError.stack,
      handled: true
    };

    // Log to Firestore
    try {
      await db.collection('errorLogs').add(errorData);
    } catch (logError) {
      // If Firestore logging fails, ensure we at least log to console
      console.error('Failed to log error to Firestore:', logError);
    }

    // Log to console with appropriate level
    const logData = {
      errorId: reachSparkError.errorId,
      type: reachSparkError.type,
      severity: reachSparkError.severity,
      source,
      context,
      originalError: reachSparkError.originalError ? reachSparkError.originalError.message : null
    };
    
    switch (reachSparkError.severity) {
      case SeverityLevels.CRITICAL:
        logger.error(`[CRITICAL][${source}:${functionName}] ${reachSparkError.message}`, logData);
        break;
      case SeverityLevels.ERROR:
        logger.error(`[ERROR][${source}:${functionName}] ${reachSparkError.message}`, logData);
        break;
      case SeverityLevels.WARNING:
        logger.warn(`[WARNING][${source}:${functionName}] ${reachSparkError.message}`, logData);
        break;
      case SeverityLevels.INFO:
        logger.info(`[INFO][${source}:${functionName}] ${reachSparkError.message}`, logData);
        break;
      default:
        logger.error(`[${source}:${functionName}] ${reachSparkError.message}`, logData);
    }
    
    // Generate alerts for critical errors
    if (reachSparkError.severity === SeverityLevels.CRITICAL) {
      try {
        await generateAlert(reachSparkError, source, functionName);
      } catch (alertError) {
        console.error('Failed to generate alert:', alertError);
      }
    }
    
    // Update error metrics for monitoring
    try {
      await updateErrorMetrics(reachSparkError.type, source);
    } catch (metricsError) {
      console.error('Failed to update error metrics:', metricsError);
    }
    
    return reachSparkError.errorId;
  } catch (loggingError) {
    // Last resort fallback if everything else fails
    console.error('Critical failure in error logging system:', loggingError);
    console.error('Original error:', error);
    return `unlogged_${Date.now()}`;
  }
};

/**
 * Generate alert for critical errors
 * @param {ReachSparkError} error - Error object
 * @param {string} source - Source of the error
 * @param {string} functionName - Function where error occurred
 */
const generateAlert = async (error, source, functionName) => {
  try {
    const alertData = {
      errorId: error.errorId,
      message: error.message,
      type: error.type,
      severity: error.severity,
      source,
      functionName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new',
      notified: false
    };
    
    await db.collection('errorAlerts').add(alertData);
    
    // In a production environment, this would trigger notifications
    // via email, SMS, Slack, PagerDuty, etc.
    logger.info(`Alert generated for critical error: ${error.errorId}`);
  } catch (alertError) {
    logger.error('Failed to generate alert:', alertError);
  }
};

/**
 * Update error metrics for monitoring
 * @param {string} errorType - Type of error
 * @param {string} source - Source of the error
 */
const updateErrorMetrics = async (errorType, source) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const metricsRef = db.collection('errorMetrics').doc(`${source}_${today}`);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(metricsRef);
      
      if (!doc.exists) {
        transaction.set(metricsRef, {
          source,
          date: today,
          total: 1,
          byType: {
            [errorType]: 1
          },
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        const data = doc.data();
        const newTotal = (data.total || 0) + 1;
        const byType = data.byType || {};
        byType[errorType] = (byType[errorType] || 0) + 1;
        
        transaction.update(metricsRef, {
          total: newTotal,
          byType,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
  } catch (metricsError) {
    logger.error('Failed to update error metrics:', metricsError);
  }
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.baseDelay - Base delay in milliseconds
 * @param {Function} options.shouldRetry - Function to determine if retry should be attempted
 * @param {string} options.source - Source for error logging
 * @param {string} options.functionName - Function name for error logging
 * @returns {Promise<any>} Result of the function
 */
const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 300,
    shouldRetry = () => true,
    source = 'unknown',
    functionName = 'unknown'
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Log retry attempt
      logger.info(`Retry attempt ${attempt + 1}/${maxRetries} for ${source}:${functionName}`);
      
      // Check if we should retry
      if (!shouldRetry(error)) {
        // Log error and throw
        await logError(error, source, functionName, { retryAttempt: attempt + 1 });
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Log final error after all retries failed
  await logError(lastError, source, functionName, { 
    retryAttempt: maxRetries,
    retryExhausted: true 
  });
  
  throw lastError;
};

/**
 * Get error statistics for a given time period
 * @param {Object} options - Options for statistics
 * @param {string} options.source - Filter by source (optional)
 * @param {string} options.type - Filter by error type (optional)
 * @param {string} options.severity - Filter by severity (optional)
 * @param {number} options.days - Number of days to include (default: 7)
 * @returns {Promise<Object>} Error statistics
 */
const getErrorStatistics = async (options = {}) => {
  const { source, type, severity, days = 7 } = options;
  
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Build query
    let query = db.collection('errorLogs')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    if (source) {
      query = query.where('source', '==', source);
    }
    
    if (type) {
      query = query.where('type', '==', type);
    }
    
    if (severity) {
      query = query.where('severity', '==', severity);
    }
    
    const snapshot = await query.get();
    
    // Process results
    const errors = [];
    snapshot.forEach(doc => {
      errors.push(doc.data());
    });
    
    // Calculate statistics
    const statistics = {
      totalErrors: errors.length,
      bySeverity: {},
      byType: {},
      bySource: {},
      byDay: {}
    };
    
    errors.forEach(error => {
      // Count by severity
      statistics.bySeverity[error.severity] = (statistics.bySeverity[error.severity] || 0) + 1;
      
      // Count by type
      statistics.byType[error.type] = (statistics.byType[error.type] || 0) + 1;
      
      // Count by source
      statistics.bySource[error.source] = (statistics.bySource[error.source] || 0) + 1;
      
      // Count by day
      const day = new Date(error.timestamp.toDate()).toISOString().split('T')[0];
      statistics.byDay[day] = (statistics.byDay[day] || 0) + 1;
    });
    
    return statistics;
  } catch (error) {
    logger.error('Failed to get error statistics:', error);
    throw new ReachSparkError(
      'Failed to get error statistics',
      ErrorTypes.DATABASE_ERROR,
      SeverityLevels.ERROR,
      error,
      { options }
    );
  }
};

module.exports = {
  // Error classes and types
  ReachSparkError,
  ErrorTypes,
  SeverityLevels,
  
  // Core functions
  logError,
  retryWithBackoff,
  
  // Monitoring and analytics
  getErrorStatistics,
  
  // Helper functions
  generateErrorId,
  determineSeverity,
  
  // Logger instance
  logger
};
