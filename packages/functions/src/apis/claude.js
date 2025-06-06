/**
 * Anthropic Claude API Integration
 * 
 * This module provides production-ready functions to interact with Anthropic's Claude API
 * for AI-powered features in the ReachSpark platform.
 * 
 * Features:
 * - Comprehensive error handling with detailed error messages
 * - Automatic retry logic for transient failures
 * - Secure API key management
 * - Token usage tracking and logging
 * - Support for all Claude models (Opus, Sonnet, Haiku)
 * - Fallback mechanisms when API calls fail
 */

const { Anthropic } = require("@anthropic-ai/sdk");
const functions = require("firebase-functions");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Claude API configuration
// IMPORTANT: API key is stored securely in Firebase config
const CLAUDE_API_KEY = functions.config().claude?.api_key;
const CLAUDE_API_BASE_URL = "https://api.anthropic.com/v1";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRY_BACKOFF_FACTOR = 2;

// Model configuration
const CLAUDE_MODELS = {
  OPUS: "claude-3-opus-20240229",
  SONNET: "claude-3-sonnet-20240229",
  HAIKU: "claude-3-haiku-20240307"
};

// Default model selection based on task complexity
const DEFAULT_MODEL_BY_TASK = {
  COMPLEX: CLAUDE_MODELS.OPUS,
  STANDARD: CLAUDE_MODELS.SONNET,
  SIMPLE: CLAUDE_MODELS.HAIKU
};

/**
 * Initialize the Anthropic client with proper error handling
 * @returns {Object} Anthropic client instance
 */
function getAnthropicClient() {
  if (!CLAUDE_API_KEY) {
    logger.error("Claude API key is not configured in Firebase Functions config.");
    throw new Error("Claude API key is missing. Please configure it in Firebase Functions config.");
  }

  try {
    return new Anthropic({
      apiKey: CLAUDE_API_KEY,
    });
  } catch (error) {
    logger.error("Failed to initialize Anthropic client:", error);
    throw new Error("Failed to initialize Anthropic client: " + error.message);
  }
}

/**
 * Log API usage to Firestore for tracking and monitoring
 * @param {string} model - The Claude model used
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @param {string} feature - Feature using the API (e.g., 'aiMarketingCopilot')
 * @param {string} operation - Operation performed (e.g., 'generateText')
 * @param {string} status - Status of the operation ('success' or 'error')
 * @param {string} [errorMessage] - Optional error message if status is 'error'
 * @returns {Promise<void>}
 */
async function logApiUsage(model, inputTokens, outputTokens, feature, operation, status, errorMessage = null) {
  try {
    const usageLog = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      provider: 'claude',
      model: model,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalTokens: inputTokens + outputTokens,
      feature: feature,
      operation: operation,
      status: status,
      errorMessage: errorMessage
    };

    await db.collection('apiUsageLogs').add(usageLog);
    
    // Also update aggregated usage statistics
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const statsRef = db.collection('apiUsageStats').doc(`claude_${dateString}`);
    await db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      if (!statsDoc.exists) {
        transaction.set(statsRef, {
          date: dateString,
          provider: 'claude',
          totalCalls: 1,
          totalInputTokens: inputTokens,
          totalOutputTokens: outputTokens,
          totalTokens: inputTokens + outputTokens,
          successCalls: status === 'success' ? 1 : 0,
          errorCalls: status === 'error' ? 1 : 0,
          modelUsage: {
            [model]: {
              calls: 1,
              inputTokens: inputTokens,
              outputTokens: outputTokens
            }
          },
          featureUsage: {
            [feature]: {
              calls: 1,
              inputTokens: inputTokens,
              outputTokens: outputTokens
            }
          }
        });
      } else {
        const data = statsDoc.data();
        
        // Update model usage
        const modelStats = data.modelUsage?.[model] || { calls: 0, inputTokens: 0, outputTokens: 0 };
        modelStats.calls += 1;
        modelStats.inputTokens += inputTokens;
        modelStats.outputTokens += outputTokens;
        
        // Update feature usage
        const featureStats = data.featureUsage?.[feature] || { calls: 0, inputTokens: 0, outputTokens: 0 };
        featureStats.calls += 1;
        featureStats.inputTokens += inputTokens;
        featureStats.outputTokens += outputTokens;
        
        transaction.update(statsRef, {
          totalCalls: admin.firestore.FieldValue.increment(1),
          totalInputTokens: admin.firestore.FieldValue.increment(inputTokens),
          totalOutputTokens: admin.firestore.FieldValue.increment(outputTokens),
          totalTokens: admin.firestore.FieldValue.increment(inputTokens + outputTokens),
          successCalls: admin.firestore.FieldValue.increment(status === 'success' ? 1 : 0),
          errorCalls: admin.firestore.FieldValue.increment(status === 'error' ? 1 : 0),
          [`modelUsage.${model}`]: modelStats,
          [`featureUsage.${feature}`]: featureStats
        });
      }
    });
  } catch (error) {
    // Non-blocking error - log but don't throw
    logger.error("Error logging Claude API usage:", error);
  }
}

