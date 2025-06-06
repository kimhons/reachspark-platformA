/**
 * Firebase Cloud Functions for Predictive Customer Journey Orchestration
 */

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { predictiveCustomerJourney } = require('./features');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Analyze customer's current journey stage
 */
exports.analyzeCurrentJourneyStage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId } = req.body;

      // Validate parameters
      if (!customerId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Analyze journey stage
      const journeyAnalysis = await predictiveCustomerJourney.analyzeCurrentJourneyStage(customerId);

      // Return analysis
      return res.status(200).json(journeyAnalysis);
    } catch (error) {
      console.error('Error analyzing journey stage:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Predict next best actions for customer journey
 */
exports.predictNextBestActions = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId, currentStage, count } = req.body;

      // Validate parameters
      if (!customerId || !currentStage) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Predict next best actions
      const nextBestActions = await predictiveCustomerJourney.predictNextBestActions(
        customerId,
        currentStage,
        count || 3
      );

      // Return next best actions
      return res.status(200).json({ nextBestActions });
    } catch (error) {
      console.error('Error predicting next best actions:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Detect journey transitions for a customer
 */
exports.detectJourneyTransitions = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId } = req.body;

      // Validate parameters
      if (!customerId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Detect journey transitions
      const transitions = await predictiveCustomerJourney.detectJourneyTransitions(customerId);

      // Return transitions
      return res.status(200).json(transitions);
    } catch (error) {
      console.error('Error detecting journey transitions:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Orchestrate customer journey
 */
exports.orchestrateCustomerJourney = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId } = req.body;

      // Validate parameters
      if (!customerId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Orchestrate journey
      const orchestrationResults = await predictiveCustomerJourney.orchestrateCustomerJourney(customerId);

      // Return orchestration results
      return res.status(200).json(orchestrationResults);
    } catch (error) {
      console.error('Error orchestrating customer journey:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate journey insights for a customer
 */
exports.generateJourneyInsights = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { customerId } = req.body;

      // Validate parameters
      if (!customerId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate insights
      const insights = await predictiveCustomerJourney.generateJourneyInsights(customerId);

      // Return insights
      return res.status(200).json(insights);
    } catch (error) {
      console.error('Error generating journey insights:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Batch process customer journeys
 */
exports.batchProcessCustomerJourneys = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { batchSize } = req.body;

      // Batch process journeys
      const results = await predictiveCustomerJourney.batchProcessCustomerJourneys(
        batchSize || 50
      );

      // Return results
      return res.status(200).json(results);
    } catch (error) {
      console.error('Error batch processing customer journeys:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Scheduled function to process customer journeys daily
 */
exports.scheduledJourneyProcessing = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    console.log('Starting scheduled journey processing');
    
    // Process in batches of 100
    const batchSize = 100;
    let processedCount = 0;
    let hasMore = true;
    
    while (hasMore) {
      const results = await predictiveCustomerJourney.batchProcessCustomerJourneys(batchSize);
      
      processedCount += results.customersProcessed;
      
      // If we processed fewer than the batch size, we're done
      if (results.customersProcessed < batchSize) {
        hasMore = false;
      }
      
      // Avoid hitting quotas by processing max 1000 customers per run
      if (processedCount >= 1000) {
        hasMore = false;
      }
    }
    
    console.log(`Scheduled journey processing completed: ${processedCount} customers processed`);
    return null;
  } catch (error) {
    console.error('Error in scheduled journey processing:', error);
    return null;
  }
});

/**
 * Process journey transitions on customer interaction
 */
exports.processJourneyOnInteraction = functions.firestore
  .document('customerInteractions/{interactionId}')
  .onCreate(async (snapshot, context) => {
    try {
      const interaction = snapshot.data();
      const customerId = interaction.customerId;
      
      if (!customerId) {
        console.error('Interaction missing customerId:', context.params.interactionId);
        return null;
      }
      
      // Only process certain high-value interaction types
      const highValueInteractions = [
        predictiveCustomerJourney.INTERACTION_TYPES.PURCHASE,
        predictiveCustomerJourney.INTERACTION_TYPES.FORM_SUBMISSION,
        predictiveCustomerJourney.INTERACTION_TYPES.CONTENT_DOWNLOAD,
        predictiveCustomerJourney.INTERACTION_TYPES.CART_ABANDONMENT,
        predictiveCustomerJourney.INTERACTION_TYPES.SUBSCRIPTION_CHANGE
      ];
      
      if (highValueInteractions.includes(interaction.type)) {
        // Analyze journey stage
        await predictiveCustomerJourney.analyzeCurrentJourneyStage(customerId);
        
        // Detect transitions
        const transitions = await predictiveCustomerJourney.detectJourneyTransitions(customerId);
        
        // If critical transitions detected, orchestrate journey
        const criticalTransitions = transitions.transitions.filter(t => 
          t.type === predictiveCustomerJourney.TRANSITION_TYPES.CHURN_RISK ||
          t.type === predictiveCustomerJourney.TRANSITION_TYPES.REGRESSION
        );
        
        if (criticalTransitions.length > 0) {
          await predictiveCustomerJourney.orchestrateCustomerJourney(customerId);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error processing journey on interaction:', error);
      return null;
    }
  });

/**
 * Update journey stage history daily
 */
exports.updateJourneyStageHistory = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    // Get all customer journeys
    const journeysQuery = await admin.firestore().collection('customerJourneys').get();
    
    if (journeysQuery.empty) {
      console.log('No customer journeys found');
      return null;
    }
    
    const historyPromises = [];
    
    journeysQuery.forEach(doc => {
      const customerId = doc.id;
      const journeyData = doc.data();
      
      // Only record if we have stage data
      if (journeyData.currentStage) {
        const historyEntry = {
          customerId,
          currentStage: journeyData.currentStage,
          confidence: journeyData.confidence || 0,
          stageScores: journeyData.stageScores || {},
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const promise = admin.firestore().collection('customerJourneyHistory').add(historyEntry);
        historyPromises.push(promise);
      }
    });
    
    await Promise.all(historyPromises);
    
    console.log(`Updated journey history for ${historyPromises.length} customers`);
    return null;
  } catch (error) {
    console.error('Error updating journey stage history:', error);
    return null;
  }
});
