/**
 * OpenAI API Integration
 * 
 * This module provides functions to interact with OpenAI's API
 * for AI-powered features in the ReachSpark platform.
 * 
 * Features:
 * - Comprehensive error handling with custom error types
 * - Retry logic for transient failures
 * - Input validation
 * - Detailed error logging
 * - Secure API key management
 */

const axios = require('axios');
const functions = require('firebase-functions');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// OpenAI API configuration
const OPENAI_API_KEY = functions.config().openai?.api_key || process.env.OPENAI_API_KEY;

// Error types for specific handling
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Custom error class for OpenAI API errors
 */
class OpenAIError extends Error {
  constructor(message, type, originalError = null, context = {}) {
    super(message);
    this.name = 'OpenAIError';
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
    await db.collection('apiErrorLogs').add(errorData);
  } catch (logError) {
    // If Firestore logging fails, ensure we at least log to console
    logger.error('Failed to log error to Firestore:', logError);
  }

  // Log to console
  logger.error(`[OpenAI API - ${functionName}] ${error.message}`, {
    type: error.type || ErrorTypes.UNKNOWN_ERROR,
    context,
    originalError: error.originalError ? error.originalError.message : null
  });
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {Function} shouldRetry - Function to determine if retry should be attempted
 * @returns {Promise<any>} Result of the function
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 300, shouldRetry = () => true) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      
      logger.info(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Validate API key
 * @returns {boolean} Whether API key is valid
 */
const validateApiKey = () => {
  if (!OPENAI_API_KEY) {
    throw new OpenAIError(
      'OpenAI API key is not configured',
      ErrorTypes.AUTHENTICATION_ERROR,
      null,
      { configPresent: !!functions.config().openai, envPresent: !!process.env.OPENAI_API_KEY }
    );
  }
  
  if (OPENAI_API_KEY.startsWith('sk-') === false) {
    throw new OpenAIError(
      'Invalid OpenAI API key format',
      ErrorTypes.AUTHENTICATION_ERROR,
      null,
      { keyPrefix: OPENAI_API_KEY.substring(0, 3) }
    );
  }
  
  return true;
};

/**
 * Validate text generation parameters
 * @param {Object} params - Parameters to validate
 * @throws {OpenAIError} If parameters are invalid
 */
const validateTextParams = (params) => {
  if (!params) {
    throw new OpenAIError(
      'Parameters are required',
      ErrorTypes.VALIDATION_ERROR,
      null,
      { params }
    );
  }
  
  if (!params.prompt) {
    throw new OpenAIError(
      'Prompt is required',
      ErrorTypes.VALIDATION_ERROR,
      null,
      { params }
    );
  }
  
  if (params.max_tokens && (isNaN(params.max_tokens) || params.max_tokens < 1 || params.max_tokens > 4096)) {
    throw new OpenAIError(
      'max_tokens must be a number between 1 and 4096',
      ErrorTypes.VALIDATION_ERROR,
      null,
      { params }
    );
  }
  
  if (params.temperature && (isNaN(params.temperature) || params.temperature < 0 || params.temperature > 2)) {
    throw new OpenAIError(
      'temperature must be a number between 0 and 2',
      ErrorTypes.VALIDATION_ERROR,
      null,
      { params }
    );
  }
};

/**
 * Validate image generation parameters
 * @param {Object} params - Parameters to validate
 * @throws {OpenAIError} If parameters are invalid
 */
const validateImageParams = (params) => {
  if (!params) {
    throw new OpenAIError(
      'Parameters are required',
      ErrorTypes.VALIDATION_ERROR,
      null,
      { params }
    );
  }
  
  if (!params.prompt) {
    throw new OpenAIError(
      'Prompt is required',
      ErrorTypes.VALIDATION_ERROR,
      null,
      { params }
    );
  }
  
  const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
  if (params.size && !validSizes.includes(params.size)) {
    throw new OpenAIError(
      `Size must be one of: ${validSizes.join(', ')}`,
      ErrorTypes.VALIDATION_ERROR,
      null,
      { params }
    );
  }
  
  if (params.n && (isNaN(params.n) || params.n < 1 || params.n > 10)) {
    throw new OpenAIError(
      'n must be a number between 1 and 10',
      ErrorTypes.VALIDATION_ERROR,
      null,
      { params }
    );
  }
};

/**
 * Parse error from OpenAI API response
 * @param {Error} error - Error from axios
 * @returns {OpenAIError} Parsed error
 */
const parseOpenAIError = (error, context = {}) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 401) {
      return new OpenAIError(
        'Authentication error: Invalid API key',
        ErrorTypes.AUTHENTICATION_ERROR,
        error,
        { ...context, status, data }
      );
    } else if (status === 429) {
      return new OpenAIError(
        'Rate limit exceeded: Too many requests',
        ErrorTypes.RATE_LIMIT_ERROR,
        error,
        { ...context, status, data }
      );
    } else if (status >= 500) {
      return new OpenAIError(
        'OpenAI server error',
        ErrorTypes.API_ERROR,
        error,
        { ...context, status, data }
      );
    } else {
      return new OpenAIError(
        `API error: ${data.error?.message || 'Unknown error'}`,
        ErrorTypes.API_ERROR,
        error,
        { ...context, status, data }
      );
    }
  } else if (error.request) {
    // The request was made but no response was received
    if (error.code === 'ECONNABORTED') {
      return new OpenAIError(
        'Request timeout: OpenAI API did not respond in time',
        ErrorTypes.TIMEOUT_ERROR,
        error,
        context
      );
    } else {
      return new OpenAIError(
        'Network error: No response received from OpenAI API',
        ErrorTypes.NETWORK_ERROR,
        error,
        context
      );
    }
  } else {
    // Something happened in setting up the request that triggered an Error
    return new OpenAIError(
      `Request setup error: ${error.message}`,
      ErrorTypes.UNKNOWN_ERROR,
      error,
      context
    );
  }
};

