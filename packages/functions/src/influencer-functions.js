/**
 * Firebase Cloud Functions for Integrated Influencer Marketplace
 */

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { integratedInfluencerMarketplace } = require('./features');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Search for influencers based on criteria
 */
exports.searchInfluencers = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get search criteria from request body
      const criteria = req.body;

      // Validate parameters
      if (!criteria) {
        return res.status(400).json({ error: 'Missing search criteria' });
      }

      // Search influencers
      const influencers = await integratedInfluencerMarketplace.searchInfluencers(criteria);

      // Return influencers
      return res.status(200).json({ influencers });
    } catch (error) {
      console.error('Error searching influencers:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get detailed influencer profile
 */
exports.getInfluencerProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { influencerId } = req.query;

      // Validate parameters
      if (!influencerId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get influencer profile
      const profile = await integratedInfluencerMarketplace.getInfluencerProfile(influencerId);

      // Return profile
      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error getting influencer profile:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Analyze influencer's audience and content
 */
exports.analyzeInfluencer = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { influencerId } = req.body;

      // Validate parameters
      if (!influencerId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Analyze influencer
      const analysis = await integratedInfluencerMarketplace.analyzeInfluencer(influencerId);

      // Return analysis
      return res.status(200).json(analysis);
    } catch (error) {
      console.error('Error analyzing influencer:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Recommend influencers for a campaign
 */
exports.recommendInfluencers = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { campaignData, count } = req.body;

      // Validate parameters
      if (!campaignData) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Recommend influencers
      const recommendations = await integratedInfluencerMarketplace.recommendInfluencers(
        campaignData,
        count || 10
      );

      // Return recommendations
      return res.status(200).json({ recommendations });
    } catch (error) {
      console.error('Error recommending influencers:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Create influencer campaign
 */
exports.createInfluencerCampaign = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const campaignData = req.body;

      // Validate parameters
      if (!campaignData || !campaignData.brandId || !campaignData.name || !campaignData.brief) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Create campaign
      const campaign = await integratedInfluencerMarketplace.createInfluencerCampaign(campaignData);

      // Return campaign
      return res.status(200).json(campaign);
    } catch (error) {
      console.error('Error creating influencer campaign:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Create collaboration request
 */
exports.createCollaborationRequest = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const requestData = req.body;

      // Validate parameters
      if (!requestData || !requestData.campaignId || !requestData.influencerId || !requestData.brandId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Create request
      const request = await integratedInfluencerMarketplace.createCollaborationRequest(requestData);

      // Return request
      return res.status(200).json(request);
    } catch (error) {
      console.error('Error creating collaboration request:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Update collaboration request status
 */
exports.updateCollaborationRequestStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { requestId, status, message } = req.body;

      // Validate parameters
      if (!requestId || !status) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Update status
      const updatedRequest = await integratedInfluencerMarketplace.updateCollaborationRequestStatus(
        requestId,
        status,
        message || ''
      );

      // Return updated request
      return res.status(200).json(updatedRequest);
    } catch (error) {
      console.error('Error updating collaboration request status:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Negotiate collaboration terms
 */
exports.negotiateTerms = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { requestId, counterOffer } = req.body;

      // Validate parameters
      if (!requestId || !counterOffer) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Negotiate terms
      const updatedRequest = await integratedInfluencerMarketplace.negotiateTerms(
        requestId,
        counterOffer
      );

      // Return updated request
      return res.status(200).json(updatedRequest);
    } catch (error) {
      console.error('Error negotiating terms:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Submit campaign content for approval
 */
exports.submitCampaignContent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { campaignId, influencerId, contentData } = req.body;

      // Validate parameters
      if (!campaignId || !influencerId || !contentData) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Submit content
      const content = await integratedInfluencerMarketplace.submitCampaignContent(
        campaignId,
        influencerId,
        contentData
      );

      // Return content
      return res.status(200).json(content);
    } catch (error) {
      console.error('Error submitting campaign content:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Review submitted content
 */
exports.reviewCampaignContent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { contentId, status, feedback } = req.body;

      // Validate parameters
      if (!contentId || !status) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Review content
      const updatedContent = await integratedInfluencerMarketplace.reviewCampaignContent(
        contentId,
        status,
        feedback || ''
      );

      // Return updated content
      return res.status(200).json(updatedContent);
    } catch (error) {
      console.error('Error reviewing campaign content:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Track campaign performance
 */
exports.trackCampaignPerformance = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { campaignId } = req.body;

      // Validate parameters
      if (!campaignId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Track performance
      const performance = await integratedInfluencerMarketplace.trackCampaignPerformance(campaignId);

      // Return performance
      return res.status(200).json(performance);
    } catch (error) {
      console.error('Error tracking campaign performance:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate campaign report
 */
exports.generateCampaignReport = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { campaignId } = req.body;

      // Validate parameters
      if (!campaignId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate report
      const report = await integratedInfluencerMarketplace.generateCampaignReport(campaignId);

      // Return report
      return res.status(200).json(report);
    } catch (error) {
      console.error('Error generating campaign report:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Scheduled function to update influencer metrics daily
 */
exports.scheduledInfluencerMetricsUpdate = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    console.log('Starting scheduled influencer metrics update');
    
    // Get all active influencers
    const influencersQuery = await admin.firestore().collection('influencers')
      .where('status', '==', 'active')
      .get();
    
    if (influencersQuery.empty) {
      console.log('No active influencers found');
      return null;
    }
    
    const updatePromises = [];
    
    influencersQuery.forEach(doc => {
      const influencerId = doc.id;
      
      // Update metrics for each influencer
      const promise = updateInfluencerMetrics(influencerId)
        .catch(error => {
          console.error(`Error updating metrics for influencer ${influencerId}:`, error);
        });
      
      updatePromises.push(promise);
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Scheduled influencer metrics update completed for ${updatePromises.length} influencers`);
    return null;
  } catch (error) {
    console.error('Error in scheduled influencer metrics update:', error);
    return null;
  }
});

/**
 * Update influencer metrics
 * @param {string} influencerId - Influencer ID
 * @returns {Promise<Object>} Updated metrics
 */
const updateInfluencerMetrics = async (influencerId) => {
  try {
    // Get influencer data
    const influencerDoc = await admin.firestore().collection('influencers').doc(influencerId).get();
    
    if (!influencerDoc.exists) {
      throw new Error(`Influencer with ID ${influencerId} not found`);
    }
    
    const influencer = influencerDoc.data();
    
    // Get recent content
    const contentQuery = await admin.firestore().collection('influencerContent')
      .where('influencerId', '==', influencerId)
      .orderBy('postedAt', 'desc')
      .limit(20)
      .get();
    
    if (contentQuery.empty) {
      return {
        influencerId,
        status: 'no_content',
        message: 'No recent content to analyze'
      };
    }
    
    // Calculate engagement metrics
    let totalEngagement = 0;
    let totalReach = 0;
    
    contentQuery.forEach(doc => {
      const content = doc.data();
      
      if (content.engagementMetrics) {
        const engagement = 
          (content.engagementMetrics.likes || 0) + 
          (content.engagementMetrics.comments || 0) + 
          (content.engagementMetrics.shares || 0);
        
        totalEngagement += engagement;
        totalReach += content.reach || influencer.followerCount || 0;
      }
    });
    
    // Calculate engagement rate
    const engagementRate = totalReach > 0 ? totalEngagement / totalReach : 0;
    
    // Update influencer metrics
    await admin.firestore().collection('influencers').doc(influencerId).update({
      engagementRate,
      lastMetricsUpdate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      influencerId,
      engagementRate,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating influencer metrics:', error);
    throw new Error('Failed to update influencer metrics');
  }
};

/**
 * Scheduled function to track active campaign performance daily
 */
exports.scheduledCampaignPerformanceTracking = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    console.log('Starting scheduled campaign performance tracking');
    
    // Get all active campaigns
    const campaignsQuery = await admin.firestore().collection('influencerCampaigns')
      .where('status', '==', integratedInfluencerMarketplace.CAMPAIGN_STATUS.IN_PROGRESS)
      .get();
    
    if (campaignsQuery.empty) {
      console.log('No active campaigns found');
      return null;
    }
    
    const trackingPromises = [];
    
    campaignsQuery.forEach(doc => {
      const campaignId = doc.id;
      
      // Track performance for each campaign
      const promise = integratedInfluencerMarketplace.trackCampaignPerformance(campaignId)
        .catch(error => {
          console.error(`Error tracking performance for campaign ${campaignId}:`, error);
        });
      
      trackingPromises.push(promise);
    });
    
    await Promise.all(trackingPromises);
    
    console.log(`Scheduled campaign performance tracking completed for ${trackingPromises.length} campaigns`);
    return null;
  } catch (error) {
    console.error('Error in scheduled campaign performance tracking:', error);
    return null;
  }
});

/**
 * Trigger to generate campaign report when campaign is completed
 */
exports.generateReportOnCampaignCompletion = functions.firestore
  .document('influencerCampaigns/{campaignId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      
      // Check if status changed to completed
      if (beforeData.status !== integratedInfluencerMarketplace.CAMPAIGN_STATUS.COMPLETED &&
          afterData.status === integratedInfluencerMarketplace.CAMPAIGN_STATUS.COMPLETED) {
        
        const campaignId = context.params.campaignId;
        
        // Generate report
        await integratedInfluencerMarketplace.generateCampaignReport(campaignId);
        
        console.log(`Generated report for completed campaign ${campaignId}`);
      }
      
      return null;
    } catch (error) {
      console.error('Error generating report on campaign completion:', error);
      return null;
    }
  });
