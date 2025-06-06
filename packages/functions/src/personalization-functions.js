/**
 * Firebase Cloud Functions for Omnichannel Personalization Engine
 */

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { omnichannelPersonalizationEngine } = require('./features');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Update customer profile
 */
exports.updateCustomerProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId, profileData } = req.body;

      // Validate parameters
      if (!customerId || !profileData) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Update profile
      const profile = await omnichannelPersonalizationEngine.updateCustomerProfile(customerId, profileData);

      // Return profile
      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error updating customer profile:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Track customer interaction
 */
exports.trackInteraction = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const interactionData = req.body;

      // Validate parameters
      if (!interactionData || !interactionData.customerId || !interactionData.channelType || !interactionData.interactionType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Track interaction
      const interaction = await omnichannelPersonalizationEngine.trackInteraction(interactionData);

      // Return interaction
      return res.status(200).json(interaction);
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get personalized content
 */
exports.getPersonalizedContent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId, contentRequest } = req.body;

      // Validate parameters
      if (!customerId || !contentRequest || !contentRequest.channelType || !contentRequest.contentType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get personalized content
      const content = await omnichannelPersonalizationEngine.getPersonalizedContent(customerId, contentRequest);

      // Return content
      return res.status(200).json(content);
    } catch (error) {
      console.error('Error getting personalized content:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Track content engagement
 */
exports.trackContentEngagement = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId, contentId, engagementType, engagementData } = req.body;

      // Validate parameters
      if (!customerId || !contentId || !engagementType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Track engagement
      const engagement = await omnichannelPersonalizationEngine.trackContentEngagement(
        customerId,
        contentId,
        engagementType,
        engagementData || {}
      );

      // Return engagement
      return res.status(200).json(engagement);
    } catch (error) {
      console.error('Error tracking content engagement:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get personalized recommendations
 */
exports.getPersonalizedRecommendations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId, recommendationRequest } = req.body;

      // Validate parameters
      if (!customerId || !recommendationRequest || !recommendationRequest.recommendationType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get recommendations
      const recommendations = await omnichannelPersonalizationEngine.getPersonalizedRecommendations(
        customerId,
        recommendationRequest
      );

      // Return recommendations
      return res.status(200).json(recommendations);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Track recommendation engagement
 */
exports.trackRecommendationEngagement = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId, recommendationId, itemId, engagementType, engagementData } = req.body;

      // Validate parameters
      if (!customerId || !recommendationId || !itemId || !engagementType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Track engagement
      const engagement = await omnichannelPersonalizationEngine.trackRecommendationEngagement(
        customerId,
        recommendationId,
        itemId,
        engagementType,
        engagementData || {}
      );

      // Return engagement
      return res.status(200).json(engagement);
    } catch (error) {
      console.error('Error tracking recommendation engagement:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Create personalized campaign
 */
exports.createPersonalizedCampaign = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, campaignData } = req.body;

      // Validate parameters
      if (!userId || !campaignData || !campaignData.name || !campaignData.channelType || !campaignData.audienceFilter) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Create campaign
      const campaign = await omnichannelPersonalizationEngine.createPersonalizedCampaign(userId, campaignData);

      // Return campaign
      return res.status(200).json(campaign);
    } catch (error) {
      console.error('Error creating personalized campaign:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate campaign content
 */
exports.generateCampaignContent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { campaignId, contentRequest } = req.body;

      // Validate parameters
      if (!campaignId || !contentRequest || !contentRequest.segmentId || !contentRequest.contentType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate content
      const content = await omnichannelPersonalizationEngine.generateCampaignContent(campaignId, contentRequest);

      // Return content
      return res.status(200).json(content);
    } catch (error) {
      console.error('Error generating campaign content:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Launch personalized campaign
 */
exports.launchPersonalizedCampaign = functions.https.onRequest((req, res) => {
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

      // Launch campaign
      const result = await omnichannelPersonalizationEngine.launchPersonalizedCampaign(campaignId);

      // Return result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error launching personalized campaign:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get campaign performance
 */
exports.getCampaignPerformance = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { campaignId } = req.query;

      // Validate parameters
      if (!campaignId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get performance
      const performance = await omnichannelPersonalizationEngine.getCampaignPerformance(campaignId);

      // Return performance
      return res.status(200).json(performance);
    } catch (error) {
      console.error('Error getting campaign performance:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Scheduled function to process campaign delivery tasks
 */
exports.scheduledCampaignDelivery = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  try {
    console.log('Starting scheduled campaign delivery');
    
    // Process delivery tasks
    const result = await omnichannelPersonalizationEngine.processCampaignDeliveryTasks(100);
    
    console.log(`Processed ${result.processed} delivery tasks: ${result.success} succeeded, ${result.failed} failed`);
    return null;
  } catch (error) {
    console.error('Error in scheduled campaign delivery:', error);
    return null;
  }
});

/**
 * Trigger to update customer profile when new user is created
 */
exports.createProfileOnNewUser = functions.auth.user().onCreate(async (user) => {
  try {
    const customerId = user.uid;
    
    // Create initial profile
    const profileData = {
      email: user.email,
      displayName: user.displayName,
      [omnichannelPersonalizationEngine.PROFILE_FIELDS.LIFECYCLE_STAGE]: 'new'
    };
    
    // Update profile
    await omnichannelPersonalizationEngine.updateCustomerProfile(customerId, profileData);
    
    console.log(`Created profile for new user ${customerId}`);
    return null;
  } catch (error) {
    console.error('Error creating profile for new user:', error);
    return null;
  }
});

/**
 * Trigger to track interaction when new content is viewed
 */
exports.trackContentView = functions.firestore
  .document('contentViews/{viewId}')
  .onCreate(async (snapshot, context) => {
    try {
      const viewData = snapshot.data();
      
      if (!viewData.customerId || !viewData.contentId) {
        return null;
      }
      
      // Track as interaction
      await omnichannelPersonalizationEngine.trackInteraction({
        customerId: viewData.customerId,
        channelType: viewData.channelType || omnichannelPersonalizationEngine.CHANNEL_TYPES.WEB,
        interactionType: 'content_view',
        contentId: viewData.contentId,
        contentType: viewData.contentType || 'unknown'
      });
      
      console.log(`Tracked content view for customer ${viewData.customerId}`);
      return null;
    } catch (error) {
      console.error('Error tracking content view:', error);
      return null;
    }
  });

/**
 * Trigger to track interaction when new product is viewed
 */
exports.trackProductView = functions.firestore
  .document('productViews/{viewId}')
  .onCreate(async (snapshot, context) => {
    try {
      const viewData = snapshot.data();
      
      if (!viewData.customerId || !viewData.productId) {
        return null;
      }
      
      // Track as interaction
      await omnichannelPersonalizationEngine.trackInteraction({
        customerId: viewData.customerId,
        channelType: viewData.channelType || omnichannelPersonalizationEngine.CHANNEL_TYPES.WEB,
        interactionType: 'product_view',
        productId: viewData.productId,
        category: viewData.category || 'unknown'
      });
      
      console.log(`Tracked product view for customer ${viewData.customerId}`);
      return null;
    } catch (error) {
      console.error('Error tracking product view:', error);
      return null;
    }
  });

/**
 * Trigger to update profile when new purchase is made
 */
exports.updateProfileOnPurchase = functions.firestore
  .document('purchases/{purchaseId}')
  .onCreate(async (snapshot, context) => {
    try {
      const purchaseData = snapshot.data();
      
      if (!purchaseData.customerId) {
        return null;
      }
      
      // Update profile
      const profileData = {
        [omnichannelPersonalizationEngine.PROFILE_FIELDS.LIFECYCLE_STAGE]: 'active',
        [omnichannelPersonalizationEngine.PROFILE_FIELDS.PURCHASE_HISTORY]: {
          items: [{
            purchaseId: context.params.purchaseId,
            productId: purchaseData.productId,
            category: purchaseData.category,
            price: purchaseData.price,
            timestamp: purchaseData.timestamp || admin.firestore.FieldValue.serverTimestamp()
          }]
        }
      };
      
      await omnichannelPersonalizationEngine.updateCustomerProfile(purchaseData.customerId, profileData);
      
      // Track as interaction
      await omnichannelPersonalizationEngine.trackInteraction({
        customerId: purchaseData.customerId,
        channelType: purchaseData.channelType || omnichannelPersonalizationEngine.CHANNEL_TYPES.WEB,
        interactionType: 'purchase',
        productId: purchaseData.productId,
        purchaseId: context.params.purchaseId,
        price: purchaseData.price
      });
      
      console.log(`Updated profile for customer ${purchaseData.customerId} with purchase`);
      return null;
    } catch (error) {
      console.error('Error updating profile on purchase:', error);
      return null;
    }
  });

/**
 * Scheduled function to update lifecycle stages
 */
exports.scheduledLifecycleUpdate = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    console.log('Starting scheduled lifecycle update');
    
    // Get active customers
    const activeCustomersQuery = await admin.firestore().collection('customerProfiles')
      .where(omnichannelPersonalizationEngine.PROFILE_FIELDS.LIFECYCLE_STAGE, '==', 'active')
      .get();
    
    if (activeCustomersQuery.empty) {
      console.log('No active customers found');
      return null;
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const batch = admin.firestore().batch();
    let atRiskCount = 0;
    let churnedCount = 0;
    
    activeCustomersQuery.forEach(doc => {
      const profile = doc.data();
      const purchaseHistory = profile[omnichannelPersonalizationEngine.PROFILE_FIELDS.PURCHASE_HISTORY]?.items || [];
      
      if (purchaseHistory.length === 0) {
        return;
      }
      
      // Find last purchase date
      const lastPurchase = purchaseHistory.reduce((latest, purchase) => {
        const purchaseDate = purchase.timestamp instanceof admin.firestore.Timestamp
          ? purchase.timestamp.toDate()
          : new Date(purchase.timestamp);
        
        return latest ? (purchaseDate > latest ? purchaseDate : latest) : purchaseDate;
      }, null);
      
      if (!lastPurchase) {
        return;
      }
      
      // Update lifecycle stage
      if (lastPurchase < ninetyDaysAgo) {
        // Churned
        batch.update(doc.ref, {
          [omnichannelPersonalizationEngine.PROFILE_FIELDS.LIFECYCLE_STAGE]: 'churned',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        churnedCount += 1;
      } else if (lastPurchase < thirtyDaysAgo) {
        // At risk
        batch.update(doc.ref, {
          [omnichannelPersonalizationEngine.PROFILE_FIELDS.LIFECYCLE_STAGE]: 'at_risk',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        atRiskCount += 1;
      }
    });
    
    // Commit batch
    await batch.commit();
    
    console.log(`Updated lifecycle stages: ${atRiskCount} at risk, ${churnedCount} churned`);
    return null;
  } catch (error) {
    console.error('Error in scheduled lifecycle update:', error);
    return null;
  }
});
