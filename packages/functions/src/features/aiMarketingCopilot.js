/**
 * AI Marketing Copilot
 * 
 * This module implements the AI Marketing Copilot feature, which provides
 * intelligent assistance to marketers by suggesting improvements, generating
 * content variations, recommending optimal timing, and providing real-time coaching.
 * 
 * The Copilot leverages OpenAI, Gemini, and Claude APIs to provide comprehensive
 * marketing intelligence and assistance through a multiagent system.
 */

const functions = require('firebase-functions');
const { openai, gemini, claude } = require('../apis');
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
 * Custom error class for Marketing Copilot errors
 */
class MarketingCopilotError extends Error {
  constructor(message, type, originalError = null, context = {}) {
    super(message);
    this.name = 'MarketingCopilotError';
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
 * Select the best AI model for a specific task based on capabilities and availability
 * @param {string} preferredModel - Preferred AI model
 * @param {string} taskType - Type of task
 * @returns {string} Selected model name
 */
const selectBestModel = (preferredModel, taskType) => {
  // Define model capabilities and preferences
  const modelCapabilities = {
    openai: {
      contentGeneration: 9,
      marketingAnalysis: 8,
      creativeSuggestions: 9,
      structuredOutput: 9
    },
    gemini: {
      contentGeneration: 8,
      marketingAnalysis: 7,
      creativeSuggestions: 8,
      structuredOutput: 7
    },
    claude: {
      contentGeneration: 9,
      marketingAnalysis: 9,
      creativeSuggestions: 8,
      structuredOutput: 8
    }
  };
  
  // Map task types to required capabilities
  const taskCapabilityMap = {
    'campaignSuggestions': ['marketingAnalysis', 'structuredOutput'],
    'contentVariations': ['contentGeneration', 'creativeSuggestions'],
    'realTimeCoaching': ['marketingAnalysis', 'structuredOutput'],
    'competitiveIntelligence': ['marketingAnalysis', 'structuredOutput']
  };
  
  // If preferred model is specified and valid, use it
  if (preferredModel && modelCapabilities[preferredModel]) {
    return preferredModel;
  }
  
  // Otherwise, select best model for the task
  const requiredCapabilities = taskCapabilityMap[taskType] || ['contentGeneration'];
  
  let bestModel = 'openai'; // Default
  let highestScore = 0;
  
  Object.entries(modelCapabilities).forEach(([model, capabilities]) => {
    const score = requiredCapabilities.reduce((sum, capability) => sum + capabilities[capability], 0);
    if (score > highestScore) {
      highestScore = score;
      bestModel = model;
    }
  });
  
  return bestModel;
};

/**
 * Generate campaign improvement suggestions based on performance data
 * @param {string} campaignId - ID of the campaign to analyze
 * @param {string} model - AI model to use ('openai', 'gemini', or 'claude')
 * @returns {Promise<Array>} List of improvement suggestions
 */
const generateCampaignSuggestions = async (campaignId, model = 'openai') => {
  const functionName = 'generateCampaignSuggestions';
  const context = { campaignId, model };
  
  try {
    // Validate inputs
    if (!campaignId) {
      throw new MarketingCopilotError(
        'Campaign ID is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Select best model for this task
    const selectedModel = selectBestModel(model, 'campaignSuggestions');
    
    // Get campaign data from Firestore with retry
    const getCampaignData = async () => {
      try {
        const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
        
        if (!campaignDoc.exists) {
          throw new MarketingCopilotError(
            `Campaign with ID ${campaignId} not found`,
            ErrorTypes.NOT_FOUND_ERROR,
            null,
            context
          );
        }
        
        return campaignDoc.data();
      } catch (error) {
        if (error.name === 'MarketingCopilotError') {
          throw error; // Re-throw our custom errors
        }
        
        throw new MarketingCopilotError(
          `Failed to retrieve campaign data: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const campaign = await retryWithBackoff(
      getCampaignData,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Get performance metrics with retry
    const getPerformanceMetrics = async () => {
      try {
        const metricsQuery = await db.collection('campaignMetrics')
          .where('campaignId', '==', campaignId)
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();
        
        const metrics = [];
        metricsQuery.forEach(doc => {
          metrics.push(doc.data());
        });
        
        return metrics;
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to retrieve performance metrics: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const metrics = await retryWithBackoff(
      getPerformanceMetrics,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Prepare prompt for AI
    const prompt = `
      As an expert marketing advisor, analyze this campaign and suggest improvements:
      
      Campaign Name: ${campaign.name}
      Campaign Type: ${campaign.type}
      Target Audience: ${campaign.targetAudience}
      Current Content: ${campaign.content}
      Call to Action: ${campaign.cta}
      
      Performance Metrics:
      ${metrics.map(m => `- ${m.timestamp}: Opens: ${m.opens}, Clicks: ${m.clicks}, Conversions: ${m.conversions}`).join('\n')}
      
      Based on this data, provide 5 specific, actionable suggestions to improve this campaign's performance.
      Format each suggestion as: [Suggestion Title]: [Detailed explanation with specific changes]
    `;
    
    // Get suggestions from selected AI model with retry
    const generateSuggestions = async () => {
      try {
        let suggestions;
        
        switch (selectedModel) {
          case 'gemini':
            suggestions = await gemini.generateContent(prompt);
            break;
          case 'claude':
            suggestions = await claude.generateContent(prompt, {
              max_tokens: 1000,
              temperature: 0.7
            });
            break;
          default: // openai
            suggestions = await openai.generateContent(prompt, {
              max_tokens: 1000,
              temperature: 0.7
            });
        }
        
        return suggestions;
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to generate suggestions using ${selectedModel}: ${error.message}`,
          ErrorTypes.AI_SERVICE_ERROR,
          error,
          { ...context, selectedModel }
        );
      }
    };
    
    const suggestions = await retryWithBackoff(
      generateSuggestions,
      3,
      500,
      (error) => error.type === ErrorTypes.AI_SERVICE_ERROR
    );
    
    // Parse suggestions into structured format
    let parsedSuggestions;
    try {
      parsedSuggestions = parseSuggestions(suggestions);
    } catch (error) {
      throw new MarketingCopilotError(
        `Failed to parse suggestions: ${error.message}`,
        ErrorTypes.PARSING_ERROR,
        error,
        { ...context, suggestions }
      );
    }
    
    // Store suggestions in Firestore
    const storeSuggestions = async () => {
      try {
        await db.collection('campaignSuggestions').add({
          campaignId,
          suggestions: parsedSuggestions,
          model: selectedModel,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          implemented: false
        });
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to store suggestions: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, parsedSuggestions }
        );
      }
    };
    
    await retryWithBackoff(
      storeSuggestions,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    return parsedSuggestions;
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof MarketingCopilotError)) {
      error = new MarketingCopilotError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to generate campaign suggestions: ${error.message}`);
  }
};

/**
 * Generate content variations for A/B testing
 * @param {string} contentId - ID of the content to create variations for
 * @param {number} variations - Number of variations to generate
 * @param {string} model - AI model to use ('openai', 'gemini', or 'claude')
 * @returns {Promise<Array>} List of content variations
 */
const generateContentVariations = async (contentId, variations = 3, model = 'openai') => {
  const functionName = 'generateContentVariations';
  const context = { contentId, variations, model };
  
  try {
    // Validate inputs
    if (!contentId) {
      throw new MarketingCopilotError(
        'Content ID is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    if (variations < 1 || variations > 10) {
      throw new MarketingCopilotError(
        'Number of variations must be between 1 and 10',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Select best model for this task
    const selectedModel = selectBestModel(model, 'contentVariations');
    
    // Get original content from Firestore with retry
    const getOriginalContent = async () => {
      try {
        const contentDoc = await db.collection('marketingContent').doc(contentId).get();
        
        if (!contentDoc.exists) {
          throw new MarketingCopilotError(
            `Content with ID ${contentId} not found`,
            ErrorTypes.NOT_FOUND_ERROR,
            null,
            context
          );
        }
        
        return contentDoc.data();
      } catch (error) {
        if (error.name === 'MarketingCopilotError') {
          throw error; // Re-throw our custom errors
        }
        
        throw new MarketingCopilotError(
          `Failed to retrieve content data: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const content = await retryWithBackoff(
      getOriginalContent,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Prepare prompt for AI
    const prompt = `
      As an expert copywriter, create ${variations} distinct variations of this marketing content:
      
      Original Content: "${content.text}"
      Content Type: ${content.type}
      Target Audience: ${content.targetAudience}
      Brand Voice: ${content.brandVoice}
      Key Message: ${content.keyMessage}
      
      Create ${variations} unique variations that maintain the key message but use different:
      - Headlines/opening lines
      - Tone and voice
      - Structure and flow
      - Call to action phrasing
      
      For each variation, keep a similar length to the original.
      Format each variation as: "Variation #: [content]"
    `;
    
    // Get variations from selected AI model with retry
    const generateVariations = async () => {
      try {
        let generatedVariations;
        
        switch (selectedModel) {
          case 'gemini':
            generatedVariations = await gemini.generateContent(prompt);
            break;
          case 'claude':
            generatedVariations = await claude.generateContent(prompt, {
              max_tokens: 1500,
              temperature: 0.8
            });
            break;
          default: // openai
            generatedVariations = await openai.generateContent(prompt, {
              max_tokens: 1500,
              temperature: 0.8
            });
        }
        
        return generatedVariations;
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to generate content variations using ${selectedModel}: ${error.message}`,
          ErrorTypes.AI_SERVICE_ERROR,
          error,
          { ...context, selectedModel }
        );
      }
    };
    
    const generatedVariations = await retryWithBackoff(
      generateVariations,
      3,
      500,
      (error) => error.type === ErrorTypes.AI_SERVICE_ERROR
    );
    
    // Parse variations into structured format
    let parsedVariations;
    try {
      parsedVariations = parseContentVariations(generatedVariations, variations);
    } catch (error) {
      throw new MarketingCopilotError(
        `Failed to parse content variations: ${error.message}`,
        ErrorTypes.PARSING_ERROR,
        error,
        { ...context, generatedVariations }
      );
    }
    
    // Store variations in Firestore
    const storeVariations = async () => {
      try {
        const batch = db.batch();
        parsedVariations.forEach((variation, index) => {
          const variationRef = db.collection('contentVariations').doc();
          batch.set(variationRef, {
            originalContentId: contentId,
            text: variation,
            variationNumber: index + 1,
            model: selectedModel,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            tested: false,
            performance: null
          });
        });
        await batch.commit();
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to store content variations: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, parsedVariations }
        );
      }
    };
    
    await retryWithBackoff(
      storeVariations,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    return parsedVariations;
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof MarketingCopilotError)) {
      error = new MarketingCopilotError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to generate content variations: ${error.message}`);
  }
};

/**
 * Recommend optimal send times based on historical data
 * @param {string} userId - ID of the user to generate recommendations for
 * @param {string} channelType - Channel type (email, social, etc.)
 * @returns {Promise<Object>} Optimal send time recommendations
 */
const recommendOptimalSendTimes = async (userId, channelType) => {
  const functionName = 'recommendOptimalSendTimes';
  const context = { userId, channelType };
  
  try {
    // Validate inputs
    if (!userId) {
      throw new MarketingCopilotError(
        'User ID is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    if (!channelType) {
      throw new MarketingCopilotError(
        'Channel type is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Get user's campaign history with retry
    const getUserCampaigns = async () => {
      try {
        const campaignsQuery = await db.collection('campaigns')
          .where('userId', '==', userId)
          .where('channelType', '==', channelType)
          .get();
        
        return campaignsQuery;
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to retrieve user campaigns: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const campaignsQuery = await retryWithBackoff(
      getUserCampaigns,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    if (campaignsQuery.empty) {
      // Not enough historical data, use industry benchmarks
      logger.info(`No historical data found for user ${userId} on channel ${channelType}, using industry benchmarks`);
      return getIndustryBenchmarkTimes(channelType);
    }
    
    // Collect performance data by time
    const performanceByTime = {};
    const campaignPromises = [];
    
    campaignsQuery.forEach(doc => {
      const campaign = doc.data();
      const promise = db.collection('campaignMetrics')
        .where('campaignId', '==', doc.id)
        .get()
        .then(metricsSnapshot => {
          metricsSnapshot.forEach(metricDoc => {
            const metric = metricDoc.data();
            
            // Validate timestamp data
            if (!metric.sendTimestamp) {
              logger.warn(`Missing sendTimestamp for campaign metric ${metricDoc.id}`);
              return;
            }
            
            try {
              const sendTime = new Date(metric.sendTimestamp);
              const hour = sendTime.getHours();
              const day = sendTime.getDay();
              
              const timeKey = `${day}-${hour}`;
              if (!performanceByTime[timeKey]) {
                performanceByTime[timeKey] = {
                  day,
                  hour,
                  campaigns: 0,
                  totalOpens: 0,
                  totalClicks: 0,
                  totalConversions: 0
                };
              }
              
              performanceByTime[timeKey].campaigns++;
              performanceByTime[timeKey].totalOpens += metric.opens || 0;
              performanceByTime[timeKey].totalClicks += metric.clicks || 0;
              performanceByTime[timeKey].totalConversions += metric.conversions || 0;
            } catch (error) {
              logger.warn(`Error processing timestamp for campaign metric ${metricDoc.id}: ${error.message}`);
            }
          });
        })
        .catch(error => {
          logger.error(`Error retrieving metrics for campaign ${doc.id}: ${error.message}`);
          // Continue processing other campaigns despite this error
        });
      
      campaignPromises.push(promise);
    });
    
    try {
      await Promise.all(campaignPromises);
    } catch (error) {
      // Log the error but continue with any data we've collected
      logger.error(`Error collecting campaign metrics: ${error.message}`);
    }
    
    // Check if we have enough data
    if (Object.keys(performanceByTime).length === 0) {
      logger.info(`No usable performance data found for user ${userId} on channel ${channelType}, using industry benchmarks`);
      return getIndustryBenchmarkTimes(channelType);
    }
    
    // Calculate average performance metrics
    Object.keys(performanceByTime).forEach(timeKey => {
      const data = performanceByTime[timeKey];
      data.avgOpens = data.totalOpens / data.campaigns;
      data.avgClicks = data.totalClicks / data.campaigns;
      data.avgConversions = data.totalConversions / data.campaigns;
      data.engagementScore = (data.avgOpens * 1) + (data.avgClicks * 3) + (data.avgConversions * 10);
    });
    
    // Sort by engagement score
    const sortedTimes = Object.values(performanceByTime).sort((a, b) => b.engagementScore - a.engagementScore);
    
    // Get top 3 times
    const topTimes = sortedTimes.slice(0, 3).map(time => ({
      day: getDayName(time.day),
      hour: formatHour(time.hour),
      engagementScore: time.engagementScore.toFixed(2)
    }));
    
    return {
      channelType,
      recommendedTimes: topTimes,
      basedOn: 'historical data',
      totalCampaignsAnalyzed: campaignsQuery.size
    };
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof MarketingCopilotError)) {
      error = new MarketingCopilotError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to recommend optimal send times: ${error.message}`);
  }
};

/**
 * Provide real-time coaching during campaign creation
 * @param {Object} campaignDraft - Draft campaign data
 * @param {string} model - AI model to use ('openai', 'gemini', or 'claude')
 * @returns {Promise<Object>} Coaching feedback
 */
const provideRealTimeCoaching = async (campaignDraft, model = 'openai') => {
  const functionName = 'provideRealTimeCoaching';
  const context = { campaignDraft, model };
  
  try {
    // Validate inputs
    if (!campaignDraft) {
      throw new MarketingCopilotError(
        'Campaign draft is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Validate required campaign draft fields
    const requiredFields = ['name', 'type', 'targetAudience', 'content', 'cta'];
    const missingFields = requiredFields.filter(field => !campaignDraft[field]);
    
    if (missingFields.length > 0) {
      throw new MarketingCopilotError(
        `Campaign draft is missing required fields: ${missingFields.join(', ')}`,
        ErrorTypes.VALIDATION_ERROR,
        null,
        { ...context, missingFields }
      );
    }
    
    // Select best model for this task
    const selectedModel = selectBestModel(model, 'realTimeCoaching');
    
    // Prepare prompt for AI
    const prompt = `
      As an expert marketing coach, provide real-time feedback on this campaign draft:
      
      Campaign Name: ${campaignDraft.name}
      Campaign Type: ${campaignDraft.type}
      Target Audience: ${campaignDraft.targetAudience}
      Current Content: ${campaignDraft.content}
      Call to Action: ${campaignDraft.cta}
      
      Provide specific, actionable feedback in these categories:
      1. Content Quality (clarity, persuasiveness, brand voice)
      2. Audience Targeting (relevance to specified audience)
      3. Call to Action (effectiveness, clarity)
      4. Overall Strategy (alignment with campaign goals)
      
      For each category, provide:
      - A score from 1-10
      - What's working well
      - Specific improvements
      - Example of how to implement the improvement
      
      Format as JSON with categories as keys, each containing score, strengths, improvements, and examples.
    `;
    
    // Get coaching feedback from selected AI model with retry
    const generateCoaching = async () => {
      try {
        let coachingResponse;
        
        switch (selectedModel) {
          case 'gemini':
            coachingResponse = await gemini.generateContent(prompt, {
              responseFormat: 'json'
            });
            break;
          case 'claude':
            coachingResponse = await claude.generateContent(prompt, {
              max_tokens: 1200,
              temperature: 0.7,
              response_format: { type: "json_object" }
            });
            break;
          default: // openai
            coachingResponse = await openai.generateContent(prompt, {
              max_tokens: 1200,
              temperature: 0.7,
              response_format: { type: "json_object" }
            });
        }
        
        return coachingResponse;
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to generate coaching feedback using ${selectedModel}: ${error.message}`,
          ErrorTypes.AI_SERVICE_ERROR,
          error,
          { ...context, selectedModel }
        );
      }
    };
    
    const coachingResponse = await retryWithBackoff(
      generateCoaching,
      3,
      500,
      (error) => error.type === ErrorTypes.AI_SERVICE_ERROR
    );
    
    // Parse coaching feedback
    let coaching;
    try {
      if (typeof coachingResponse === 'string') {
        coaching = JSON.parse(coachingResponse);
      } else {
        coaching = coachingResponse;
      }
      
      // If parsing fails, try to extract JSON from text response
      if (!coaching || typeof coaching !== 'object') {
        const jsonMatch = coachingResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          coaching = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse coaching response as JSON');
        }
      }
    } catch (error) {
      throw new MarketingCopilotError(
        `Failed to parse coaching feedback: ${error.message}`,
        ErrorTypes.PARSING_ERROR,
        error,
        { ...context, coachingResponse }
      );
    }
    
    // Calculate overall score
    const categories = Object.keys(coaching);
    if (categories.length === 0) {
      throw new MarketingCopilotError(
        'Coaching feedback contains no categories',
        ErrorTypes.PARSING_ERROR,
        null,
        { ...context, coaching }
      );
    }
    
    let totalScore = 0;
    let validCategories = 0;
    
    categories.forEach(category => {
      if (coaching[category] && typeof coaching[category].score === 'number') {
        totalScore += coaching[category].score;
        validCategories++;
      }
    });
    
    const overallScore = validCategories > 0 ? Math.round(totalScore / validCategories) : 5;
    
    // Add overall score to coaching feedback
    coaching.overallScore = overallScore;
    
    // Store coaching feedback in Firestore
    const storeCoaching = async () => {
      try {
        await db.collection('campaignCoaching').add({
          campaignDraft: campaignDraft,
          feedback: coaching,
          model: selectedModel,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to store coaching feedback: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, coaching }
        );
      }
    };
    
    await retryWithBackoff(
      storeCoaching,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    return coaching;
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof MarketingCopilotError)) {
      error = new MarketingCopilotError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to provide real-time coaching: ${error.message}`);
  }
};

/**
 * Provide competitive intelligence and market insights
 * @param {string} industry - Industry to analyze
 * @param {string} model - AI model to use ('openai', 'gemini', or 'claude')
 * @returns {Promise<Object>} Competitive intelligence and market insights
 */
const provideCompetitiveIntelligence = async (industry, model = 'openai') => {
  const functionName = 'provideCompetitiveIntelligence';
  const context = { industry, model };
  
  try {
    // Validate inputs
    if (!industry) {
      throw new MarketingCopilotError(
        'Industry is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Select best model for this task
    const selectedModel = selectBestModel(model, 'competitiveIntelligence');
    
    // Get industry data from Firestore with retry
    const getIndustryData = async () => {
      try {
        const industryDoc = await db.collection('industries').doc(industry).get();
        
        if (!industryDoc.exists) {
          throw new MarketingCopilotError(
            `Industry ${industry} not found`,
            ErrorTypes.NOT_FOUND_ERROR,
            null,
            context
          );
        }
        
        return industryDoc.data();
      } catch (error) {
        if (error.name === 'MarketingCopilotError') {
          throw error; // Re-throw our custom errors
        }
        
        throw new MarketingCopilotError(
          `Failed to retrieve industry data: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const industryData = await retryWithBackoff(
      getIndustryData,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Prepare prompt for AI
    const prompt = `
      As a marketing intelligence analyst, provide competitive insights for the ${industry} industry:
      
      Industry: ${industry}
      Key Competitors: ${industryData.competitors.join(', ')}
      Current Trends: ${industryData.trends.join(', ')}
      
      Provide detailed analysis in these categories:
      1. Content Strategies: What content types and themes are performing best in this industry?
      2. Channel Effectiveness: Which marketing channels are most effective for this industry?
      3. Messaging Themes: What messaging themes are resonating with audiences?
      4. Emerging Opportunities: What new marketing approaches are showing promise?
      5. Competitive Gaps: What areas are underserved by competitors?
      
      For each category, provide:
      - Current state analysis
      - Specific opportunities
      - Actionable recommendations
      - Examples of successful implementation
      
      Format as JSON with categories as keys, each containing analysis, opportunities, recommendations, and examples.
    `;
    
    // Get intelligence from selected AI model with retry
    const generateIntelligence = async () => {
      try {
        let intelligenceResponse;
        
        switch (selectedModel) {
          case 'gemini':
            intelligenceResponse = await gemini.generateContent(prompt, {
              responseFormat: 'json'
            });
            break;
          case 'claude':
            intelligenceResponse = await claude.generateContent(prompt, {
              max_tokens: 1500,
              temperature: 0.7,
              response_format: { type: "json_object" }
            });
            break;
          default: // openai
            intelligenceResponse = await openai.generateContent(prompt, {
              max_tokens: 1500,
              temperature: 0.7,
              response_format: { type: "json_object" }
            });
        }
        
        return intelligenceResponse;
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to generate competitive intelligence using ${selectedModel}: ${error.message}`,
          ErrorTypes.AI_SERVICE_ERROR,
          error,
          { ...context, selectedModel }
        );
      }
    };
    
    const intelligenceResponse = await retryWithBackoff(
      generateIntelligence,
      3,
      500,
      (error) => error.type === ErrorTypes.AI_SERVICE_ERROR
    );
    
    // Parse intelligence response
    let intelligence;
    try {
      if (typeof intelligenceResponse === 'string') {
        intelligence = JSON.parse(intelligenceResponse);
      } else {
        intelligence = intelligenceResponse;
      }
      
      // If parsing fails, try to extract JSON from text response
      if (!intelligence || typeof intelligence !== 'object') {
        const jsonMatch = intelligenceResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          intelligence = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse intelligence response as JSON');
        }
      }
    } catch (error) {
      throw new MarketingCopilotError(
        `Failed to parse competitive intelligence: ${error.message}`,
        ErrorTypes.PARSING_ERROR,
        error,
        { ...context, intelligenceResponse }
      );
    }
    
    // Store intelligence in Firestore
    const storeIntelligence = async () => {
      try {
        await db.collection('marketIntelligence').add({
          industry,
          intelligence,
          model: selectedModel,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to store competitive intelligence: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, intelligence }
        );
      }
    };
    
    await retryWithBackoff(
      storeIntelligence,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    return intelligence;
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof MarketingCopilotError)) {
      error = new MarketingCopilotError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to provide competitive intelligence: ${error.message}`);
  }
};

/**
 * Create and run social media ads based on budget
 * @param {Object} adCampaign - Ad campaign configuration
 * @param {number} budget - Budget for the ad campaign
 * @param {string} model - AI model to use ('openai', 'gemini', or 'claude')
 * @returns {Promise<Object>} Created ad campaign details
 */
const createAndRunSocialMediaAds = async (adCampaign, budget, model = 'openai') => {
  const functionName = 'createAndRunSocialMediaAds';
  const context = { adCampaign, budget, model };
  
  try {
    // Validate inputs
    if (!adCampaign) {
      throw new MarketingCopilotError(
        'Ad campaign configuration is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    if (!budget || budget <= 0) {
      throw new MarketingCopilotError(
        'Valid budget amount is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        { ...context, providedBudget: budget }
      );
    }
    
    // Validate required ad campaign fields
    const requiredFields = ['name', 'objective', 'targetAudience', 'platforms'];
    const missingFields = requiredFields.filter(field => !adCampaign[field]);
    
    if (missingFields.length > 0) {
      throw new MarketingCopilotError(
        `Ad campaign is missing required fields: ${missingFields.join(', ')}`,
        ErrorTypes.VALIDATION_ERROR,
        null,
        { ...context, missingFields }
      );
    }
    
    // Validate platforms
    if (!Array.isArray(adCampaign.platforms) || adCampaign.platforms.length === 0) {
      throw new MarketingCopilotError(
        'At least one platform must be specified',
        ErrorTypes.VALIDATION_ERROR,
        null,
        { ...context, platforms: adCampaign.platforms }
      );
    }
    
    // Select best model for content generation
    const selectedModel = selectBestModel(model, 'contentGeneration');
    
    // Generate ad content if not provided
    if (!adCampaign.adContent) {
      const generateAdContent = async () => {
        try {
          // Prepare prompt for AI
          const prompt = `
            As an expert ad copywriter, create compelling ad content for a social media campaign:
            
            Campaign Name: ${adCampaign.name}
            Objective: ${adCampaign.objective}
            Target Audience: ${adCampaign.targetAudience}
            Platforms: ${adCampaign.platforms.join(', ')}
            
            Create ad content that includes:
            1. Headline (max 40 characters)
            2. Primary text (max 125 characters)
            3. Description (max 30 characters)
            4. Call to action
            
            Format as JSON with headline, primaryText, description, and callToAction as keys.
          `;
          
          // Get ad content from selected AI model
          let adContentResponse;
          
          switch (selectedModel) {
            case 'gemini':
              adContentResponse = await gemini.generateContent(prompt, {
                responseFormat: 'json'
              });
              break;
            case 'claude':
              adContentResponse = await claude.generateContent(prompt, {
                max_tokens: 800,
                temperature: 0.7,
                response_format: { type: "json_object" }
              });
              break;
            default: // openai
              adContentResponse = await openai.generateContent(prompt, {
                max_tokens: 800,
                temperature: 0.7,
                response_format: { type: "json_object" }
              });
          }
          
          // Parse ad content response
          let adContent;
          if (typeof adContentResponse === 'string') {
            adContent = JSON.parse(adContentResponse);
          } else {
            adContent = adContentResponse;
          }
          
          return adContent;
        } catch (error) {
          throw new MarketingCopilotError(
            `Failed to generate ad content: ${error.message}`,
            ErrorTypes.AI_SERVICE_ERROR,
            error,
            { ...context, selectedModel }
          );
        }
      };
      
      adCampaign.adContent = await retryWithBackoff(
        generateAdContent,
        3,
        500,
        (error) => error.type === ErrorTypes.AI_SERVICE_ERROR
      );
    }
    
    // Calculate budget allocation per platform
    const platformCount = adCampaign.platforms.length;
    const budgetPerPlatform = Math.floor(budget / platformCount);
    const remainingBudget = budget - (budgetPerPlatform * platformCount);
    
    const budgetAllocation = adCampaign.platforms.map((platform, index) => ({
      platform,
      budget: index === 0 ? budgetPerPlatform + remainingBudget : budgetPerPlatform
    }));
    
    // Create ad campaign in Firestore
    const createAdCampaign = async () => {
      try {
        const adCampaignRef = db.collection('adCampaigns').doc();
        
        const adCampaignData = {
          ...adCampaign,
          id: adCampaignRef.id,
          budget,
          budgetAllocation,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          metrics: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            spend: 0
          }
        };
        
        await adCampaignRef.set(adCampaignData);
        
        return { ...adCampaignData, id: adCampaignRef.id };
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to create ad campaign: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, adCampaign }
        );
      }
    };
    
    const createdAdCampaign = await retryWithBackoff(
      createAdCampaign,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Schedule ad campaign for each platform
    const scheduleAdCampaign = async () => {
      try {
        const batch = db.batch();
        
        // Create scheduled tasks for each platform
        budgetAllocation.forEach(allocation => {
          const scheduledTaskRef = db.collection('scheduledTasks').doc();
          
          batch.set(scheduledTaskRef, {
            type: 'runSocialMediaAd',
            adCampaignId: createdAdCampaign.id,
            platform: allocation.platform,
            budget: allocation.budget,
            status: 'scheduled',
            scheduledFor: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        
        // Update ad campaign status
        const adCampaignRef = db.collection('adCampaigns').doc(createdAdCampaign.id);
        batch.update(adCampaignRef, {
          status: 'scheduled',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to schedule ad campaign: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, adCampaignId: createdAdCampaign.id }
        );
      }
    };
    
    await retryWithBackoff(
      scheduleAdCampaign,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Update ad campaign with scheduled status
    createdAdCampaign.status = 'scheduled';
    
    return createdAdCampaign;
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof MarketingCopilotError)) {
      error = new MarketingCopilotError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to create and run social media ads: ${error.message}`);
  }
};

/**
 * Track and analyze social media ad performance
 * @param {string} adCampaignId - ID of the ad campaign to track
 * @returns {Promise<Object>} Ad performance metrics and analysis
 */
const trackSocialMediaAdPerformance = async (adCampaignId) => {
  const functionName = 'trackSocialMediaAdPerformance';
  const context = { adCampaignId };
  
  try {
    // Validate inputs
    if (!adCampaignId) {
      throw new MarketingCopilotError(
        'Ad campaign ID is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Get ad campaign data from Firestore with retry
    const getAdCampaign = async () => {
      try {
        const adCampaignDoc = await db.collection('adCampaigns').doc(adCampaignId).get();
        
        if (!adCampaignDoc.exists) {
          throw new MarketingCopilotError(
            `Ad campaign with ID ${adCampaignId} not found`,
            ErrorTypes.NOT_FOUND_ERROR,
            null,
            context
          );
        }
        
        return adCampaignDoc.data();
      } catch (error) {
        if (error.name === 'MarketingCopilotError') {
          throw error; // Re-throw our custom errors
        }
        
        throw new MarketingCopilotError(
          `Failed to retrieve ad campaign data: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const adCampaign = await retryWithBackoff(
      getAdCampaign,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Get ad metrics from Firestore with retry
    const getAdMetrics = async () => {
      try {
        const metricsQuery = await db.collection('adMetrics')
          .where('adCampaignId', '==', adCampaignId)
          .orderBy('timestamp', 'desc')
          .get();
        
        const metrics = [];
        metricsQuery.forEach(doc => {
          metrics.push(doc.data());
        });
        
        return metrics;
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to retrieve ad metrics: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const adMetrics = await retryWithBackoff(
      getAdMetrics,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Calculate performance metrics
    const totalImpressions = adMetrics.reduce((sum, metric) => sum + (metric.impressions || 0), 0);
    const totalClicks = adMetrics.reduce((sum, metric) => sum + (metric.clicks || 0), 0);
    const totalConversions = adMetrics.reduce((sum, metric) => sum + (metric.conversions || 0), 0);
    const totalSpend = adMetrics.reduce((sum, metric) => sum + (metric.spend || 0), 0);
    
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const roi = totalSpend > 0 ? ((adCampaign.revenue || 0) - totalSpend) / totalSpend * 100 : 0;
    
    // Calculate performance by platform
    const platformPerformance = {};
    
    adMetrics.forEach(metric => {
      const platform = metric.platform;
      
      if (!platformPerformance[platform]) {
        platformPerformance[platform] = {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0
        };
      }
      
      platformPerformance[platform].impressions += metric.impressions || 0;
      platformPerformance[platform].clicks += metric.clicks || 0;
      platformPerformance[platform].conversions += metric.conversions || 0;
      platformPerformance[platform].spend += metric.spend || 0;
    });
    
    // Calculate derived metrics for each platform
    Object.keys(platformPerformance).forEach(platform => {
      const performance = platformPerformance[platform];
      
      performance.ctr = performance.impressions > 0 ? (performance.clicks / performance.impressions) * 100 : 0;
      performance.conversionRate = performance.clicks > 0 ? (performance.conversions / performance.clicks) * 100 : 0;
      performance.cpc = performance.clicks > 0 ? performance.spend / performance.clicks : 0;
      performance.cpa = performance.conversions > 0 ? performance.spend / performance.conversions : 0;
    });
    
    // Prepare performance analysis
    const performanceAnalysis = {
      adCampaignId,
      campaignName: adCampaign.name,
      status: adCampaign.status,
      budget: adCampaign.budget,
      totalMetrics: {
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        spend: totalSpend,
        ctr: ctr.toFixed(2),
        conversionRate: conversionRate.toFixed(2),
        cpc: cpc.toFixed(2),
        cpa: cpa.toFixed(2),
        roi: roi.toFixed(2)
      },
      platformPerformance,
      lastUpdated: new Date().toISOString()
    };
    
    // Update ad campaign metrics in Firestore
    const updateAdCampaignMetrics = async () => {
      try {
        await db.collection('adCampaigns').doc(adCampaignId).update({
          metrics: {
            impressions: totalImpressions,
            clicks: totalClicks,
            conversions: totalConversions,
            spend: totalSpend,
            ctr,
            conversionRate,
            cpc,
            cpa,
            roi
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to update ad campaign metrics: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, performanceAnalysis }
        );
      }
    };
    
    await retryWithBackoff(
      updateAdCampaignMetrics,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Store performance analysis in Firestore
    const storePerformanceAnalysis = async () => {
      try {
        await db.collection('adPerformanceAnalyses').add({
          ...performanceAnalysis,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to store performance analysis: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, performanceAnalysis }
        );
      }
    };
    
    await retryWithBackoff(
      storePerformanceAnalysis,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    return performanceAnalysis;
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof MarketingCopilotError)) {
      error = new MarketingCopilotError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to track social media ad performance: ${error.message}`);
  }
};

/**
 * Optimize ad budget allocation based on performance
 * @param {string} adCampaignId - ID of the ad campaign to optimize
 * @returns {Promise<Object>} Optimized budget allocation
 */
const optimizeAdBudgetAllocation = async (adCampaignId) => {
  const functionName = 'optimizeAdBudgetAllocation';
  const context = { adCampaignId };
  
  try {
    // Validate inputs
    if (!adCampaignId) {
      throw new MarketingCopilotError(
        'Ad campaign ID is required',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Get ad campaign data from Firestore with retry
    const getAdCampaign = async () => {
      try {
        const adCampaignDoc = await db.collection('adCampaigns').doc(adCampaignId).get();
        
        if (!adCampaignDoc.exists) {
          throw new MarketingCopilotError(
            `Ad campaign with ID ${adCampaignId} not found`,
            ErrorTypes.NOT_FOUND_ERROR,
            null,
            context
          );
        }
        
        return adCampaignDoc.data();
      } catch (error) {
        if (error.name === 'MarketingCopilotError') {
          throw error; // Re-throw our custom errors
        }
        
        throw new MarketingCopilotError(
          `Failed to retrieve ad campaign data: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const adCampaign = await retryWithBackoff(
      getAdCampaign,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Get ad metrics from Firestore with retry
    const getAdMetrics = async () => {
      try {
        const metricsQuery = await db.collection('adMetrics')
          .where('adCampaignId', '==', adCampaignId)
          .orderBy('timestamp', 'desc')
          .get();
        
        const metrics = [];
        metricsQuery.forEach(doc => {
          metrics.push(doc.data());
        });
        
        return metrics;
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to retrieve ad metrics: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const adMetrics = await retryWithBackoff(
      getAdMetrics,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Calculate performance by platform
    const platformPerformance = {};
    
    adMetrics.forEach(metric => {
      const platform = metric.platform;
      
      if (!platformPerformance[platform]) {
        platformPerformance[platform] = {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0
        };
      }
      
      platformPerformance[platform].impressions += metric.impressions || 0;
      platformPerformance[platform].clicks += metric.clicks || 0;
      platformPerformance[platform].conversions += metric.conversions || 0;
      platformPerformance[platform].spend += metric.spend || 0;
    });
    
    // Calculate performance score for each platform
    // Higher score = better performance
    Object.keys(platformPerformance).forEach(platform => {
      const performance = platformPerformance[platform];
      
      const ctr = performance.impressions > 0 ? (performance.clicks / performance.impressions) : 0;
      const conversionRate = performance.clicks > 0 ? (performance.conversions / performance.clicks) : 0;
      const cpa = performance.conversions > 0 ? performance.spend / performance.conversions : Infinity;
      
      // Calculate performance score based on conversion rate and cost per acquisition
      // Lower CPA and higher conversion rate = better performance
      if (performance.conversions > 0) {
        performance.score = (conversionRate * 100) / (cpa + 0.01); // Add 0.01 to avoid division by zero
      } else if (performance.clicks > 0) {
        performance.score = ctr * 10; // If no conversions, use CTR as a proxy
      } else {
        performance.score = 0.1; // Minimum score for platforms with no data
      }
    });
    
    // Calculate total score
    const totalScore = Object.values(platformPerformance).reduce((sum, performance) => sum + performance.score, 0);
    
    // Calculate optimal budget allocation based on performance score
    const remainingBudget = adCampaign.budget - Object.values(platformPerformance).reduce((sum, performance) => sum + performance.spend, 0);
    
    if (remainingBudget <= 0) {
      // No budget left to allocate
      return {
        adCampaignId,
        message: 'Budget fully spent, no optimization possible',
        currentAllocation: adCampaign.budgetAllocation,
        platformPerformance
      };
    }
    
    // Calculate new budget allocation
    const newBudgetAllocation = [];
    
    adCampaign.platforms.forEach(platform => {
      const performance = platformPerformance[platform] || { score: 0.1 }; // Default score if no data
      const allocationRatio = totalScore > 0 ? performance.score / totalScore : 1 / adCampaign.platforms.length;
      const allocatedBudget = Math.round(remainingBudget * allocationRatio * 100) / 100; // Round to 2 decimal places
      
      newBudgetAllocation.push({
        platform,
        budget: allocatedBudget,
        performanceScore: performance.score
      });
    });
    
    // Ensure minimum budget for each platform (at least 5% of remaining budget)
    const minBudget = remainingBudget * 0.05;
    let totalAllocated = 0;
    
    newBudgetAllocation.forEach(allocation => {
      if (allocation.budget < minBudget) {
        allocation.budget = minBudget;
      }
      totalAllocated += allocation.budget;
    });
    
    // Adjust if total allocated exceeds remaining budget
    if (totalAllocated > remainingBudget) {
      const adjustmentRatio = remainingBudget / totalAllocated;
      newBudgetAllocation.forEach(allocation => {
        allocation.budget = Math.round(allocation.budget * adjustmentRatio * 100) / 100;
      });
    }
    
    // Update ad campaign budget allocation in Firestore
    const updateBudgetAllocation = async () => {
      try {
        await db.collection('adCampaigns').doc(adCampaignId).update({
          budgetAllocation: newBudgetAllocation,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to update budget allocation: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, newBudgetAllocation }
        );
      }
    };
    
    await retryWithBackoff(
      updateBudgetAllocation,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Store optimization history in Firestore
    const storeOptimizationHistory = async () => {
      try {
        await db.collection('budgetOptimizationHistory').add({
          adCampaignId,
          previousAllocation: adCampaign.budgetAllocation,
          newAllocation: newBudgetAllocation,
          platformPerformance,
          remainingBudget,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        throw new MarketingCopilotError(
          `Failed to store optimization history: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, newBudgetAllocation }
        );
      }
    };
    
    await retryWithBackoff(
      storeOptimizationHistory,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    return {
      adCampaignId,
      message: 'Budget allocation optimized successfully',
      previousAllocation: adCampaign.budgetAllocation,
      newAllocation: newBudgetAllocation,
      platformPerformance,
      remainingBudget
    };
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof MarketingCopilotError)) {
      error = new MarketingCopilotError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to optimize ad budget allocation: ${error.message}`);
  }
};

// Helper functions

/**
 * Parse suggestions from AI response
 * @param {string} suggestionsText - Raw suggestions text from AI
 * @returns {Array} Parsed suggestions
 */
const parseSuggestions = (suggestionsText) => {
  try {
    // Try to parse as JSON first
    if (typeof suggestionsText === 'object') {
      if (Array.isArray(suggestionsText.suggestions)) {
        return suggestionsText.suggestions;
      } else if (suggestionsText.suggestion1 || suggestionsText.suggestion2) {
        // Handle numbered suggestion keys
        const suggestions = [];
        for (let i = 1; i <= 10; i++) {
          const key = `suggestion${i}`;
          if (suggestionsText[key]) {
            suggestions.push({
              title: suggestionsText[key].title || `Suggestion ${i}`,
              detail: suggestionsText[key].detail || suggestionsText[key]
            });
          }
        }
        if (suggestions.length > 0) {
          return suggestions;
        }
      }
    }
    
    // If not JSON or JSON parsing failed, parse as text
    if (typeof suggestionsText !== 'string') {
      suggestionsText = String(suggestionsText);
    }
    
    const suggestions = [];
    const lines = suggestionsText.split('\n');
    
    let currentSuggestion = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Check if this is a new suggestion (starts with a number or has a colon)
      const suggestionMatch = trimmedLine.match(/^(\d+\.\s*|[^:]+:)(.+)/);
      
      if (suggestionMatch) {
        // Save previous suggestion if exists
        if (currentSuggestion) {
          suggestions.push(currentSuggestion);
        }
        
        // Start new suggestion
        const title = suggestionMatch[1].replace(/^\d+\.\s*/, '').replace(/:$/, '');
        const detail = suggestionMatch[2].trim();
        
        currentSuggestion = {
          title: title,
          detail: detail
        };
      } else if (currentSuggestion) {
        // Continue previous suggestion
        currentSuggestion.detail += ' ' + trimmedLine;
      }
    }
    
    // Add the last suggestion
    if (currentSuggestion) {
      suggestions.push(currentSuggestion);
    }
    
    return suggestions;
  } catch (error) {
    logger.error('Error parsing suggestions:', error);
    
    // Return simple array of suggestion objects as fallback
    return [{ title: 'Error parsing suggestions', detail: 'Please try again with a different prompt or model.' }];
  }
};

/**
 * Parse content variations from AI response
 * @param {string} variationsText - Raw variations text from AI
 * @param {number} expectedCount - Expected number of variations
 * @returns {Array} Parsed variations
 */
const parseContentVariations = (variationsText, expectedCount) => {
  try {
    // Try to parse as JSON first
    if (typeof variationsText === 'object') {
      if (Array.isArray(variationsText.variations)) {
        return variationsText.variations;
      } else if (variationsText.variation1 || variationsText.variation2) {
        // Handle numbered variation keys
        const variations = [];
        for (let i = 1; i <= expectedCount; i++) {
          const key = `variation${i}`;
          if (variationsText[key]) {
            variations.push(variationsText[key]);
          }
        }
        if (variations.length > 0) {
          return variations;
        }
      }
    }
    
    // If not JSON or JSON parsing failed, parse as text
    if (typeof variationsText !== 'string') {
      variationsText = String(variationsText);
    }
    
    const variations = [];
    const lines = variationsText.split('\n');
    
    let currentVariation = '';
    
    for (const line of lines) {
      if (line.match(/^Variation\s*#?\s*\d+\s*:/i)) {
        if (currentVariation) {
          variations.push(currentVariation.trim());
        }
        currentVariation = line.replace(/^Variation\s*#?\s*\d+\s*:/i, '').trim();
      } else if (currentVariation !== '') {
        currentVariation += ' ' + line.trim();
      }
    }
    
    if (currentVariation) {
      variations.push(currentVariation.trim());
    }
    
    if (variations.length > 0) {
      return variations;
    }
    
    // Simple fallback: split by double newlines
    return variationsText.split(/\n\s*\n/).filter(v => v.trim()).map(v => v.trim());
  } catch (error) {
    logger.error('Error parsing content variations:', error);
    
    // Return simple array of variations as fallback
    return Array(expectedCount).fill('Error parsing variations. Please try again with a different prompt or model.');
  }
};

/**
 * Get industry benchmark times for a channel
 * @param {string} channelType - Channel type
 * @returns {Object} Industry benchmark times
 */
const getIndustryBenchmarkTimes = (channelType) => {
  // These would ideally come from a database of industry benchmarks
  const benchmarks = {
    email: {
      recommendedTimes: [
        { day: 'Tuesday', hour: '10:00 AM', engagementScore: '8.75' },
        { day: 'Thursday', hour: '2:00 PM', engagementScore: '8.42' },
        { day: 'Wednesday', hour: '9:00 AM', engagementScore: '7.89' }
      ],
      basedOn: 'industry benchmarks',
      totalCampaignsAnalyzed: 0
    },
    social: {
      recommendedTimes: [
        { day: 'Wednesday', hour: '12:00 PM', engagementScore: '9.12' },
        { day: 'Thursday', hour: '6:00 PM', engagementScore: '8.95' },
        { day: 'Tuesday', hour: '7:00 PM', engagementScore: '8.67' }
      ],
      basedOn: 'industry benchmarks',
      totalCampaignsAnalyzed: 0
    },
    sms: {
      recommendedTimes: [
        { day: 'Thursday', hour: '5:00 PM', engagementScore: '9.34' },
        { day: 'Tuesday', hour: '12:00 PM', engagementScore: '8.76' },
        { day: 'Friday', hour: '3:00 PM', engagementScore: '8.45' }
      ],
      basedOn: 'industry benchmarks',
      totalCampaignsAnalyzed: 0
    }
  };
  
  return benchmarks[channelType] || {
    recommendedTimes: [
      { day: 'Tuesday', hour: '10:00 AM', engagementScore: '8.50' },
      { day: 'Wednesday', hour: '2:00 PM', engagementScore: '8.25' },
      { day: 'Thursday', hour: '11:00 AM', engagementScore: '8.00' }
    ],
    basedOn: 'general benchmarks',
    totalCampaignsAnalyzed: 0
  };
};

/**
 * Get day name from day number
 * @param {number} day - Day number (0-6)
 * @returns {string} Day name
 */
const getDayName = (day) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
};

/**
 * Format hour to 12-hour format
 * @param {number} hour - Hour in 24-hour format
 * @returns {string} Hour in 12-hour format
 */
const formatHour = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
};

module.exports = {
  generateCampaignSuggestions,
  generateContentVariations,
  recommendOptimalSendTimes,
  provideRealTimeCoaching,
  provideCompetitiveIntelligence,
  createAndRunSocialMediaAds,
  trackSocialMediaAdPerformance,
  optimizeAdBudgetAllocation
};
