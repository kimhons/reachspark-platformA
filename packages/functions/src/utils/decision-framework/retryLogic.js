/**
 * Centralized Retry Logic for API Integrations
 * 
 * This module provides standardized retry logic for all API integrations
 * in the ReachSpark platform, ensuring consistent handling of transient failures.
 */

const errorLogging = require('./errorLogging');
const logger = errorLogging.logger;

// Default retry configurations for different API types
const RetryConfigs = {
  // OpenAI and other LLM APIs
  LLM_API: {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 8000,
    timeoutMs: 30000,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  },
  
  // Social media APIs (Facebook, Twitter, etc.)
  SOCIAL_API: {
    maxRetries: 4,
    baseDelay: 1000,
    maxDelay: 15000,
    timeoutMs: 20000,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  },
  
  // Database operations
  DATABASE: {
    maxRetries: 5,
    baseDelay: 300,
    maxDelay: 5000,
    timeoutMs: 10000,
    retryableStatusCodes: [429, 500, 503]
  },
  
  // Payment processing APIs
  PAYMENT_API: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 4000,
    timeoutMs: 15000,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  },
  
  // Default configuration for other APIs
  DEFAULT: {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 10000,
    timeoutMs: 20000,
    retryableStatusCodes: [429, 500, 502, 503, 504]
  }
};

/**
 * Determine if an error is retryable based on its type and status code
 * @param {Error} error - The error to check
 * @param {Array<number>} retryableStatusCodes - Status codes that are considered retryable
 * @returns {boolean} Whether the error is retryable
 */
const isRetryableError = (error, retryableStatusCodes = []) => {
  // Handle null or undefined error
  if (!error) {
    return false;
  }
  
  // Check for network connectivity issues
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ECONNABORTED' ||
      error.code === 'ENETUNREACH' ||
      error.code === 'ENOTFOUND') {
    return true;
  }
  
  // Check for rate limiting
  if (error.type === errorLogging.ErrorTypes.RATE_LIMIT_ERROR) {
    return true;
  }
  
  // Check for network errors
  if (error.type === errorLogging.ErrorTypes.NETWORK_ERROR ||
      error.type === errorLogging.ErrorTypes.TIMEOUT_ERROR) {
    return true;
  }
  
  // Check for specific HTTP status codes in response
  if (error.response && error.response.status) {
    return retryableStatusCodes.includes(error.response.status);
  }
  
  // Check for status code in error object
  if (error.status) {
    return retryableStatusCodes.includes(error.status);
  }
  
  // Check for status code in originalError
  if (error.originalError && error.originalError.response && error.originalError.response.status) {
    return retryableStatusCodes.includes(error.originalError.response.status);
  }
  
  return false;
};

/**
 * Calculate delay with exponential backoff and jitter
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
const calculateBackoffDelay = (attempt, baseDelay, maxDelay) => {
  // Calculate exponential backoff
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Add random jitter (up to 20% of the delay)
  const jitter = Math.random() * 0.2 * exponentialDelay;
  
  // Apply the delay, but cap it at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Execute a function with retry logic for API calls
 * @param {Function} fn - Function to execute
 * @param {Object} options - Retry options
 * @param {string} options.apiType - Type of API (LLM_API, SOCIAL_API, etc.)
 * @param {string} options.source - Source module name
 * @param {string} options.functionName - Function name
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.baseDelay - Base delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @param {number} options.timeoutMs - Timeout in milliseconds
 * @param {Array<number>} options.retryableStatusCodes - HTTP status codes to retry
 * @param {Function} options.onRetry - Function to call before each retry
 * @param {Object} options.context - Additional context for error logging
 * @returns {Promise<any>} Result of the function
 */
const executeWithRetry = async (fn, options = {}) => {
  // Get the appropriate retry configuration based on API type
  const apiType = options.apiType || 'DEFAULT';
  const config = RetryConfigs[apiType] || RetryConfigs.DEFAULT;
  
  // Merge default config with provided options
  const {
    source = 'unknown',
    functionName = 'unknown',
    maxRetries = config.maxRetries,
    baseDelay = config.baseDelay,
    maxDelay = config.maxDelay,
    timeoutMs = config.timeoutMs,
    retryableStatusCodes = config.retryableStatusCodes,
    onRetry = null,
    context = {}
  } = options;
  
  let lastError;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      // Execute the function with timeout
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
      
      // If successful, return the result
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we've reached the maximum number of retries
      if (attempt >= maxRetries) {
        break;
      }
      
      // Check if the error is retryable
      if (!isRetryableError(error, retryableStatusCodes)) {
        // Log non-retryable error and break
        try {
          await errorLogging.logError(
            error, 
            source, 
            functionName, 
            { 
              ...context,
              retryAttempt: attempt,
              retryAborted: true,
              reason: 'Non-retryable error'
            }
          );
        } catch (loggingError) {
          console.error('Failed to log error:', loggingError);
          console.error('Original error:', error);
        }
        break;
      }
      
      // Calculate delay for this attempt
      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);
      
      // Log retry attempt
      logger.info(
        `Retry attempt ${attempt + 1}/${maxRetries} for ${source}:${functionName} after ${delay}ms`,
        { error: error?.message || 'Unknown error', attempt, delay }
      );
      
      // Call onRetry callback if provided
      if (onRetry && typeof onRetry === 'function') {
        try {
          await onRetry(error, attempt, delay);
        } catch (callbackError) {
          logger.warn(`Error in onRetry callback: ${callbackError?.message || 'Unknown error'}`);
        }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increment attempt counter
      attempt++;
    }
  }
  
  // Log final error after all retries failed or non-retryable error
  try {
    await errorLogging.logError(
      lastError || new Error('Unknown error occurred during retry'), 
      source, 
      functionName, 
      { 
        ...context,
        retryAttempt: attempt,
        retryExhausted: attempt >= maxRetries,
        maxRetries
      }
    );
  } catch (loggingError) {
    console.error('Failed to log error after retry:', loggingError);
    console.error('Original error:', lastError);
  }
  
  // Rethrow the last error
  throw lastError || new Error('Unknown error occurred during retry');
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Result of the function
 */
const retryWithExponentialBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    source = 'unknown',
    functionName = 'unknown'
  } = options;
  
  return executeWithRetry(fn, {
    maxRetries,
    baseDelay: initialDelayMs,
    source,
    functionName
  });
};

/**
 * Create a retry-enabled version of an API client function
 * @param {Function} fn - Original function
 * @param {Object} options - Retry options
 * @returns {Function} Retry-enabled function
 */
const createRetryableFunction = (fn, options = {}) => {
  return async (...args) => {
    return executeWithRetry(() => fn(...args), options);
  };
};

/**
 * Wrap an entire API client with retry logic
 * @param {Object} client - API client object
 * @param {Object} options - Retry options
 * @returns {Object} Retry-enabled API client
 */
const wrapClientWithRetry = (client, options = {}) => {
  const retryableClient = {};
  
  // Iterate through all properties of the client
  for (const key in client) {
    const value = client[key];
    
    // If the property is a function, wrap it with retry logic
    if (typeof value === 'function') {
      retryableClient[key] = createRetryableFunction(value, {
        ...options,
        functionName: key
      });
    } else {
      // Otherwise, copy the property as is
      retryableClient[key] = value;
    }
  }
  
  return retryableClient;
};

module.exports = {
  RetryConfigs,
  executeWithRetry,
  retryWithExponentialBackoff,
  createRetryableFunction,
  wrapClientWithRetry,
  isRetryableError,
  calculateBackoffDelay
};
