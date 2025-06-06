/**
 * Firebase Cloud Functions for Revenue Attribution AI
 */

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { revenueAttributionAI } = require('./features');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Track customer touchpoint
 */
exports.trackTouchpoint = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get touchpoint data from request body
      const touchpointData = req.body;

      // Validate parameters
      if (!touchpointData || !touchpointData.userId || !touchpointData.customerId || !touchpointData.channelType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Track touchpoint
      const touchpoint = await revenueAttributionAI.trackTouchpoint(touchpointData);

      // Return touchpoint
      return res.status(200).json(touchpoint);
    } catch (error) {
      console.error('Error tracking touchpoint:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Track conversion
 */
exports.trackConversion = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get conversion data from request body
      const conversionData = req.body;

      // Validate parameters
      if (!conversionData || !conversionData.userId || !conversionData.customerId || !conversionData.conversionType) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Track conversion
      const conversion = await revenueAttributionAI.trackConversion(conversionData);

      // Return conversion with attribution
      return res.status(200).json(conversion);
    } catch (error) {
      console.error('Error tracking conversion:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Attribute conversion
 */
exports.attributeConversion = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { conversionId, model } = req.body;

      // Validate parameters
      if (!conversionId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Attribute conversion
      const attribution = await revenueAttributionAI.attributeConversion(
        conversionId,
        model || revenueAttributionAI.ATTRIBUTION_MODELS.ALGORITHMIC
      );

      // Return attribution
      return res.status(200).json(attribution);
    } catch (error) {
      console.error('Error attributing conversion:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate attribution report
 */
exports.generateAttributionReport = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, reportParams } = req.body;

      // Validate parameters
      if (!userId || !reportParams || !reportParams.startDate || !reportParams.endDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate report
      const report = await revenueAttributionAI.generateAttributionReport(userId, reportParams);

      // Return report
      return res.status(200).json(report);
    } catch (error) {
      console.error('Error generating attribution report:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate budget recommendations
 */
exports.generateBudgetRecommendations = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, budgetParams } = req.body;

      // Validate parameters
      if (!userId || !budgetParams || !budgetParams.totalBudget || !budgetParams.startDate || !budgetParams.endDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate recommendations
      const recommendations = await revenueAttributionAI.generateBudgetRecommendations(userId, budgetParams);

      // Return recommendations
      return res.status(200).json(recommendations);
    } catch (error) {
      console.error('Error generating budget recommendations:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate ROI forecast
 */
exports.generateROIForecast = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, forecastParams } = req.body;

      // Validate parameters
      if (!userId || !forecastParams || !forecastParams.budgetAllocation || !forecastParams.startDate || !forecastParams.endDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate forecast
      const forecast = await revenueAttributionAI.generateROIForecast(userId, forecastParams);

      // Return forecast
      return res.status(200).json(forecast);
    } catch (error) {
      console.error('Error generating ROI forecast:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate marketing mix model
 */
exports.generateMarketingMixModel = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { userId, modelParams } = req.body;

      // Validate parameters
      if (!userId || !modelParams || !modelParams.startDate || !modelParams.endDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate model
      const model = await revenueAttributionAI.generateMarketingMixModel(userId, modelParams);

      // Return model
      return res.status(200).json(model);
    } catch (error) {
      console.error('Error generating marketing mix model:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Scheduled function to attribute pending conversions
 */
exports.scheduledConversionAttribution = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    console.log('Starting scheduled conversion attribution');
    
    // Get unattributed conversions
    const conversionsQuery = await admin.firestore().collection('customerConversions')
      .where('attribution', '==', null)
      .limit(100)
      .get();
    
    if (conversionsQuery.empty) {
      console.log('No unattributed conversions found');
      return null;
    }
    
    const attributionPromises = [];
    
    conversionsQuery.forEach(doc => {
      const conversionId = doc.id;
      
      // Attribute conversion
      const promise = revenueAttributionAI.attributeConversion(conversionId)
        .catch(error => {
          console.error(`Error attributing conversion ${conversionId}:`, error);
        });
      
      attributionPromises.push(promise);
    });
    
    await Promise.all(attributionPromises);
    
    console.log(`Scheduled conversion attribution completed for ${attributionPromises.length} conversions`);
    return null;
  } catch (error) {
    console.error('Error in scheduled conversion attribution:', error);
    return null;
  }
});

/**
 * Trigger to update customer journey when new touchpoint is added
 */
exports.updateJourneyOnNewTouchpoint = functions.firestore
  .document('customerTouchpoints/{touchpointId}')
  .onCreate(async (snapshot, context) => {
    try {
      const touchpointData = snapshot.data();
      const customerId = touchpointData.customerId;
      
      if (!customerId) {
        return null;
      }
      
      // Add touchpoint ID to data
      const touchpoint = {
        touchpointId: context.params.touchpointId,
        ...touchpointData
      };
      
      // Update customer journey
      await revenueAttributionAI.updateCustomerJourney(customerId, touchpoint);
      
      console.log(`Updated journey for customer ${customerId} with new touchpoint`);
      return null;
    } catch (error) {
      console.error('Error updating journey on new touchpoint:', error);
      return null;
    }
  });

/**
 * Trigger to update customer journey when new conversion is added
 */
exports.updateJourneyOnNewConversion = functions.firestore
  .document('customerConversions/{conversionId}')
  .onCreate(async (snapshot, context) => {
    try {
      const conversionData = snapshot.data();
      const customerId = conversionData.customerId;
      
      if (!customerId) {
        return null;
      }
      
      // Add conversion ID to data
      const conversion = {
        conversionId: context.params.conversionId,
        ...conversionData
      };
      
      // Update customer journey with conversion
      await revenueAttributionAI.updateCustomerJourneyWithConversion(customerId, conversion);
      
      console.log(`Updated journey for customer ${customerId} with new conversion`);
      return null;
    } catch (error) {
      console.error('Error updating journey on new conversion:', error);
      return null;
    }
  });

/**
 * Scheduled function to generate attribution reports
 */
exports.scheduledAttributionReports = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    console.log('Starting scheduled attribution reports generation');
    
    // Get users with conversions in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const conversionsQuery = await admin.firestore().collection('customerConversions')
      .where('timestamp', '>=', thirtyDaysAgo)
      .get();
    
    if (conversionsQuery.empty) {
      console.log('No recent conversions found');
      return null;
    }
    
    // Get unique user IDs
    const userIds = new Set();
    
    conversionsQuery.forEach(doc => {
      const conversion = doc.data();
      if (conversion.userId) {
        userIds.add(conversion.userId);
      }
    });
    
    if (userIds.size === 0) {
      console.log('No users found for attribution reports');
      return null;
    }
    
    // Generate reports for each user
    const reportPromises = [];
    
    userIds.forEach(userId => {
      // Generate report for last 30 days
      const reportParams = {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date().toISOString()
      };
      
      const promise = revenueAttributionAI.generateAttributionReport(userId, reportParams)
        .catch(error => {
          console.error(`Error generating attribution report for user ${userId}:`, error);
        });
      
      reportPromises.push(promise);
    });
    
    await Promise.all(reportPromises);
    
    console.log(`Scheduled attribution reports completed for ${reportPromises.length} users`);
    return null;
  } catch (error) {
    console.error('Error in scheduled attribution reports:', error);
    return null;
  }
});

/**
 * Scheduled function to update marketing mix models
 */
exports.scheduledMarketingMixModels = functions.pubsub.schedule('every 168 hours').onRun(async (context) => {
  try {
    console.log('Starting scheduled marketing mix model updates');
    
    // Get users with existing models
    const modelsQuery = await admin.firestore().collection('marketingMixModels')
      .orderBy('generatedAt', 'desc')
      .get();
    
    if (modelsQuery.empty) {
      console.log('No existing marketing mix models found');
      return null;
    }
    
    // Get unique user IDs with last model date
    const userLastModel = new Map();
    
    modelsQuery.forEach(doc => {
      const model = doc.data();
      if (model.userId && !userLastModel.has(model.userId)) {
        userLastModel.set(model.userId, model.generatedAt);
      }
    });
    
    if (userLastModel.size === 0) {
      console.log('No users found for marketing mix model updates');
      return null;
    }
    
    // Update models for each user
    const modelPromises = [];
    
    userLastModel.forEach((lastModelDate, userId) => {
      // Only update if last model is older than 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const lastModelTimestamp = lastModelDate instanceof admin.firestore.Timestamp
        ? lastModelDate.toDate()
        : new Date(lastModelDate);
      
      if (lastModelTimestamp < twoWeeksAgo) {
        // Generate model for last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const modelParams = {
          startDate: ninetyDaysAgo.toISOString(),
          endDate: new Date().toISOString()
        };
        
        const promise = revenueAttributionAI.generateMarketingMixModel(userId, modelParams)
          .catch(error => {
            console.error(`Error generating marketing mix model for user ${userId}:`, error);
          });
        
        modelPromises.push(promise);
      }
    });
    
    await Promise.all(modelPromises);
    
    console.log(`Scheduled marketing mix model updates completed for ${modelPromises.length} users`);
    return null;
  } catch (error) {
    console.error('Error in scheduled marketing mix model updates:', error);
    return null;
  }
});
