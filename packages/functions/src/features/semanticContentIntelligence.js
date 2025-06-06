/**
 * Semantic Content Intelligence
 * 
 * This module implements the Semantic Content Intelligence feature,
 * which analyzes content performance across channels, identifies high-performing patterns,
 * and generates optimized content variations automatically.
 * 
 * The system uses advanced NLP and machine learning to understand content semantics,
 * extract insights from performance data, and create content that resonates with target audiences.
 */

const functions = require('firebase-functions');
const { openai, gemini } = require('../apis');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Content types
 */
const CONTENT_TYPES = {
  BLOG_POST: 'blog_post',
  SOCIAL_POST: 'social_post',
  EMAIL: 'email',
  AD_COPY: 'ad_copy',
  LANDING_PAGE: 'landing_page',
  PRODUCT_DESCRIPTION: 'product_description',
  VIDEO_SCRIPT: 'video_script',
  PODCAST_SCRIPT: 'podcast_script'
};

/**
 * Content channels
 */
const CONTENT_CHANNELS = {
  WEBSITE: 'website',
  BLOG: 'blog',
  EMAIL: 'email',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
  GOOGLE_ADS: 'google_ads',
  FACEBOOK_ADS: 'facebook_ads'
};

/**
 * Content performance metrics
 */
const PERFORMANCE_METRICS = {
  VIEWS: 'views',
  CLICKS: 'clicks',
  ENGAGEMENT: 'engagement',
  CONVERSIONS: 'conversions',
  SHARES: 'shares',
  COMMENTS: 'comments',
  TIME_ON_PAGE: 'time_on_page',
  BOUNCE_RATE: 'bounce_rate',
  OPEN_RATE: 'open_rate',
  CTR: 'ctr',
  CONVERSION_RATE: 'conversion_rate'
};

/**
 * Analyze content semantics
 * @param {string} contentId - Content ID
 * @param {string} [model='openai'] - AI model to use ('openai' or 'gemini')
 * @returns {Promise<Object>} Semantic analysis results
 */