/**
 * Check if Claude API is available and the key is valid
 * @returns {Promise<boolean>} True if API is available and key is valid
 */
async function isApiAvailable() {
  if (!CLAUDE_API_KEY) {
    return false;
  }

  try {
    // Make a minimal API call to check if the API is available
    const response = await axios.get(`${CLAUDE_API_BASE_URL}/models`, {
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });
    
    return response.status === 200;
  } catch (error) {
    logger.warn("Claude API availability check failed:", error.message);
    return false;
  }
}

/**
 * Generate text using Anthropic's Claude models with retry logic
 * 
 * @param {Object} params - Text generation parameters
 * @param {Array<Object>} params.messages - The conversation history (e.g., [{ role: 'user', content: 'Hello!' }])
 * @param {string} [params.model] - The model to use (defaults based on complexity)
 * @param {number} [params.max_tokens] - Maximum tokens to generate
 * @param {number} [params.temperature] - Randomness of the generation (0.0 to 1.0)
 * @param {string} [params.system] - Optional system prompt
 * @param {string} [params.feature='unknown'] - Feature using this function
 * @param {string} [params.complexity='STANDARD'] - Task complexity (COMPLEX, STANDARD, SIMPLE)
 * @param {boolean} [params.stream=false] - Whether to stream the response
 * @param {function} [params.onStream] - Callback for streaming responses
 * @returns {Promise<Object>} - Generated text and usage info
 */
