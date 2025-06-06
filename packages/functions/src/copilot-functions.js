/**
 * Firebase Cloud Functions for AI Marketing Copilot features
 */

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { aiMarketingCopilot, aiMarketingCopilotAutonomous } = require('./features');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Generate campaign improvement suggestions
 */
exports.generateCampaignSuggestions = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { campaignId, model } = req.body;

      // Validate parameters
      if (!campaignId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate suggestions
      const suggestions = await aiMarketingCopilot.generateCampaignSuggestions(
        campaignId,
        model || 'openai'
      );

      // Return suggestions
      return res.status(200).json({ suggestions });
    } catch (error) {
      console.error('Error generating campaign suggestions:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate content variations for A/B testing
 */
exports.generateContentVariations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { contentId, variations, model } = req.body;

      // Validate parameters
      if (!contentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate content variations
      const contentVariations = await aiMarketingCopilot.generateContentVariations(
        contentId,
        variations || 3,
        model || 'openai'
      );

      // Return content variations
      return res.status(200).json({ variations: contentVariations });
    } catch (error) {
      console.error('Error generating content variations:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Recommend optimal send times
 */
exports.recommendOptimalSendTimes = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, channelType } = req.body;

      // Validate parameters
      if (!userId || !channelType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get optimal send times
      const recommendations = await aiMarketingCopilot.recommendOptimalSendTimes(
        userId,
        channelType
      );

      // Return recommendations
      return res.status(200).json(recommendations);
    } catch (error) {
      console.error('Error recommending optimal send times:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Provide real-time coaching during campaign creation
 */
exports.provideRealTimeCoaching = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { campaignDraft, model } = req.body;

      // Validate parameters
      if (!campaignDraft) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get coaching feedback
      const coaching = await aiMarketingCopilot.provideRealTimeCoaching(
        campaignDraft,
        model || 'openai'
      );

      // Return coaching feedback
      return res.status(200).json(coaching);
    } catch (error) {
      console.error('Error providing real-time coaching:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Provide competitive intelligence and market insights
 */
exports.provideCompetitiveIntelligence = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { industry, model } = req.body;

      // Validate parameters
      if (!industry) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get competitive intelligence
      const intelligence = await aiMarketingCopilot.provideCompetitiveIntelligence(
        industry,
        model || 'openai'
      );

      // Return intelligence
      return res.status(200).json(intelligence);
    } catch (error) {
      console.error('Error providing competitive intelligence:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Update user's autonomous settings
 */
exports.updateAutonomousSettings = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, permissionLevel } = req.body;

      // Validate parameters
      if (!userId || !permissionLevel) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Validate permission level
      if (!Object.values(aiMarketingCopilotAutonomous.PERMISSION_LEVELS).includes(permissionLevel)) {
        return res.status(400).json({ error: 'Invalid permission level' });
      }

      // Update user's autonomous settings
      await admin.firestore().collection('users').doc(userId).update({
        autonomousSettings: {
          permissionLevel,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });

      // Return success
      return res.status(200).json({ 
        success: true,
        message: `Autonomous settings updated to ${permissionLevel}` 
      });
    } catch (error) {
      console.error('Error updating autonomous settings:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get user's autonomous settings
 */
exports.getAutonomousSettings = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { userId } = req.query;

      // Validate parameters
      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get user's autonomous settings
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userData = userDoc.data();
      const autonomousSettings = userData.autonomousSettings || { 
        permissionLevel: aiMarketingCopilotAutonomous.PERMISSION_LEVELS.NONE 
      };

      // Return settings
      return res.status(200).json(autonomousSettings);
    } catch (error) {
      console.error('Error getting autonomous settings:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Proactively monitor campaigns and identify optimization opportunities
 */
exports.monitorCampaigns = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId } = req.body;

      // Validate parameters
      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Monitor campaigns
      const opportunities = await aiMarketingCopilotAutonomous.monitorCampaigns(userId);

      // Return opportunities
      return res.status(200).json({ opportunities });
    } catch (error) {
      console.error('Error monitoring campaigns:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Implement campaign optimizations
 */
exports.implementOptimizations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, campaignId, opportunities } = req.body;

      // Validate parameters
      if (!userId || !campaignId || !opportunities) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Implement optimizations
      const results = await aiMarketingCopilotAutonomous.implementOptimizations(
        userId,
        campaignId,
        opportunities
      );

      // Return results
      return res.status(200).json({ results });
    } catch (error) {
      console.error('Error implementing optimizations:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Implement trending topics in marketing content
 */
exports.implementTrendingTopics = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, industry } = req.body;

      // Validate parameters
      if (!userId || !industry) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Implement trending topics
      const results = await aiMarketingCopilotAutonomous.implementTrendingTopics(
        userId,
        industry
      );

      // Return results
      return res.status(200).json(results);
    } catch (error) {
      console.error('Error implementing trending topics:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Manage cross-channel campaign coordination
 */
exports.manageCrossChannelCoordination = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId } = req.body;

      // Validate parameters
      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Manage cross-channel coordination
      const results = await aiMarketingCopilotAutonomous.manageCrossChannelCoordination(userId);

      // Return results
      return res.status(200).json(results);
    } catch (error) {
      console.error('Error managing cross-channel coordination:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get autonomous action logs for user
 */
exports.getAutonomousActionLogs = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { userId, limit } = req.query;

      // Validate parameters
      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get action logs
      const logsQuery = await admin.firestore().collection('autonomousActions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(parseInt(limit) || 20)
        .get();
      
      const logs = [];
      logsQuery.forEach(doc => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Return logs
      return res.status(200).json({ logs });
    } catch (error) {
      console.error('Error getting autonomous action logs:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Scheduled function to run autonomous monitoring daily
 */
exports.scheduledCampaignMonitoring = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    // Get users with autonomous settings enabled
    const usersQuery = await admin.firestore().collection('users')
      .where('autonomousSettings.permissionLevel', '!=', aiMarketingCopilotAutonomous.PERMISSION_LEVELS.NONE)
      .get();
    
    if (usersQuery.empty) {
      console.log('No users with autonomous settings enabled');
      return null;
    }
    
    const monitoringPromises = [];
    
    usersQuery.forEach(doc => {
      const userId = doc.id;
      const userData = doc.data();
      
      // Skip users who only want suggestions
      if (userData.autonomousSettings.permissionLevel === aiMarketingCopilotAutonomous.PERMISSION_LEVELS.SUGGEST_ONLY) {
        return;
      }
      
      // Monitor campaigns for this user
      const promise = aiMarketingCopilotAutonomous.monitorCampaigns(userId)
        .then(opportunities => {
          // Process opportunities for each campaign
          const campaignIds = [...new Set(opportunities.map(o => o.campaignId))];
          
          const optimizationPromises = campaignIds.map(campaignId => {
            const campaignOpportunities = opportunities
              .filter(o => o.campaignId === campaignId)
              .map(o => o.opportunities)
              .flat();
            
            if (campaignOpportunities.length > 0) {
              return aiMarketingCopilotAutonomous.implementOptimizations(
                userId,
                campaignId,
                campaignOpportunities
              );
            }
            
            return Promise.resolve();
          });
          
          return Promise.all(optimizationPromises);
        })
        .catch(error => {
          console.error(`Error monitoring campaigns for user ${userId}:`, error);
        });
      
      monitoringPromises.push(promise);
    });
    
    await Promise.all(monitoringPromises);
    
    console.log('Scheduled campaign monitoring completed successfully');
    return null;
  } catch (error) {
    console.error('Error in scheduled campaign monitoring:', error);
    return null;
  }
});

/**
 * Scheduled function to implement trending topics weekly
 */
exports.scheduledTrendImplementation = functions.pubsub.schedule('every monday 09:00').onRun(async (context) => {
  try {
    // Get users with high autonomous settings enabled
    const usersQuery = await admin.firestore().collection('users')
      .where('autonomousSettings.permissionLevel', '==', aiMarketingCopilotAutonomous.PERMISSION_LEVELS.HIGH)
      .get();
    
    if (usersQuery.empty) {
      console.log('No users with high autonomous settings enabled');
      return null;
    }
    
    const trendPromises = [];
    
    usersQuery.forEach(doc => {
      const userId = doc.id;
      const userData = doc.data();
      const industry = userData.industry || 'technology';
      
      // Implement trending topics for this user
      const promise = aiMarketingCopilotAutonomous.implementTrendingTopics(userId, industry)
        .catch(error => {
          console.error(`Error implementing trends for user ${userId}:`, error);
        });
      
      trendPromises.push(promise);
    });
    
    await Promise.all(trendPromises);
    
    console.log('Scheduled trend implementation completed successfully');
    return null;
  } catch (error) {
    console.error('Error in scheduled trend implementation:', error);
    return null;
  }
});