const analyzeContentSemantics = async (contentId, model = 'openai') => {
  try {
    // Get content
    const contentDoc = await db.collection('marketingContent').doc(contentId).get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    const content = contentDoc.data();
    
    // Extract text content
    const textContent = content.text || content.body || content.content || '';
    
    if (!textContent) {
      throw new Error('Content has no text to analyze');
    }
    
    // Prepare prompt for AI
    const prompt = `
      As a content analyst, perform a detailed semantic analysis of this content:
      
      "${textContent.substring(0, 8000)}"
      
      Analyze and provide:
      1. Main topics and themes
      2. Key entities (people, places, products, etc.)
      3. Sentiment analysis (overall tone and emotional content)
      4. Content structure analysis
      5. Linguistic style and readability metrics
      6. Target audience indicators
      7. Call-to-action effectiveness
      8. SEO relevance for primary keywords
      
      Format your response as JSON with these categories.
    `;
    
    // Get analysis from selected AI model
    let semanticAnalysis;
    if (model === 'gemini') {
      semanticAnalysis = await gemini.generateContent(prompt, {
        response_format: { type: "json_object" }
      });
    } else {
      semanticAnalysis = await openai.generateContent(prompt, {
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
    }
    
    // Parse analysis
    let analysis;
    try {
      analysis = JSON.parse(semanticAnalysis);
    } catch (e) {
      console.error('Error parsing semantic analysis:', e);
      // Default response if parsing fails
      analysis = {
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
      };
    }
    
    // Store analysis in Firestore
    await db.collection('contentSemanticAnalysis').doc(contentId).set({
      contentId,
      analysis,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      model
    });
    
    return {
      contentId,
      analysis
    };
  } catch (error) {
    console.error('Error analyzing content semantics:', error);
    throw new Error('Failed to analyze content semantics');
  }
};

/**
 * Extract content topics
 * @param {string} contentId - Content ID
 * @returns {Promise<Array>} Extracted topics
 */
const extractContentTopics = async (contentId) => {
  try {
    // Check if we already have semantic analysis
    const analysisDoc = await db.collection('contentSemanticAnalysis').doc(contentId).get();
    
    if (analysisDoc.exists) {
      const analysis = analysisDoc.data();
      
      // Return topics from existing analysis
      if (analysis.analysis && analysis.analysis.topics) {
        return {
          contentId,
          topics: analysis.analysis.topics,
          source: 'existing_analysis'
        };
      }
    }
    
    // If no existing analysis, perform new analysis
    const semanticAnalysis = await analyzeContentSemantics(contentId);
    
    return {
      contentId,
      topics: semanticAnalysis.analysis.topics || [],
      source: 'new_analysis'
    };
  } catch (error) {
    console.error('Error extracting content topics:', error);
    throw new Error('Failed to extract content topics');
  }
};

/**
 * Extract content entities
 * @param {string} contentId - Content ID
 * @returns {Promise<Array>} Extracted entities
 */
const extractContentEntities = async (contentId) => {
  try {
    // Check if we already have semantic analysis
    const analysisDoc = await db.collection('contentSemanticAnalysis').doc(contentId).get();
    
    if (analysisDoc.exists) {
      const analysis = analysisDoc.data();
      
      // Return entities from existing analysis
      if (analysis.analysis && analysis.analysis.entities) {
        return {
          contentId,
          entities: analysis.analysis.entities,
          source: 'existing_analysis'
        };
      }
    }
    
    // If no existing analysis, perform new analysis
    const semanticAnalysis = await analyzeContentSemantics(contentId);
    
    return {
      contentId,
      entities: semanticAnalysis.analysis.entities || [],
      source: 'new_analysis'
    };
  } catch (error) {
    console.error('Error extracting content entities:', error);
    throw new Error('Failed to extract content entities');
  }
};

/**
 * Analyze content performance
 * @param {string} contentId - Content ID
 * @returns {Promise<Object>} Performance analysis
 */
const analyzeContentPerformance = async (contentId) => {
  try {
    // Get content
    const contentDoc = await db.collection('marketingContent').doc(contentId).get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    const content = contentDoc.data();
    
    // Get performance metrics
    const metricsQuery = await db.collection('contentPerformanceMetrics')
      .where('contentId', '==', contentId)
      .orderBy('timestamp', 'desc')
      .get();
    
    const metrics = [];
    metricsQuery.forEach(doc => {
      metrics.push(doc.data());
    });
    
    if (metrics.length === 0) {
      return {
        contentId,
        status: 'no_metrics',
        message: 'No performance metrics available for this content'
      };
    }
    
    // Calculate performance metrics
    const performanceByChannel = {};
    const performanceByMetric = {};
    
    // Initialize metrics
    Object.values(PERFORMANCE_METRICS).forEach(metric => {
      performanceByMetric[metric] = {
        total: 0,
        average: 0,
        trend: 'stable'
      };
    });
    
    // Process metrics by channel
    metrics.forEach(metric => {
      const channel = metric.channel || 'unknown';
      
      if (!performanceByChannel[channel]) {
        performanceByChannel[channel] = {};
        
        Object.values(PERFORMANCE_METRICS).forEach(metricType => {
          performanceByChannel[channel][metricType] = {
            total: 0,
            average: 0,
            trend: 'stable'
          };
        });
      }
      
      // Update channel metrics
      Object.entries(metric.metrics || {}).forEach(([metricType, value]) => {
        if (performanceByChannel[channel][metricType]) {
          performanceByChannel[channel][metricType].total += value;
          performanceByMetric[metricType].total += value;
        }
      });
    });
    
    // Calculate averages
    Object.keys(performanceByChannel).forEach(channel => {
      Object.keys(performanceByChannel[channel]).forEach(metricType => {
        performanceByChannel[channel][metricType].average = 
          performanceByChannel[channel][metricType].total / metrics.length;
      });
    });
    
    Object.keys(performanceByMetric).forEach(metricType => {
      performanceByMetric[metricType].average = 
        performanceByMetric[metricType].total / metrics.length;
    });
    
    // Calculate trends
    if (metrics.length >= 3) {
      const recentMetrics = metrics.slice(0, Math.floor(metrics.length / 2));
      const olderMetrics = metrics.slice(Math.floor(metrics.length / 2));
      
      // Calculate recent and older averages for each metric
      Object.values(PERFORMANCE_METRICS).forEach(metricType => {
        const recentTotal = recentMetrics.reduce((sum, m) => 
          sum + (m.metrics?.[metricType] || 0), 0);
        const olderTotal = olderMetrics.reduce((sum, m) => 
          sum + (m.metrics?.[metricType] || 0), 0);
        
        const recentAvg = recentTotal / recentMetrics.length;
        const olderAvg = olderTotal / olderMetrics.length;
        
        // Determine trend
        if (recentAvg > olderAvg * 1.1) {
          performanceByMetric[metricType].trend = 'increasing';
        } else if (recentAvg < olderAvg * 0.9) {
          performanceByMetric[metricType].trend = 'decreasing';
        } else {
          performanceByMetric[metricType].trend = 'stable';
        }
        
        // Calculate trends by channel
        Object.keys(performanceByChannel).forEach(channel => {
          const channelRecentTotal = recentMetrics
            .filter(m => m.channel === channel)
            .reduce((sum, m) => sum + (m.metrics?.[metricType] || 0), 0);
          
          const channelOlderTotal = olderMetrics
            .filter(m => m.channel === channel)
            .reduce((sum, m) => sum + (m.metrics?.[metricType] || 0), 0);
          
          const channelRecentCount = recentMetrics.filter(m => m.channel === channel).length;
          const channelOlderCount = olderMetrics.filter(m => m.channel === channel).length;
          
          if (channelRecentCount > 0 && channelOlderCount > 0) {
            const channelRecentAvg = channelRecentTotal / channelRecentCount;
            const channelOlderAvg = channelOlderTotal / channelOlderCount;
            
            if (channelRecentAvg > channelOlderAvg * 1.1) {
              performanceByChannel[channel][metricType].trend = 'increasing';
            } else if (channelRecentAvg < channelOlderAvg * 0.9) {
              performanceByChannel[channel][metricType].trend = 'decreasing';
            } else {
              performanceByChannel[channel][metricType].trend = 'stable';
            }
          }
        });
      });
    }
    
    // Calculate overall performance score (0-100)
    let performanceScore = 50; // Base score
    
    // Adjust score based on engagement metrics
    if (performanceByMetric[PERFORMANCE_METRICS.ENGAGEMENT]) {
      const engagementScore = performanceByMetric[PERFORMANCE_METRICS.ENGAGEMENT].average;
      performanceScore += Math.min(20, engagementScore / 10);
    }
    
    // Adjust score based on conversion metrics
    if (performanceByMetric[PERFORMANCE_METRICS.CONVERSIONS]) {
      const conversionScore = performanceByMetric[PERFORMANCE_METRICS.CONVERSIONS].average;
      performanceScore += Math.min(30, conversionScore * 10);
    }
    
    // Adjust score based on trends
    Object.values(PERFORMANCE_METRICS).forEach(metricType => {
      if (performanceByMetric[metricType].trend === 'increasing') {
        performanceScore += 2;
      } else if (performanceByMetric[metricType].trend === 'decreasing') {
        performanceScore -= 2;
      }
    });
    
    // Ensure score is within bounds
    performanceScore = Math.max(0, Math.min(100, performanceScore));
    
    // Create performance analysis
    const performanceAnalysis = {
      contentId,
      contentType: content.type,
      performanceScore,
      performanceByChannel,
      performanceByMetric,
      bestPerformingChannel: getBestPerformingChannel(performanceByChannel),
      worstPerformingChannel: getWorstPerformingChannel(performanceByChannel),
      analyzedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Store analysis in Firestore
    await db.collection('contentPerformanceAnalysis').doc(contentId).set(performanceAnalysis);
    
    return performanceAnalysis;
  } catch (error) {
    console.error('Error analyzing content performance:', error);
    throw new Error('Failed to analyze content performance');
  }
};

/**
 * Get best performing channel
 * @param {Object} performanceByChannel - Performance metrics by channel
 * @returns {string} Best performing channel
 */
const getBestPerformingChannel = (performanceByChannel) => {
  let bestChannel = null;
  let bestScore = -1;
  
  Object.entries(performanceByChannel).forEach(([channel, metrics]) => {
    let channelScore = 0;
    
    // Calculate score based on engagement and conversion metrics
    if (metrics[PERFORMANCE_METRICS.ENGAGEMENT]) {
      channelScore += metrics[PERFORMANCE_METRICS.ENGAGEMENT].average;
    }
    
    if (metrics[PERFORMANCE_METRICS.CONVERSIONS]) {
      channelScore += metrics[PERFORMANCE_METRICS.CONVERSIONS].average * 10;
    }
    
    if (metrics[PERFORMANCE_METRICS.CLICKS]) {
      channelScore += metrics[PERFORMANCE_METRICS.CLICKS].average * 0.5;
    }
    
    // Bonus for increasing trends
    Object.values(PERFORMANCE_METRICS).forEach(metricType => {
      if (metrics[metricType] && metrics[metricType].trend === 'increasing') {
        channelScore *= 1.2;
      }
    });
    
    if (channelScore > bestScore) {
      bestScore = channelScore;
      bestChannel = channel;
    }
  });
  
  return bestChannel;
};

/**
 * Get worst performing channel
 * @param {Object} performanceByChannel - Performance metrics by channel
 * @returns {string} Worst performing channel
 */
const getWorstPerformingChannel = (performanceByChannel) => {
  let worstChannel = null;
  let worstScore = Number.MAX_VALUE;
  
  Object.entries(performanceByChannel).forEach(([channel, metrics]) => {
    let channelScore = 0;
    
    // Calculate score based on engagement and conversion metrics
    if (metrics[PERFORMANCE_METRICS.ENGAGEMENT]) {
      channelScore += metrics[PERFORMANCE_METRICS.ENGAGEMENT].average;
    }
    
    if (metrics[PERFORMANCE_METRICS.CONVERSIONS]) {
      channelScore += metrics[PERFORMANCE_METRICS.CONVERSIONS].average * 10;
    }
    
    if (metrics[PERFORMANCE_METRICS.CLICKS]) {
      channelScore += metrics[PERFORMANCE_METRICS.CLICKS].average * 0.5;
    }
    
    // Penalty for decreasing trends
    Object.values(PERFORMANCE_METRICS).forEach(metricType => {
      if (metrics[metricType] && metrics[metricType].trend === 'decreasing') {
        channelScore *= 0.8;
      }
    });
    
    if (channelScore < worstScore && Object.keys(metrics).length > 0) {
      worstScore = channelScore;
      worstChannel = channel;
    }
  });
  
  return worstChannel;
};

/**
 * Identify high-performing content patterns
 * @param {string} userId - User ID
 * @param {string} contentType - Content type
 * @returns {Promise<Object>} High-performing patterns
 */
const identifyHighPerformingPatterns = async (userId, contentType) => {
  try {
    // Get user's content of specified type
    const contentQuery = await db.collection('marketingContent')
      .where('userId', '==', userId)
      .where('type', '==', contentType)
      .get();
    
    if (contentQuery.empty) {
      return {
        userId,
        contentType,
        status: 'no_content',
        message: `No ${contentType} content found for this user`
      };
    }
    
    // Get content IDs
    const contentIds = [];
    contentQuery.forEach(doc => {
      contentIds.push(doc.id);
    });
    
    // Get performance analysis for each content
    const analysisPromises = contentIds.map(id => 
      db.collection('contentPerformanceAnalysis').doc(id).get()
    );
    
    const analysisDocs = await Promise.all(analysisPromises);
    
    // Filter for content with performance analysis
    const contentWithAnalysis = [];
    analysisDocs.forEach(doc => {
      if (doc.exists) {
        contentWithAnalysis.push(doc.data());
      }
    });
    
    if (contentWithAnalysis.length === 0) {
      // Analyze content performance if no analysis exists
      const performancePromises = contentIds.map(id => 
        analyzeContentPerformance(id)
          .catch(error => {
            console.error(`Error analyzing performance for content ${id}:`, error);
            return null;
          })
      );
      
      const performanceResults = await Promise.all(performancePromises);
      
      performanceResults.forEach(result => {
        if (result && result.status !== 'no_metrics') {
          contentWithAnalysis.push(result);
        }
      });
      
      if (contentWithAnalysis.length === 0) {
        return {
          userId,
          contentType,
          status: 'no_performance_data',
          message: `No performance data available for ${contentType} content`
        };
      }
    }
    
    // Get semantic analysis for each content
    const semanticPromises = contentIds.map(id => 
      db.collection('contentSemanticAnalysis').doc(id).get()
    );
    
    const semanticDocs = await Promise.all(semanticPromises);
    
    // Create mapping of content ID to semantic analysis
    const semanticAnalysisMap = {};
    semanticDocs.forEach(doc => {
      if (doc.exists) {
        semanticAnalysisMap[doc.id] = doc.data();
      }
    });
    
    // For content without semantic analysis, perform analysis
    const missingSemanticIds = contentIds.filter(id => !semanticAnalysisMap[id]);
    
    if (missingSemanticIds.length > 0) {
      const semanticAnalysisPromises = missingSemanticIds.map(id => 
        analyzeContentSemantics(id)
          .catch(error => {
            console.error(`Error analyzing semantics for content ${id}:`, error);
            return null;
          })
      );
      
      const semanticResults = await Promise.all(semanticAnalysisPromises);
      
      semanticResults.forEach(result => {
        if (result) {
          semanticAnalysisMap[result.contentId] = {
            contentId: result.contentId,
            analysis: result.analysis
          };
        }
      });
    }
    
    // Sort content by performance score
    contentWithAnalysis.sort((a, b) => b.performanceScore - a.performanceScore);
    
    // Separate high and low performing content
    const highPerforming = contentWithAnalysis.slice(0, Math.ceil(contentWithAnalysis.length / 3));
    const lowPerforming = contentWithAnalysis.slice(-Math.ceil(contentWithAnalysis.length / 3));
    
    // Extract patterns from high-performing content
    const patterns = await extractContentPatterns(highPerforming, semanticAnalysisMap);
    
    // Compare with low-performing content to validate patterns
    const validatedPatterns = await validateContentPatterns(patterns, lowPerforming, semanticAnalysisMap);
    
    // Store patterns in Firestore
    await db.collection('contentPatterns').add({
      userId,
      contentType,
      patterns: validatedPatterns,
      highPerformingContentIds: highPerforming.map(c => c.contentId),
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      userId,
      contentType,
      patterns: validatedPatterns
    };
  } catch (error) {
    console.error('Error identifying high-performing patterns:', error);
    throw new Error('Failed to identify high-performing patterns');
  }
};

/**
 * Extract content patterns from high-performing content
 * @param {Array} highPerformingContent - High-performing content
 * @param {Object} semanticAnalysisMap - Mapping of content ID to semantic analysis
 * @returns {Promise<Object>} Extracted patterns
 */
const extractContentPatterns = async (highPerformingContent, semanticAnalysisMap) => {
  try {
    // Collect data for pattern analysis
    const patternData = {
      topics: {},
      entities: {},
      sentiment: {},
      structure: {},
      style: {},
      callToAction: {}
    };
    
    // Process each high-performing content
    highPerformingContent.forEach(content => {
      const semanticAnalysis = semanticAnalysisMap[content.contentId];
      
      if (!semanticAnalysis || !semanticAnalysis.analysis) {
        return;
      }
      
      const analysis = semanticAnalysis.analysis;
      
      // Count topics
      if (analysis.topics) {
        analysis.topics.forEach(topic => {
          patternData.topics[topic] = (patternData.topics[topic] || 0) + 1;
        });
      }
      
      // Count entities
      if (analysis.entities) {
        analysis.entities.forEach(entity => {
          patternData.entities[entity] = (patternData.entities[entity] || 0) + 1;
        });
      }
      
      // Count sentiment
      if (analysis.sentiment && analysis.sentiment.overall) {
        const sentiment = analysis.sentiment.overall;
        patternData.sentiment[sentiment] = (patternData.sentiment[sentiment] || 0) + 1;
      }
      
      // Count structure
      if (analysis.structure) {
        patternData.structure[analysis.structure] = (patternData.structure[analysis.structure] || 0) + 1;
      }
      
      // Count style
      if (analysis.style && analysis.style.readability) {
        patternData.style[analysis.style.readability] = (patternData.style[analysis.style.readability] || 0) + 1;
      }
      
      // Count call to action
      if (analysis.callToAction) {
        patternData.callToAction[analysis.callToAction] = (patternData.callToAction[analysis.callToAction] || 0) + 1;
      }
    });
    
    // Extract top patterns
    const patterns = {
      topics: getTopItems(patternData.topics, 5),
      entities: getTopItems(patternData.entities, 5),
      sentiment: getTopItems(patternData.sentiment, 1)[0],
      structure: getTopItems(patternData.structure, 1)[0],
      style: getTopItems(patternData.style, 1)[0],
      callToAction: getTopItems(patternData.callToAction, 1)[0]
    };
    
    return patterns;
  } catch (error) {
    console.error('Error extracting content patterns:', error);
    throw new Error('Failed to extract content patterns');
  }
};

/**
 * Get top items from a frequency map
 * @param {Object} frequencyMap - Map of items to frequencies
 * @param {number} count - Number of top items to return
 * @returns {Array} Top items
 */
const getTopItems = (frequencyMap, count) => {
  return Object.entries(frequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(entry => entry[0]);
};

/**
 * Validate content patterns by comparing with low-performing content
 * @param {Object} patterns - Extracted patterns
 * @param {Array} lowPerformingContent - Low-performing content
 * @param {Object} semanticAnalysisMap - Mapping of content ID to semantic analysis
 * @returns {Promise<Object>} Validated patterns
 */
const validateContentPatterns = async (patterns, lowPerformingContent, semanticAnalysisMap) => {
  try {
    // Collect data from low-performing content
    const lowPerformingData = {
      topics: {},
      entities: {},
      sentiment: {},
      structure: {},
      style: {},
      callToAction: {}
    };
    
    // Process each low-performing content
    lowPerformingContent.forEach(content => {
      const semanticAnalysis = semanticAnalysisMap[content.contentId];
      
      if (!semanticAnalysis || !semanticAnalysis.analysis) {
        return;
      }
      
      const analysis = semanticAnalysis.analysis;
      
      // Count topics
      if (analysis.topics) {
        analysis.topics.forEach(topic => {
          lowPerformingData.topics[topic] = (lowPerformingData.topics[topic] || 0) + 1;
        });
      }
      
      // Count entities
      if (analysis.entities) {
        analysis.entities.forEach(entity => {
          lowPerformingData.entities[entity] = (lowPerformingData.entities[entity] || 0) + 1;
        });
      }
      
      // Count sentiment
      if (analysis.sentiment && analysis.sentiment.overall) {
        const sentiment = analysis.sentiment.overall;
        lowPerformingData.sentiment[sentiment] = (lowPerformingData.sentiment[sentiment] || 0) + 1;
      }
      
      // Count structure
      if (analysis.structure) {
        lowPerformingData.structure[analysis.structure] = (lowPerformingData.structure[analysis.structure] || 0) + 1;
      }
      
      // Count style
      if (analysis.style && analysis.style.readability) {
        lowPerformingData.style[analysis.style.readability] = (lowPerformingData.style[analysis.style.readability] || 0) + 1;
      }
      
      // Count call to action
      if (analysis.callToAction) {
        lowPerformingData.callToAction[analysis.callToAction] = (lowPerformingData.callToAction[analysis.callToAction] || 0) + 1;
      }
    });
    
    // Validate topics
    const validatedTopics = patterns.topics.filter(topic => 
      !lowPerformingData.topics[topic] || 
      lowPerformingData.topics[topic] < lowPerformingContent.length / 3
    );
    
    // Validate entities
    const validatedEntities = patterns.entities.filter(entity => 
      !lowPerformingData.entities[entity] || 
      lowPerformingData.entities[entity] < lowPerformingContent.length / 3
    );
    
    // Validate sentiment
    const validatedSentiment = 
      lowPerformingData.sentiment[patterns.sentiment] && 
      lowPerformingData.sentiment[patterns.sentiment] >= lowPerformingContent.length / 2
        ? null
        : patterns.sentiment;
    
    // Validate structure
    const validatedStructure = 
      lowPerformingData.structure[patterns.structure] && 
      lowPerformingData.structure[patterns.structure] >= lowPerformingContent.length / 2
        ? null
        : patterns.structure;
    
    // Validate style
    const validatedStyle = 
      lowPerformingData.style[patterns.style] && 
      lowPerformingData.style[patterns.style] >= lowPerformingContent.length / 2
        ? null
        : patterns.style;
    
    // Validate call to action
    const validatedCallToAction = 
      lowPerformingData.callToAction[patterns.callToAction] && 
      lowPerformingData.callToAction[patterns.callToAction] >= lowPerformingContent.length / 2
        ? null
        : patterns.callToAction;
    
    return {
      topics: validatedTopics,
      entities: validatedEntities,
      sentiment: validatedSentiment,
      structure: validatedStructure,
      style: validatedStyle,
      callToAction: validatedCallToAction
    };
  } catch (error) {
    console.error('Error validating content patterns:', error);
    throw new Error('Failed to validate content patterns');
  }
};

/**
 * Generate optimized content based on high-performing patterns
 * @param {Object} contentRequest - Content request
 * @param {string} [model='openai'] - AI model to use ('openai' or 'gemini')
 * @returns {Promise<Object>} Generated content
 */
const generateOptimizedContent = async (contentRequest, model = 'openai') => {
  try {
    // Validate required fields
    if (!contentRequest.userId || !contentRequest.contentType || !contentRequest.brief) {
      throw new Error('Missing required content request fields');
    }
    
    // Get high-performing patterns for this user and content type
    const patternsQuery = await db.collection('contentPatterns')
      .where('userId', '==', contentRequest.userId)
      .where('contentType', '==', contentRequest.contentType)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();
    
    let patterns;
    
    if (patternsQuery.empty) {
      // If no patterns exist, identify patterns first
      const patternsResult = await identifyHighPerformingPatterns(
        contentRequest.userId,
        contentRequest.contentType
      );
      
      patterns = patternsResult.patterns;
    } else {
      patterns = patternsQuery.docs[0].data().patterns;
    }
    
    // Prepare prompt for AI
    const prompt = `
      As an expert content creator, generate optimized ${contentRequest.contentType} content based on this brief:
      
      Brief: "${contentRequest.brief}"
      
      Target Audience: ${contentRequest.targetAudience || 'General audience'}
      
      Incorporate these high-performing patterns:
      - Topics: ${patterns.topics.join(', ')}
      - Entities: ${patterns.entities.join(', ')}
      ${patterns.sentiment ? `- Sentiment: ${patterns.sentiment}` : ''}
      ${patterns.structure ? `- Structure: ${patterns.structure}` : ''}
      ${patterns.style ? `- Style: ${patterns.style}` : ''}
      ${patterns.callToAction ? `- Call to Action: ${patterns.callToAction}` : ''}
      
      Additional requirements:
      ${contentRequest.additionalRequirements || 'None'}
      
      Create content that is engaging, persuasive, and optimized for high performance.
      
      ${contentRequest.contentType === CONTENT_TYPES.BLOG_POST ? 
        'Format as a complete blog post with headings, paragraphs, and a compelling call to action.' : ''}
      ${contentRequest.contentType === CONTENT_TYPES.SOCIAL_POST ? 
        'Format as a social media post with appropriate hashtags and call to action.' : ''}
      ${contentRequest.contentType === CONTENT_TYPES.EMAIL ? 
        'Format as an email with subject line, greeting, body, and call to action.' : ''}
      ${contentRequest.contentType === CONTENT_TYPES.AD_COPY ? 
        'Format as ad copy with headline, body, and call to action.' : ''}
    `;
    
    // Get content from selected AI model
    let generatedContent;
    if (model === 'gemini') {
      generatedContent = await gemini.generateContent(prompt);
    } else {
      generatedContent = await openai.generateContent(prompt, {
        max_tokens: 2000,
        temperature: 0.7
      });
    }
    
    // Create content record
    const content = {
      userId: contentRequest.userId,
      type: contentRequest.contentType,
      brief: contentRequest.brief,
      content: generatedContent,
      targetAudience: contentRequest.targetAudience,
      patternsUsed: patterns,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      model,
      status: 'draft'
    };
    
    // Add to database
    const contentRef = await db.collection('marketingContent').add(content);
    
    // Analyze content semantics
    analyzeContentSemantics(contentRef.id, model)
      .catch(error => {
        console.error(`Error analyzing semantics for generated content ${contentRef.id}:`, error);
      });
    
    return {
      id: contentRef.id,
      ...content
    };
  } catch (error) {
    console.error('Error generating optimized content:', error);
    throw new Error('Failed to generate optimized content');
  }
};

/**
 * Generate content variations
 * @param {string} contentId - Content ID
 * @param {number} [count=3] - Number of variations to generate
 * @param {string} [model='openai'] - AI model to use ('openai' or 'gemini')
 * @returns {Promise<Array>} Generated variations
 */
const generateContentVariations = async (contentId, count = 3, model = 'openai') => {
  try {
    // Get content
    const contentDoc = await db.collection('marketingContent').doc(contentId).get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    const content = contentDoc.data();
    
    // Get performance analysis if available
    const analysisDoc = await db.collection('contentPerformanceAnalysis').doc(contentId).get();
    let performanceAnalysis = null;
    
    if (analysisDoc.exists) {
      performanceAnalysis = analysisDoc.data();
    }
    
    // Get semantic analysis if available
    const semanticDoc = await db.collection('contentSemanticAnalysis').doc(contentId).get();
    let semanticAnalysis = null;
    
    if (semanticDoc.exists) {
      semanticAnalysis = semanticDoc.data();
    }
    
    // Prepare prompt for AI
    let prompt = `
      As an expert content creator, generate ${count} variations of this ${content.type} content:
      
      Original Content: "${content.content}"
      
      Brief: ${content.brief || 'Not provided'}
      
      Target Audience: ${content.targetAudience || 'General audience'}
    `;
    
    // Add performance insights if available
    if (performanceAnalysis) {
      prompt += `
        Performance Insights:
        - Overall Performance Score: ${performanceAnalysis.performanceScore}/100
        - Best Performing Channel: ${performanceAnalysis.bestPerformingChannel || 'Not available'}
        - Focus on improving: ${performanceAnalysis.worstPerformingChannel ? 
          `Performance on ${performanceAnalysis.worstPerformingChannel} channel` : 
          'Overall engagement'}
      `;
    }
    
    // Add semantic insights if available
    if (semanticAnalysis && semanticAnalysis.analysis) {
      const analysis = semanticAnalysis.analysis;
      
      prompt += `
        Content Analysis:
        ${analysis.topics ? `- Topics: ${analysis.topics.join(', ')}` : ''}
        ${analysis.sentiment && analysis.sentiment.overall ? 
          `- Sentiment: ${analysis.sentiment.overall}` : ''}
        ${analysis.style && analysis.style.readability ? 
          `- Style: ${analysis.style.readability}` : ''}
      `;
    }
    
    prompt += `
      Create ${count} distinct variations that:
      - Maintain the core message and purpose
      - Experiment with different approaches, tones, and structures
      - Are optimized for better performance
      - Each have a unique angle or emphasis
      
      Format each variation clearly with "Variation 1:", "Variation 2:", etc.
    `;
    
    // Get variations from selected AI model
    let generatedVariations;
    if (model === 'gemini') {
      generatedVariations = await gemini.generateContent(prompt);
    } else {
      generatedVariations = await openai.generateContent(prompt, {
        max_tokens: 2500,
        temperature: 0.8
      });
    }
    
    // Parse variations
    const variations = parseContentVariations(generatedVariations, count);
    
    // Store variations in Firestore
    const variationPromises = variations.map((variation, index) => {
      const variationData = {
        originalContentId: contentId,
        content: variation,
        type: content.type,
        variationNumber: index + 1,
        brief: content.brief,
        targetAudience: content.targetAudience,
        userId: content.userId,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        model,
        status: 'draft'
      };
      
      return db.collection('contentVariations').add(variationData);
    });
    
    const variationRefs = await Promise.all(variationPromises);
    
    // Return variations with IDs
    return variations.map((variation, index) => ({
      id: variationRefs[index].id,
      content: variation,
      variationNumber: index + 1
    }));
  } catch (error) {
    console.error('Error generating content variations:', error);
    throw new Error('Failed to generate content variations');
  }
};

/**
 * Parse content variations from generated text
 * @param {string} generatedText - Generated variations text
 * @param {number} expectedCount - Expected number of variations
 * @returns {Array} Parsed variations
 */
const parseContentVariations = (generatedText, expectedCount) => {
  // Split by variation markers
  const variationRegex = /Variation\s+(\d+):/gi;
  const parts = generatedText.split(variationRegex);
  
  // Extract variations
  const variations = [];
  
  for (let i = 1; i < parts.length; i += 2) {
    if (i + 1 < parts.length) {
      variations.push(parts[i + 1].trim());
    }
  }
  
  // If regex didn't work, try simple splitting
  if (variations.length === 0) {
    // Try splitting by double newlines
    const simpleParts = generatedText.split(/\n\s*\n/);
    
    if (simpleParts.length >= expectedCount) {
      return simpleParts.slice(0, expectedCount);
    }
    
    // If still no variations, return the whole text as one variation
    return [generatedText];
  }
  
  return variations;
};

/**
 * A/B test content variations
 * @param {string} originalContentId - Original content ID
 * @param {Array} variationIds - Variation content IDs
 * @returns {Promise<Object>} Test setup
 */
const setupContentABTest = async (originalContentId, variationIds) => {
  try {
    // Get original content
    const originalDoc = await db.collection('marketingContent').doc(originalContentId).get();
    
    if (!originalDoc.exists) {
      throw new Error(`Original content with ID ${originalContentId} not found`);
    }
    
    const originalContent = originalDoc.data();
    
    // Get variations
    const variationPromises = variationIds.map(id => 
      db.collection('contentVariations').doc(id).get()
    );
    
    const variationDocs = await Promise.all(variationPromises);
    
    const variations = [];
    variationDocs.forEach((doc, index) => {
      if (doc.exists) {
        variations.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    
    if (variations.length === 0) {
      throw new Error('No valid content variations found');
    }
    
    // Create A/B test
    const test = {
      originalContentId,
      variations: [
        {
          id: originalContentId,
          content: originalContent.content,
          isOriginal: true,
          metrics: {
            views: 0,
            clicks: 0,
            conversions: 0
          }
        },
        ...variations.map(variation => ({
          id: variation.id,
          content: variation.content,
          isOriginal: false,
          metrics: {
            views: 0,
            clicks: 0,
            conversions: 0
          }
        }))
      ],
      status: 'active',
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      endDate: null,
      userId: originalContent.userId,
      contentType: originalContent.type,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to database
    const testRef = await db.collection('contentABTests').add(test);
    
    return {
      id: testRef.id,
      ...test
    };
  } catch (error) {
    console.error('Error setting up content A/B test:', error);
    throw new Error('Failed to set up content A/B test');
  }
};

/**
 * Update A/B test metrics
 * @param {string} testId - Test ID
 * @param {string} variationId - Variation ID
 * @param {string} metricType - Metric type (views, clicks, conversions)
 * @param {number} [value=1] - Metric value to add
 * @returns {Promise<Object>} Updated test
 */
const updateABTestMetrics = async (testId, variationId, metricType, value = 1) => {
  try {
    // Get test
    const testDoc = await db.collection('contentABTests').doc(testId).get();
    
    if (!testDoc.exists) {
      throw new Error(`A/B test with ID ${testId} not found`);
    }
    
    const test = testDoc.data();
    
    // Find variation
    const variationIndex = test.variations.findIndex(v => v.id === variationId);
    
    if (variationIndex === -1) {
      throw new Error(`Variation with ID ${variationId} not found in test`);
    }
    
    // Update metrics
    const updatedVariations = [...test.variations];
    updatedVariations[variationIndex] = {
      ...updatedVariations[variationIndex],
      metrics: {
        ...updatedVariations[variationIndex].metrics,
        [metricType]: (updatedVariations[variationIndex].metrics[metricType] || 0) + value
      }
    };
    
    // Update test
    await db.collection('contentABTests').doc(testId).update({
      variations: updatedVariations,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      id: testId,
      variations: updatedVariations
    };
  } catch (error) {
    console.error('Error updating A/B test metrics:', error);
    throw new Error('Failed to update A/B test metrics');
  }
};

/**
 * Complete A/B test and determine winner
 * @param {string} testId - Test ID
 * @returns {Promise<Object>} Test results
 */
const completeABTest = async (testId) => {
  try {
    // Get test
    const testDoc = await db.collection('contentABTests').doc(testId).get();
    
    if (!testDoc.exists) {
      throw new Error(`A/B test with ID ${testId} not found`);
    }
    
    const test = testDoc.data();
    
    // Calculate performance metrics for each variation
    const results = test.variations.map(variation => {
      const views = variation.metrics.views || 0;
      const clicks = variation.metrics.clicks || 0;
      const conversions = variation.metrics.conversions || 0;
      
      const clickRate = views > 0 ? clicks / views : 0;
      const conversionRate = clicks > 0 ? conversions / clicks : 0;
      
      return {
        id: variation.id,
        isOriginal: variation.isOriginal,
        metrics: variation.metrics,
        clickRate,
        conversionRate,
        // Combined score weighted towards conversions
        score: (clickRate * 0.3) + (conversionRate * 0.7)
      };
    });
    
    // Determine winner
    results.sort((a, b) => b.score - a.score);
    const winner = results[0];
    
    // Update test
    await db.collection('contentABTests').doc(testId).update({
      status: 'completed',
      endDate: admin.firestore.FieldValue.serverTimestamp(),
      results,
      winnerId: winner.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If winner is not original, update content performance analysis
    if (!winner.isOriginal) {
      // Get original content
      const originalContentId = test.originalContentId;
      
      // Add winning variation to content insights
      await db.collection('contentInsights').add({
        contentId: originalContentId,
        testId,
        winnerId: winner.id,
        improvement: {
          clickRate: {
            original: results.find(r => r.isOriginal).clickRate,
            improved: winner.clickRate,
            percentChange: calculatePercentChange(
              results.find(r => r.isOriginal).clickRate,
              winner.clickRate
            )
          },
          conversionRate: {
            original: results.find(r => r.isOriginal).conversionRate,
            improved: winner.conversionRate,
            percentChange: calculatePercentChange(
              results.find(r => r.isOriginal).conversionRate,
              winner.conversionRate
            )
          }
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return {
      id: testId,
      results,
      winnerId: winner.id
    };
  } catch (error) {
    console.error('Error completing A/B test:', error);
    throw new Error('Failed to complete A/B test');
  }
};

/**
 * Calculate percent change between two values
 * @param {number} original - Original value
 * @param {number} current - Current value
 * @returns {number} Percent change
 */
const calculatePercentChange = (original, current) => {
  if (original === 0) {
    return current > 0 ? 100 : 0;
  }
  
  return ((current - original) / original) * 100;
};

/**
 * Generate content insights
 * @param {string} contentId - Content ID
 * @returns {Promise<Object>} Content insights
 */
const generateContentInsights = async (contentId) => {
  try {
    // Get content
    const contentDoc = await db.collection('marketingContent').doc(contentId).get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    const content = contentDoc.data();
    
    // Get performance analysis
    let performanceAnalysis = null;
    const analysisDoc = await db.collection('contentPerformanceAnalysis').doc(contentId).get();
    
    if (analysisDoc.exists) {
      performanceAnalysis = analysisDoc.data();
    } else {
      // Generate performance analysis if not available
      performanceAnalysis = await analyzeContentPerformance(contentId);
    }
    
    // Get semantic analysis
    let semanticAnalysis = null;
    const semanticDoc = await db.collection('contentSemanticAnalysis').doc(contentId).get();
    
    if (semanticDoc.exists) {
      semanticAnalysis = semanticDoc.data();
    } else {
      // Generate semantic analysis if not available
      semanticAnalysis = await analyzeContentSemantics(contentId);
    }
    
    // Get A/B test results
    const testQuery = await db.collection('contentABTests')
      .where('originalContentId', '==', contentId)
      .where('status', '==', 'completed')
      .get();
    
    const testResults = [];
    testQuery.forEach(doc => {
      testResults.push(doc.data());
    });
    
    // Prepare data for AI analysis
    const insightData = {
      content: {
        type: content.type,
        brief: content.brief,
        targetAudience: content.targetAudience
      },
      performance: performanceAnalysis,
      semantics: semanticAnalysis?.analysis,
      testResults: testResults.length > 0 ? testResults[0].results : null
    };
    
    // Prepare prompt for AI
    const prompt = `
      As a content intelligence analyst, provide insights for this content:
      
      Content Data: ${JSON.stringify(insightData)}
      
      Provide insights on:
      1. Content strengths and weaknesses
      2. Performance analysis and recommendations
      3. Audience engagement factors
      4. Optimization opportunities
      5. Specific improvement suggestions
      
      Format your response as JSON with these categories.
    `;
    
    // Get insights from AI
    const insightsResponse = await openai.generateContent(prompt, {
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse insights
    let insights;
    try {
      insights = JSON.parse(insightsResponse);
    } catch (e) {
      console.error('Error parsing content insights:', e);
      // Default insights if parsing fails
      insights = {
        strengths: ["Unable to analyze strengths"],
        weaknesses: ["Unable to analyze weaknesses"],
        performanceAnalysis: "Unable to analyze performance",
        audienceEngagement: "Unable to analyze audience engagement",
        optimizationOpportunities: ["Unable to identify optimization opportunities"],
        improvementSuggestions: ["Unable to generate improvement suggestions"]
      };
    }
    
    // Store insights in Firestore
    const insightRef = await db.collection('contentInsights').add({
      contentId,
      insights,
      performanceData: performanceAnalysis,
      semanticData: semanticAnalysis?.analysis,
      testResultsData: testResults.length > 0 ? testResults[0].results : null,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      id: insightRef.id,
      contentId,
      insights
    };
  } catch (error) {
    console.error('Error generating content insights:', error);
    throw new Error('Failed to generate content insights');
  }
};

/**
 * Batch analyze content
 * @param {string} userId - User ID
 * @param {string} [contentType=null] - Content type filter (optional)
 * @param {number} [limit=20] - Maximum number of content items to analyze
 * @returns {Promise<Object>} Analysis results
 */
const batchAnalyzeContent = async (userId, contentType = null, limit = 20) => {
  try {
    // Build query
    let query = db.collection('marketingContent')
      .where('userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .limit(limit);
    
    // Apply content type filter if provided
    if (contentType) {
      query = db.collection('marketingContent')
        .where('userId', '==', userId)
        .where('type', '==', contentType)
        .orderBy('generatedAt', 'desc')
        .limit(limit);
    }
    
    // Get content
    const contentQuery = await query.get();
    
    if (contentQuery.empty) {
      return {
        userId,
        contentType,
        status: 'no_content',
        message: 'No content found for analysis'
      };
    }
    
    // Process each content item
    const analysisPromises = [];
    const contentIds = [];
    
    contentQuery.forEach(doc => {
      const contentId = doc.id;
      contentIds.push(contentId);
      
      // Analyze semantics
      const semanticPromise = analyzeContentSemantics(contentId)
        .catch(error => {
          console.error(`Error analyzing semantics for content ${contentId}:`, error);
          return null;
        });
      
      // Analyze performance
      const performancePromise = analyzeContentPerformance(contentId)
        .catch(error => {
          console.error(`Error analyzing performance for content ${contentId}:`, error);
          return null;
        });
      
      analysisPromises.push(semanticPromise, performancePromise);
    });
    
    // Wait for all analyses to complete
    await Promise.all(analysisPromises);
    
    return {
      userId,
      contentType,
      contentIds,
      analyzedCount: contentIds.length,
      status: 'completed'
    };
  } catch (error) {
    console.error('Error batch analyzing content:', error);
    throw new Error('Failed to batch analyze content');
  }
};

/**
 * Generate content calendar
 * @param {string} userId - User ID
 * @param {Object} calendarRequest - Calendar request
 * @returns {Promise<Object>} Generated calendar
 */
const generateContentCalendar = async (userId, calendarRequest) => {
  try {
    // Validate required fields
    if (!calendarRequest.startDate || !calendarRequest.endDate || !calendarRequest.channels) {
      throw new Error('Missing required calendar request fields');
    }
    
    // Get high-performing patterns for this user
    const patternsQuery = await db.collection('contentPatterns')
      .where('userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .limit(5)
      .get();
    
    const patternsByType = {};
    
    patternsQuery.forEach(doc => {
      const patternData = doc.data();
      patternsByType[patternData.contentType] = patternData.patterns;
    });
    
    // Prepare prompt for AI
    const prompt = `
      As a content strategy expert, create a content calendar for the period from ${calendarRequest.startDate} to ${calendarRequest.endDate}.
      
      Channels to include: ${calendarRequest.channels.join(', ')}
      
      Content Goals: ${calendarRequest.goals || 'Engage audience and drive conversions'}
      
      Target Audience: ${calendarRequest.targetAudience || 'General audience'}
      
      Content Themes: ${calendarRequest.themes ? calendarRequest.themes.join(', ') : 'Use relevant industry themes'}
      
      High-performing patterns by content type:
      ${Object.entries(patternsByType).map(([type, patterns]) => 
        `${type}: ${patterns.topics ? 'Topics: ' + patterns.topics.join(', ') : ''}`
      ).join('\n')}
      
      Create a comprehensive content calendar that includes:
      1. Date for each content piece
      2. Channel for distribution
      3. Content type
      4. Content topic/title
      5. Brief description
      6. Primary goal
      
      Format your response as JSON with an array of content items, each containing these fields.
    `;
    
    // Get calendar from AI
    const calendarResponse = await openai.generateContent(prompt, {
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse calendar
    let calendar;
    try {
      calendar = JSON.parse(calendarResponse);
    } catch (e) {
      console.error('Error parsing content calendar:', e);
      throw new Error('Failed to parse content calendar');
    }
    
    // Ensure calendar has expected format
    let calendarItems = [];
    
    if (Array.isArray(calendar)) {
      calendarItems = calendar;
    } else if (calendar.calendar && Array.isArray(calendar.calendar)) {
      calendarItems = calendar.calendar;
    } else if (calendar.items && Array.isArray(calendar.items)) {
      calendarItems = calendar.items;
    } else if (calendar.content && Array.isArray(calendar.content)) {
      calendarItems = calendar.content;
    } else {
      // Try to find any array in the response
      for (const key in calendar) {
        if (Array.isArray(calendar[key])) {
          calendarItems = calendar[key];
          break;
        }
      }
    }
    
    // Store calendar in Firestore
    const calendarData = {
      userId,
      startDate: calendarRequest.startDate,
      endDate: calendarRequest.endDate,
      channels: calendarRequest.channels,
      goals: calendarRequest.goals,
      targetAudience: calendarRequest.targetAudience,
      themes: calendarRequest.themes,
      items: calendarItems,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const calendarRef = await db.collection('contentCalendars').add(calendarData);
    
    return {
      id: calendarRef.id,
      ...calendarData
    };
  } catch (error) {
    console.error('Error generating content calendar:', error);
    throw new Error('Failed to generate content calendar');
  }
};

module.exports = {
  // Constants
  CONTENT_TYPES,
  CONTENT_CHANNELS,
  PERFORMANCE_METRICS,
  
  // Content analysis
  analyzeContentSemantics,
  extractContentTopics,
  extractContentEntities,
  analyzeContentPerformance,
  
  // Pattern identification
  identifyHighPerformingPatterns,
  
  // Content generation
  generateOptimizedContent,
  generateContentVariations,
  
  // A/B testing
  setupContentABTest,
  updateABTestMetrics,
  completeABTest,
  
  // Insights and planning
  generateContentInsights,
  batchAnalyzeContent,
  generateContentCalendar
};