/**
 * Generate text using OpenAI's GPT models
 * 
 * @param {Object} params - Text generation parameters
 * @param {string} params.prompt - The prompt to generate text from
 * @param {string} params.model - The model to use (default: gpt-4o)
 * @param {number} params.max_tokens - Maximum tokens to generate
 * @param {number} params.temperature - Randomness of the generation
 * @returns {Promise<Object>} - Generated text
 */
async function generateText(params) {
  const functionName = 'generateText';
  const context = { params };
  
  try {
    // Validate API key and parameters
    validateApiKey();
    validateTextParams(params);
    
    const generateTextFn = async () => {
      try {
        const options = {
          method: 'POST',
          url: 'https://api.openai.com/v1/chat/completions',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          data: {
            model: params.model || 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful marketing assistant for the ReachSpark platform.'
              },
              {
                role: 'user',
                content: params.prompt
              }
            ],
            max_tokens: params.max_tokens || 500,
            temperature: params.temperature || 0.7
          },
          timeout: 30000 // 30 second timeout
        };

        const response = await axios.request(options);
        
        // Log API usage for monitoring
        await db.collection('apiUsage').add({
          api: 'openai',
          model: params.model || 'gpt-4o',
          tokensUsed: response.data.usage.total_tokens,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }).catch(err => {
          // Non-blocking - just log to console if this fails
          logger.warn('Failed to log API usage:', err);
        });
        
        return {
          text: response.data.choices[0].message.content,
          usage: response.data.usage
        };
      } catch (error) {
        throw parseOpenAIError(error, context);
      }
    };
    
    // Execute with retry for transient errors
    return await retryWithBackoff(
      generateTextFn,
      3,
      500,
      (error) => {
        // Only retry on rate limits, network errors, and server errors
        return [
          ErrorTypes.RATE_LIMIT_ERROR,
          ErrorTypes.NETWORK_ERROR,
          ErrorTypes.TIMEOUT_ERROR
        ].includes(error.type);
      }
    );
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof OpenAIError)) {
      error = new OpenAIError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

/**
 * Generate images using DALL-E 3
 * 
 * @param {Object} params - Image generation parameters
 * @param {string} params.prompt - The prompt to generate image from
 * @param {string} params.size - Image size (1024x1024, 1024x1792, 1792x1024)
 * @param {number} params.n - Number of images to generate
 * @returns {Promise<Object>} - Generated image URLs
 */
async function generateImage(params) {
  const functionName = 'generateImage';
  const context = { params };
  
  try {
    // Validate API key and parameters
    validateApiKey();
    validateImageParams(params);
    
    const generateImageFn = async () => {
      try {
        const options = {
          method: 'POST',
          url: 'https://api.openai.com/v1/images/generations',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          data: {
            model: "dall-e-3",
            prompt: params.prompt,
            n: params.n || 1,
            size: params.size || "1024x1024",
            quality: "standard",
            response_format: "url"
          },
          timeout: 60000 // 60 second timeout for image generation
        };

        const response = await axios.request(options);
        
        // Log API usage for monitoring
        await db.collection('apiUsage').add({
          api: 'openai',
          model: 'dall-e-3',
          imagesGenerated: params.n || 1,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }).catch(err => {
          // Non-blocking - just log to console if this fails
          logger.warn('Failed to log API usage:', err);
        });
        
        return {
          images: response.data.data.map(img => img.url)
        };
      } catch (error) {
        throw parseOpenAIError(error, context);
      }
    };
    
    // Execute with retry for transient errors
    return await retryWithBackoff(
      generateImageFn,
      3,
      1000, // Longer base delay for image generation
      (error) => {
        // Only retry on rate limits, network errors, and server errors
        return [
          ErrorTypes.RATE_LIMIT_ERROR,
          ErrorTypes.NETWORK_ERROR,
          ErrorTypes.TIMEOUT_ERROR
        ].includes(error.type);
      }
    );
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof OpenAIError)) {
      error = new OpenAIError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

/**
 * Generate marketing content using OpenAI
 * 
 * @param {Object} params - Content generation parameters
 * @param {string} params.type - Content type (email, social, blog, ad)
 * @param {string} params.topic - Topic to generate content about
 * @param {string} params.tone - Tone of the content
 * @param {number} params.length - Approximate length in words
 * @returns {Promise<Object>} - Generated marketing content
 */
async function generateMarketingContent(params) {
  const functionName = 'generateMarketingContent';
  const context = { params };
  
  try {
    // Validate required parameters
    if (!params) {
      throw new OpenAIError(
        'Parameters are required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    if (!params.topic) {
      throw new OpenAIError(
        'Topic is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    if (!params.type || !['email', 'social', 'blog', 'ad'].includes(params.type)) {
      throw new OpenAIError(
        'Valid content type is required (email, social, blog, ad)',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    const promptMap = {
      email: `Write a marketing email about ${params.topic}. Tone: ${params.tone || 'professional'}. Length: approximately ${params.length || 200} words.`,
      social: `Write a social media post about ${params.topic}. Tone: ${params.tone || 'engaging'}. Length: approximately ${params.length || 100} words.`,
      blog: `Write a blog post about ${params.topic}. Tone: ${params.tone || 'informative'}. Length: approximately ${params.length || 500} words.`,
      ad: `Write ad copy about ${params.topic}. Tone: ${params.tone || 'persuasive'}. Length: approximately ${params.length || 50} words.`
    };

    const prompt = promptMap[params.type];
    
    // Calculate appropriate max tokens based on requested length
    const maxTokens = Math.min(4000, (params.length || 200) * 2);
    
    return generateText({
      prompt,
      max_tokens: maxTokens,
      temperature: 0.7
    });
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof OpenAIError)) {
      error = new OpenAIError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to generate marketing content: ${error.message}`);
  }
}

module.exports = {
    generateText,
    generateImage,
    generateMarketingContent
};