async function generateText(params) {
  // Validate required parameters
  if (!params.messages || !Array.isArray(params.messages) || params.messages.length === 0) {
    throw new Error("Messages array is required and must not be empty");
  }

  // Set default values and determine model based on complexity
  const complexity = params.complexity || 'STANDARD';
  const defaultModel = DEFAULT_MODEL_BY_TASK[complexity] || CLAUDE_MODELS.SONNET;
  const model = params.model || defaultModel;
  const feature = params.feature || 'unknown';
  const operation = 'generateText';
  
  // Initialize the client
  const anthropic = getAnthropicClient();
  
  // Implement retry logic
  let retries = 0;
  let lastError = null;
  let delay = RETRY_DELAY_MS;

  while (retries <= MAX_RETRIES) {
    try {
      // If this is a retry, log the attempt
      if (retries > 0) {
        logger.info(`Claude API retry attempt ${retries}/${MAX_RETRIES} after ${delay}ms delay`);
      }

      // Prepare request parameters
      const requestParams = {
        model: model,
        max_tokens: params.max_tokens || 1024,
        temperature: params.temperature === undefined ? 0.7 : params.temperature,
        messages: params.messages,
      };
      
      // Add optional parameters if provided
      if (params.system) {
        requestParams.system = params.system;
      }
      
      // Handle streaming if requested
      if (params.stream && typeof params.onStream === 'function') {
        const stream = await anthropic.messages.create({
          ...requestParams,
          stream: true
        });
        
        let accumulatedText = '';
        let usage = { input_tokens: 0, output_tokens: 0 };
        
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text') {
            accumulatedText += chunk.delta.text;
            params.onStream(chunk.delta.text);
          }
          
          if (chunk.type === 'message_delta' && chunk.usage) {
            usage = chunk.usage;
          }
        }
        
        // Log successful API usage
        await logApiUsage(
          model,
          usage.input_tokens,
          usage.output_tokens,
          feature,
          operation,
          'success'
        );
        
        return {
          text: accumulatedText,
          usage: usage,
          model: model,
          stop_reason: 'stop', // Streaming doesn't provide stop_reason in the same way
        };
      } else {
        // Non-streaming request
        const message = await anthropic.messages.create(requestParams);
        
        // Extract the text content from the response
        const generatedText = message.content && message.content.length > 0 && message.content[0].type === 'text' 
                              ? message.content[0].text 
                              : '';
        
        // Log successful API usage
        await logApiUsage(
          model,
          message.usage.input_tokens,
          message.usage.output_tokens,
          feature,
          operation,
          'success'
        );
        
        return {
          text: generatedText,
          usage: {
            input_tokens: message.usage.input_tokens,
            output_tokens: message.usage.output_tokens,
          },
          model: message.model,
          stop_reason: message.stop_reason,
        };
      }
    } catch (error) {
      lastError = error;
      
      // Determine if error is retryable
      const isRetryable = (
        error.status === 429 || // Rate limit
        error.status === 500 || // Server error
        error.status === 503 || // Service unavailable
        error.message.includes('timeout') ||
        error.message.includes('network')
      );
      
      // Log the error
      logger.error(`Claude API error (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, {
        error: error.message,
        status: error.status,
        isRetryable
      });
      
      // If we've exhausted retries or the error is not retryable, log and throw
      if (retries >= MAX_RETRIES || !isRetryable) {
        // Log failed API usage
        await logApiUsage(
          model,
          0, // We don't know input tokens for failed requests
          0, // We don't know output tokens for failed requests
          feature,
          operation,
          'error',
          error.message
        );
        
        // Provide detailed error information
        const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error";
        throw new Error(`Failed to generate text with Claude after ${retries + 1} attempts: ${errorMessage}`);
      }
      
      // Exponential backoff for retries
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= RETRY_BACKOFF_FACTOR;
      retries++;
    }
  }
  
  // This should never be reached due to the throw in the catch block
  throw lastError;
}

/**
 * Generate marketing content using Claude with enhanced capabilities
 * 
 * @param {Object} params - Content generation parameters
 * @param {string} params.type - Content type (email, social, blog, ad)
 * @param {string} params.topic - Topic to generate content about
 * @param {string} params.tone - Tone of the content
 * @param {number} params.length - Approximate length in words
 * @param {string} [params.model] - Optional model override
 * @param {Object} [params.brandKit] - Optional brand kit information
 * @param {Array<string>} [params.keywords] - Optional SEO keywords to include
 * @param {string} [params.audience] - Optional target audience
 * @param {string} [params.callToAction] - Optional call to action
 * @param {boolean} [params.stream] - Whether to stream the response
 * @param {function} [params.onStream] - Callback for streaming responses
 * @returns {Promise<Object>} - Generated marketing content
 */
async function generateMarketingContent(params) {
  // Determine task complexity based on content type and length
  let complexity = 'STANDARD';
  if (params.type === 'blog' && params.length > 1000) {
    complexity = 'COMPLEX';
  } else if (params.type === 'social' && params.length < 100) {
    complexity = 'SIMPLE';
  }
  
  // Build a comprehensive system prompt that includes brand voice if available
  let systemPrompt = 'You are a creative and effective marketing assistant for the ReachSpark platform. Generate high-quality marketing content based on the user request.';
  
  if (params.brandKit) {
    systemPrompt += `\n\nYou must follow these brand guidelines:
- Brand voice: ${params.brandKit.voice || 'Professional and engaging'}
- Brand tone: ${params.brandKit.tone || 'Conversational yet authoritative'}
- Brand personality: ${params.brandKit.personality || 'Helpful, innovative, and trustworthy'}`;
  }
  
  if (params.keywords && params.keywords.length > 0) {
    systemPrompt += `\n\nIncorporate these keywords naturally: ${params.keywords.join(', ')}`;
  }
  
  if (params.audience) {
    systemPrompt += `\n\nTarget audience: ${params.audience}`;
  }
  
  // Build a detailed user prompt based on content type
  const promptMap = {
    email: `Write a marketing email about "${params.topic}". The tone should be ${params.tone}. Aim for approximately ${params.length} words.${params.callToAction ? ` Include this call to action: ${params.callToAction}` : ''}`,
    social: `Write a social media post about "${params.topic}". The tone should be ${params.tone}. Keep it concise, suitable for social media, around ${params.length} words.${params.callToAction ? ` Include this call to action: ${params.callToAction}` : ''}`,
    blog: `Write a blog post about "${params.topic}". The tone should be ${params.tone}. The length should be approximately ${params.length} words.${params.callToAction ? ` Include this call to action: ${params.callToAction}` : ''}`,
    ad: `Write compelling ad copy for "${params.topic}". The tone should be ${params.tone}. Keep it short and impactful, around ${params.length} words.${params.callToAction ? ` Include this call to action: ${params.callToAction}` : ''}`
  };

  const userPrompt = promptMap[params.type] || `Write marketing content about "${params.topic}". The tone should be ${params.tone}. Aim for approximately ${params.length} words.${params.callToAction ? ` Include this call to action: ${params.callToAction}` : ''}`;
  
  // Estimate max_tokens based on words (rough estimate, adjust as needed)
  // Assuming ~1.5 tokens per word on average for English
  const estimatedTokens = Math.ceil(params.length * 1.5);
  // Add buffer and ensure it doesn't exceed model limits
  const maxTokens = Math.min(4000, estimatedTokens + 200); 

  try {
    return await generateText({
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
      max_tokens: maxTokens,
      temperature: params.temperature || 0.7,
      model: params.model,
      feature: 'aiMarketingCopilot',
      complexity: complexity,
      stream: params.stream,
      onStream: params.onStream
    });
  } catch (error) {
    logger.error("Error generating marketing content with Claude:", error);
    throw new Error(`Failed to generate marketing content: ${error.message}`);
  }
}

/**
 * Analyze content semantics using Claude
 * 
 * @param {Object} params - Content analysis parameters
 * @param {string} params.content - The content to analyze
 * @param {string} [params.model] - Optional model override
 * @param {string} [params.contentType] - Type of content (blog, social, email, etc.)
 * @returns {Promise<Object>} - Semantic analysis results
 */
async function analyzeContentSemantics(params) {
  if (!params.content) {
    throw new Error("Content is required for semantic analysis");
  }

  const systemPrompt = `You are an expert content analyst for the ReachSpark platform. Analyze the provided content and extract key semantic information.`;
  
  const userPrompt = `
    Analyze this ${params.contentType || 'marketing'} content semantically:
    
    "${params.content.substring(0, 8000)}"
    
    Provide a detailed analysis including:
    1. Main topics and themes
    2. Key entities (people, places, products, etc.)
    3. Sentiment analysis (overall tone and emotional content)
    4. Content structure analysis
    5. Linguistic style and readability metrics
    6. Target audience indicators
    7. Call-to-action effectiveness
    8. SEO relevance
    
    Format your response as JSON with these categories.
  `;

  try {
    const result = await generateText({
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
      max_tokens: 2000,
      temperature: 0.3,
      model: params.model || CLAUDE_MODELS.SONNET,
      feature: 'semanticContentIntelligence',
      complexity: 'COMPLEX'
    });
    
    // Parse the JSON response
    try {
      // Extract JSON from the text (in case there's any non-JSON text)
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      logger.error("Error parsing Claude semantic analysis:", parseError);
      throw new Error(`Failed to parse semantic analysis: ${parseError.message}`);
    }
  } catch (error) {
    logger.error("Error analyzing content semantics with Claude:", error);
    throw new Error(`Failed to analyze content semantics: ${error.message}`);
  }
}

/**
 * Generate content variations based on performance data
 * 
 * @param {Object} params - Variation generation parameters
 * @param {string} params.originalContent - The original content
 * @param {Object} params.performanceData - Performance data for the original content
 * @param {number} params.numVariations - Number of variations to generate
 * @param {string} [params.model] - Optional model override
 * @returns {Promise<Array<Object>>} - Generated content variations
 */
async function generateContentVariations(params) {
  if (!params.originalContent) {
    throw new Error("Original content is required for generating variations");
  }

  const systemPrompt = `You are an expert content optimizer for the ReachSpark platform. Generate improved variations of the provided content based on performance data.`;
  
  const userPrompt = `
    Original content:
    "${params.originalContent.substring(0, 4000)}"
    
    Performance data:
    ${JSON.stringify(params.performanceData || {}, null, 2)}
    
    Generate ${params.numVariations || 3} variations of this content that might perform better based on the performance data.
    Each variation should address potential weaknesses in the original while maintaining its core message.
    
    Format your response as JSON with an array of variations, each containing:
    1. "content": The variation text
    2. "rationale": Why this variation might perform better
    3. "targetMetrics": Which metrics this variation aims to improve
  `;

  try {
    const result = await generateText({
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
      max_tokens: 3000,
      temperature: 0.7,
      model: params.model || CLAUDE_MODELS.SONNET,
      feature: 'semanticContentIntelligence',
      complexity: 'COMPLEX'
    });
    
    // Parse the JSON response
    try {
      // Extract JSON from the text (in case there's any non-JSON text)
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.variations || [];
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      logger.error("Error parsing Claude content variations:", parseError);
      throw new Error(`Failed to parse content variations: ${parseError.message}`);
    }
  } catch (error) {
    logger.error("Error generating content variations with Claude:", error);
    throw new Error(`Failed to generate content variations: ${error.message}`);
  }
}

/**
 * Get fallback response when Claude API is unavailable
 * 
 * @param {string} feature - The feature requesting fallback
 * @param {string} operation - The operation that failed
 * @returns {Object} - Fallback response
 */
function getFallbackResponse(feature, operation) {
  logger.warn(`Using fallback response for ${feature}.${operation} due to Claude API unavailability`);
  
  // Generic fallback responses by feature and operation
  const fallbacks = {
    aiMarketingCopilot: {
      generateMarketingContent: {
        text: "I'm unable to generate marketing content at the moment. Please try again later or contact support if the issue persists.",
        usage: { input_tokens: 0, output_tokens: 0 },
        model: "fallback",
        stop_reason: "api_unavailable"
      }
    },
    semanticContentIntelligence: {
      analyzeContentSemantics: {
        topics: ["Unable to analyze topics"],
        entities: ["Unable to analyze entities"],
        sentiment: {
          overall: "neutral",
          emotional_content: "Unable to analyze emotional content"
        },
        structure: "Unable to analyze structure",
        style: {
          readability: "Unable to analyze readability",
          complexity: "medium"
        },
        targetAudience: "Unable to analyze target audience",
        callToAction: "Unable to analyze call to action",
        seoRelevance: "Unable to analyze SEO relevance"
      },
      generateContentVariations: []
    }
  };
  
  // Return specific fallback if available, otherwise generic message
  return fallbacks[feature]?.[operation] || {
    text: "Service temporarily unavailable. Please try again later.",
    error: "API_UNAVAILABLE",
    usage: { input_tokens: 0, output_tokens: 0 }
  };
}

module.exports = {
  // Core API functions
  generateText,
  generateMarketingContent,
  analyzeContentSemantics,
  generateContentVariations,
  
  // Utility functions
  isApiAvailable,
  logApiUsage,
  getFallbackResponse,
  
  // Constants
  CLAUDE_MODELS,
  DEFAULT_MODEL_BY_TASK
};
