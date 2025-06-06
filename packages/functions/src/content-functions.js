/**
 * Firebase Cloud Functions for Semantic Content Intelligence
 */

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { semanticContentIntelligence } = require('./features');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Analyze content semantics
 */
exports.analyzeContentSemantics = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { contentId, model } = req.body;

      // Validate parameters
      if (!contentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Analyze content semantics
      const analysis = await semanticContentIntelligence.analyzeContentSemantics(
        contentId,
        model || 'openai'
      );

      // Return analysis
      return res.status(200).json(analysis);
    } catch (error) {
      console.error('Error analyzing content semantics:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Extract content topics
 */
exports.extractContentTopics = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { contentId } = req.query;

      // Validate parameters
      if (!contentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Extract topics
      const topics = await semanticContentIntelligence.extractContentTopics(contentId);

      // Return topics
      return res.status(200).json(topics);
    } catch (error) {
      console.error('Error extracting content topics:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Extract content entities
 */
exports.extractContentEntities = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { contentId } = req.query;

      // Validate parameters
      if (!contentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Extract entities
      const entities = await semanticContentIntelligence.extractContentEntities(contentId);

      // Return entities
      return res.status(200).json(entities);
    } catch (error) {
      console.error('Error extracting content entities:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Analyze content performance
 */
exports.analyzeContentPerformance = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { contentId } = req.body;

      // Validate parameters
      if (!contentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Analyze content performance
      const analysis = await semanticContentIntelligence.analyzeContentPerformance(contentId);

      // Return analysis
      return res.status(200).json(analysis);
    } catch (error) {
      console.error('Error analyzing content performance:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Identify high-performing content patterns
 */
exports.identifyHighPerformingPatterns = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, contentType } = req.body;

      // Validate parameters
      if (!userId || !contentType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Identify patterns
      const patterns = await semanticContentIntelligence.identifyHighPerformingPatterns(
        userId,
        contentType
      );

      // Return patterns
      return res.status(200).json(patterns);
    } catch (error) {
      console.error('Error identifying high-performing patterns:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate optimized content
 */
exports.generateOptimizedContent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { contentRequest, model } = req.body;

      // Validate parameters
      if (!contentRequest) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate content
      const content = await semanticContentIntelligence.generateOptimizedContent(
        contentRequest,
        model || 'openai'
      );

      // Return content
      return res.status(200).json(content);
    } catch (error) {
      console.error('Error generating optimized content:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate content variations
 */
exports.generateContentVariations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { contentId, count, model } = req.body;

      // Validate parameters
      if (!contentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate variations
      const variations = await semanticContentIntelligence.generateContentVariations(
        contentId,
        count || 3,
        model || 'openai'
      );

      // Return variations
      return res.status(200).json({ variations });
    } catch (error) {
      console.error('Error generating content variations:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Set up content A/B test
 */
exports.setupContentABTest = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { originalContentId, variationIds } = req.body;

      // Validate parameters
      if (!originalContentId || !variationIds || !Array.isArray(variationIds)) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Set up A/B test
      const test = await semanticContentIntelligence.setupContentABTest(
        originalContentId,
        variationIds
      );

      // Return test
      return res.status(200).json(test);
    } catch (error) {
      console.error('Error setting up content A/B test:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Update A/B test metrics
 */
exports.updateABTestMetrics = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { testId, variationId, metricType, value } = req.body;

      // Validate parameters
      if (!testId || !variationId || !metricType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Update metrics
      const updatedTest = await semanticContentIntelligence.updateABTestMetrics(
        testId,
        variationId,
        metricType,
        value || 1
      );

      // Return updated test
      return res.status(200).json(updatedTest);
    } catch (error) {
      console.error('Error updating A/B test metrics:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Complete A/B test
 */
exports.completeABTest = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { testId } = req.body;

      // Validate parameters
      if (!testId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Complete test
      const results = await semanticContentIntelligence.completeABTest(testId);

      // Return results
      return res.status(200).json(results);
    } catch (error) {
      console.error('Error completing A/B test:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate content insights
 */
exports.generateContentInsights = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { contentId } = req.body;

      // Validate parameters
      if (!contentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate insights
      const insights = await semanticContentIntelligence.generateContentInsights(contentId);

      // Return insights
      return res.status(200).json(insights);
    } catch (error) {
      console.error('Error generating content insights:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Batch analyze content
 */
exports.batchAnalyzeContent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, contentType, limit } = req.body;

      // Validate parameters
      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Batch analyze content
      const results = await semanticContentIntelligence.batchAnalyzeContent(
        userId,
        contentType || null,
        limit || 20
      );

      // Return results
      return res.status(200).json(results);
    } catch (error) {
      console.error('Error batch analyzing content:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate content calendar
 */
exports.generateContentCalendar = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, calendarRequest } = req.body;

      // Validate parameters
      if (!userId || !calendarRequest) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate calendar
      const calendar = await semanticContentIntelligence.generateContentCalendar(
        userId,
        calendarRequest
      );

      // Return calendar
      return res.status(200).json(calendar);
    } catch (error) {
      console.error('Error generating content calendar:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Scheduled function to analyze content performance daily
 */
exports.scheduledContentPerformanceAnalysis = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    console.log('Starting scheduled content performance analysis');
    
    // Get recent content
    const contentQuery = await admin.firestore().collection('marketingContent')
      .where('status', '==', 'published')
      .orderBy('generatedAt', 'desc')
      .limit(100)
      .get();
    
    if (contentQuery.empty) {
      console.log('No published content found');
      return null;
    }
    
    const analysisPromises = [];
    
    contentQuery.forEach(doc => {
      const contentId = doc.id;
      
      // Analyze content performance
      const promise = semanticContentIntelligence.analyzeContentPerformance(contentId)
        .catch(error => {
          console.error(`Error analyzing performance for content ${contentId}:`, error);
        });
      
      analysisPromises.push(promise);
    });
    
    await Promise.all(analysisPromises);
    
    console.log(`Scheduled content performance analysis completed for ${analysisPromises.length} content items`);
    return null;
  } catch (error) {
    console.error('Error in scheduled content performance analysis:', error);
    return null;
  }
});

/**
 * Trigger to analyze content semantics when new content is created
 */
exports.analyzeNewContent = functions.firestore
  .document('marketingContent/{contentId}')
  .onCreate(async (snapshot, context) => {
    try {
      const contentId = context.params.contentId;
      const contentData = snapshot.data();
      
      // Skip analysis for draft content
      if (contentData.status === 'draft') {
        return null;
      }
      
      // Analyze content semantics
      await semanticContentIntelligence.analyzeContentSemantics(contentId);
      
      console.log(`Analyzed semantics for new content ${contentId}`);
      return null;
    } catch (error) {
      console.error('Error analyzing new content:', error);
      return null;
    }
  });

/**
 * Trigger to update content patterns when content performance changes significantly
 */
exports.updateContentPatterns = functions.firestore
  .document('contentPerformanceAnalysis/{contentId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      
      // Check if performance score changed significantly
      if (Math.abs(afterData.performanceScore - beforeData.performanceScore) >= 10) {
        const contentId = context.params.contentId;
        
        // Get content data
        const contentDoc = await admin.firestore().collection('marketingContent').doc(contentId).get();
        
        if (!contentDoc.exists) {
          return null;
        }
        
        const contentData = contentDoc.data();
        
        // Update patterns for this content type
        await semanticContentIntelligence.identifyHighPerformingPatterns(
          contentData.userId,
          contentData.type
        );
        
        console.log(`Updated content patterns for user ${contentData.userId} and type ${contentData.type}`);
      }
      
      return null;
    } catch (error) {
      console.error('Error updating content patterns:', error);
      return null;
    }
  });

/**
 * Trigger to complete A/B tests after a specified duration
 */
exports.completeABTestsAfterDuration = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    console.log('Starting scheduled A/B test completion check');
    
    // Get active tests that have been running for at least 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const testsQuery = await admin.firestore().collection('contentABTests')
      .where('status', '==', 'active')
      .where('startDate', '<=', twoWeeksAgo)
      .get();
    
    if (testsQuery.empty) {
      console.log('No A/B tests to complete');
      return null;
    }
    
    const completionPromises = [];
    
    testsQuery.forEach(doc => {
      const testId = doc.id;
      
      // Complete test
      const promise = semanticContentIntelligence.completeABTest(testId)
        .catch(error => {
          console.error(`Error completing A/B test ${testId}:`, error);
        });
      
      completionPromises.push(promise);
    });
    
    await Promise.all(completionPromises);
    
    console.log(`Completed ${completionPromises.length} A/B tests`);
    return null;
  } catch (error) {
    console.error('Error in scheduled A/B test completion:', error);
    return null;
  }
});
