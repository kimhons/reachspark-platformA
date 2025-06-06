/**
 * Predictive Customer Journey Orchestration
 * 
 * This module implements the Predictive Customer Journey Orchestration feature,
 * which uses AI to predict the optimal next steps in each customer's journey
 * and automatically adjusts campaigns based on real-time behavior.
 * 
 * The system analyzes customer interactions across channels, identifies patterns,
 * predicts future behaviors, and orchestrates personalized journeys at scale.
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
 * Customer journey stages
 */
const JOURNEY_STAGES = {
  AWARENESS: 'awareness',
  CONSIDERATION: 'consideration',
  DECISION: 'decision',
  RETENTION: 'retention',
  ADVOCACY: 'advocacy'
};

/**
 * Customer journey transition types
 */
const TRANSITION_TYPES = {
  PROGRESSION: 'progression',   // Moving forward in journey
  REGRESSION: 'regression',     // Moving backward in journey
  STAGNATION: 'stagnation',     // Stuck in current stage
  ACCELERATION: 'acceleration', // Moving quickly through stages
  CHURN_RISK: 'churn_risk'      // At risk of abandoning journey
};

/**
 * Interaction types for journey analysis
 */
const INTERACTION_TYPES = {
  EMAIL_OPEN: 'email_open',
  EMAIL_CLICK: 'email_click',
  WEBSITE_VISIT: 'website_visit',
  PAGE_VIEW: 'page_view',
  CONTENT_DOWNLOAD: 'content_download',
  FORM_SUBMISSION: 'form_submission',
  PURCHASE: 'purchase',
  CART_ABANDONMENT: 'cart_abandonment',
  SOCIAL_ENGAGEMENT: 'social_engagement',
  SUPPORT_REQUEST: 'support_request',
  PRODUCT_USAGE: 'product_usage',
  SUBSCRIPTION_CHANGE: 'subscription_change'
};

/**
 * Analyze customer's current journey stage based on interactions
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Current journey stage and confidence
 */
const analyzeCurrentJourneyStage = async (customerId) => {
  try {
    // Get customer profile
    const customerDoc = await db.collection('customers').doc(customerId).get();
    
    if (!customerDoc.exists) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    const customer = customerDoc.data();
    
    // Get recent interactions
    const interactionsQuery = await db.collection('customerInteractions')
      .where('customerId', '==', customerId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    
    const interactions = [];
    interactionsQuery.forEach(doc => {
      interactions.push(doc.data());
    });
    
    // If no interactions, use customer profile data to estimate stage
    if (interactions.length === 0) {
      return estimateStageFromProfile(customer);
    }
    
    // Count interaction types
    const interactionCounts = countInteractionTypes(interactions);
    
    // Calculate stage scores based on interaction patterns
    const stageScores = calculateStageScores(interactionCounts, customer);
    
    // Determine current stage based on highest score
    const currentStage = Object.keys(stageScores).reduce((a, b) => 
      stageScores[a] > stageScores[b] ? a : b
    );
    
    // Calculate confidence level
    const totalScore = Object.values(stageScores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? stageScores[currentStage] / totalScore : 0.5;
    
    // Store journey stage analysis in Firestore
    await db.collection('customerJourneys').doc(customerId).set({
      customerId,
      currentStage,
      stageScores,
      confidence,
      lastAnalyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      interactionCounts
    }, { merge: true });
    
    return {
      customerId,
      currentStage,
      confidence,
      stageScores
    };
  } catch (error) {
    console.error('Error analyzing current journey stage:', error);
    throw new Error('Failed to analyze current journey stage');
  }
};

/**
 * Estimate journey stage from customer profile when no interactions are available
 * @param {Object} customer - Customer profile data
 * @returns {Object} Estimated journey stage and confidence
 */
const estimateStageFromProfile = (customer) => {
  // Default to awareness stage for new customers
  const defaultStage = {
    customerId: customer.id,
    currentStage: JOURNEY_STAGES.AWARENESS,
    confidence: 0.7,
    stageScores: {
      [JOURNEY_STAGES.AWARENESS]: 0.7,
      [JOURNEY_STAGES.CONSIDERATION]: 0.2,
      [JOURNEY_STAGES.DECISION]: 0.1,
      [JOURNEY_STAGES.RETENTION]: 0,
      [JOURNEY_STAGES.ADVOCACY]: 0
    }
  };
  
  // If customer has purchase history, adjust stage
  if (customer.purchaseCount && customer.purchaseCount > 0) {
    if (customer.purchaseCount >= 3) {
      // Multiple purchases indicate retention stage
      return {
        customerId: customer.id,
        currentStage: JOURNEY_STAGES.RETENTION,
        confidence: 0.8,
        stageScores: {
          [JOURNEY_STAGES.AWARENESS]: 0,
          [JOURNEY_STAGES.CONSIDERATION]: 0,
          [JOURNEY_STAGES.DECISION]: 0.1,
          [JOURNEY_STAGES.RETENTION]: 0.8,
          [JOURNEY_STAGES.ADVOCACY]: 0.1
        }
      };
    } else {
      // At least one purchase indicates decision stage
      return {
        customerId: customer.id,
        currentStage: JOURNEY_STAGES.DECISION,
        confidence: 0.7,
        stageScores: {
          [JOURNEY_STAGES.AWARENESS]: 0,
          [JOURNEY_STAGES.CONSIDERATION]: 0.2,
          [JOURNEY_STAGES.DECISION]: 0.7,
          [JOURNEY_STAGES.RETENTION]: 0.1,
          [JOURNEY_STAGES.ADVOCACY]: 0
        }
      };
    }
  }
  
  // If customer has viewed product pages but no purchase, likely in consideration
  if (customer.productPagesViewed && customer.productPagesViewed > 3) {
    return {
      customerId: customer.id,
      currentStage: JOURNEY_STAGES.CONSIDERATION,
      confidence: 0.6,
      stageScores: {
        [JOURNEY_STAGES.AWARENESS]: 0.3,
        [JOURNEY_STAGES.CONSIDERATION]: 0.6,
        [JOURNEY_STAGES.DECISION]: 0.1,
        [JOURNEY_STAGES.RETENTION]: 0,
        [JOURNEY_STAGES.ADVOCACY]: 0
      }
    };
  }
  
  return defaultStage;
};

/**
 * Count interaction types from customer interactions
 * @param {Array} interactions - Customer interactions
 * @returns {Object} Counts of each interaction type
 */
const countInteractionTypes = (interactions) => {
  const counts = {};
  
  // Initialize counts for all interaction types
  Object.values(INTERACTION_TYPES).forEach(type => {
    counts[type] = 0;
  });
  
  // Count interactions by type
  interactions.forEach(interaction => {
    if (counts[interaction.type] !== undefined) {
      counts[interaction.type]++;
    }
  });
  
  return counts;
};

/**
 * Calculate stage scores based on interaction patterns
 * @param {Object} interactionCounts - Counts of each interaction type
 * @param {Object} customer - Customer profile data
 * @returns {Object} Scores for each journey stage
 */
const calculateStageScores = (interactionCounts, customer) => {
  const scores = {
    [JOURNEY_STAGES.AWARENESS]: 0,
    [JOURNEY_STAGES.CONSIDERATION]: 0,
    [JOURNEY_STAGES.DECISION]: 0,
    [JOURNEY_STAGES.RETENTION]: 0,
    [JOURNEY_STAGES.ADVOCACY]: 0
  };
  
  // Awareness indicators
  scores[JOURNEY_STAGES.AWARENESS] += interactionCounts[INTERACTION_TYPES.EMAIL_OPEN] * 0.5;
  scores[JOURNEY_STAGES.AWARENESS] += interactionCounts[INTERACTION_TYPES.WEBSITE_VISIT] * 0.7;
  scores[JOURNEY_STAGES.AWARENESS] += interactionCounts[INTERACTION_TYPES.PAGE_VIEW] * 0.3;
  scores[JOURNEY_STAGES.AWARENESS] += interactionCounts[INTERACTION_TYPES.SOCIAL_ENGAGEMENT] * 0.6;
  
  // Consideration indicators
  scores[JOURNEY_STAGES.CONSIDERATION] += interactionCounts[INTERACTION_TYPES.EMAIL_CLICK] * 0.6;
  scores[JOURNEY_STAGES.CONSIDERATION] += interactionCounts[INTERACTION_TYPES.CONTENT_DOWNLOAD] * 0.8;
  scores[JOURNEY_STAGES.CONSIDERATION] += interactionCounts[INTERACTION_TYPES.CART_ABANDONMENT] * 0.7;
  scores[JOURNEY_STAGES.CONSIDERATION] += interactionCounts[INTERACTION_TYPES.PAGE_VIEW] * 0.5;
  
  // Decision indicators
  scores[JOURNEY_STAGES.DECISION] += interactionCounts[INTERACTION_TYPES.FORM_SUBMISSION] * 0.7;
  scores[JOURNEY_STAGES.DECISION] += interactionCounts[INTERACTION_TYPES.PURCHASE] * 1.0;
  scores[JOURNEY_STAGES.DECISION] += interactionCounts[INTERACTION_TYPES.CART_ABANDONMENT] * 0.3;
  
  // Retention indicators
  scores[JOURNEY_STAGES.RETENTION] += interactionCounts[INTERACTION_TYPES.PURCHASE] * 0.5;
  scores[JOURNEY_STAGES.RETENTION] += interactionCounts[INTERACTION_TYPES.PRODUCT_USAGE] * 0.8;
  scores[JOURNEY_STAGES.RETENTION] += interactionCounts[INTERACTION_TYPES.SUPPORT_REQUEST] * 0.4;
  scores[JOURNEY_STAGES.RETENTION] += interactionCounts[INTERACTION_TYPES.SUBSCRIPTION_CHANGE] * 0.6;
  
  // Advocacy indicators
  scores[JOURNEY_STAGES.ADVOCACY] += interactionCounts[INTERACTION_TYPES.SOCIAL_ENGAGEMENT] * 0.7;
  scores[JOURNEY_STAGES.ADVOCACY] += interactionCounts[INTERACTION_TYPES.PRODUCT_USAGE] * 0.4;
  
  // Adjust based on customer profile
  if (customer.purchaseCount && customer.purchaseCount > 0) {
    scores[JOURNEY_STAGES.AWARENESS] *= 0.5;
    scores[JOURNEY_STAGES.CONSIDERATION] *= 0.7;
    scores[JOURNEY_STAGES.DECISION] += customer.purchaseCount * 2;
    scores[JOURNEY_STAGES.RETENTION] += customer.purchaseCount * 1.5;
    
    if (customer.purchaseCount >= 3) {
      scores[JOURNEY_STAGES.ADVOCACY] += customer.purchaseCount * 0.5;
    }
  }
  
  if (customer.subscriptionStatus === 'active') {
    scores[JOURNEY_STAGES.RETENTION] += 5;
  }
  
  if (customer.referralCount && customer.referralCount > 0) {
    scores[JOURNEY_STAGES.ADVOCACY] += customer.referralCount * 3;
  }
  
  return scores;
};

/**
 * Predict next best actions for customer journey
 * @param {string} customerId - Customer ID
 * @param {string} currentStage - Current journey stage
 * @param {number} [count=3] - Number of actions to recommend
 * @returns {Promise<Array>} Recommended next best actions
 */
const predictNextBestActions = async (customerId, currentStage, count = 3) => {
  try {
    // Get customer profile
    const customerDoc = await db.collection('customers').doc(customerId).get();
    
    if (!customerDoc.exists) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    const customer = customerDoc.data();
    
    // Get recent interactions
    const interactionsQuery = await db.collection('customerInteractions')
      .where('customerId', '==', customerId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    const interactions = [];
    interactionsQuery.forEach(doc => {
      interactions.push(doc.data());
    });
    
    // Get available campaigns
    const campaignsQuery = await db.collection('campaigns')
      .where('status', '==', 'active')
      .where('targetJourneyStage', '==', currentStage)
      .get();
    
    const availableCampaigns = [];
    campaignsQuery.forEach(doc => {
      availableCampaigns.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // If no campaigns available for current stage, look for campaigns in adjacent stages
    if (availableCampaigns.length === 0) {
      const adjacentStages = getAdjacentStages(currentStage);
      
      const adjacentCampaignsQuery = await db.collection('campaigns')
        .where('status', '==', 'active')
        .where('targetJourneyStage', 'in', adjacentStages)
        .get();
      
      adjacentCampaignsQuery.forEach(doc => {
        availableCampaigns.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }
    
    // If still no campaigns available, return empty recommendations
    if (availableCampaigns.length === 0) {
      return [];
    }
    
    // Score campaigns based on customer data and interactions
    const scoredCampaigns = await scoreCampaignsForCustomer(
      availableCampaigns,
      customer,
      interactions,
      currentStage
    );
    
    // Sort campaigns by score and take top recommendations
    const recommendations = scoredCampaigns
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(campaign => ({
        campaignId: campaign.id,
        campaignName: campaign.name,
        channelType: campaign.channelType,
        recommendedAction: getRecommendedAction(campaign, currentStage),
        expectedOutcome: getExpectedOutcome(campaign, currentStage),
        score: campaign.score,
        reasoning: campaign.reasoning
      }));
    
    // Store recommendations in Firestore
    await db.collection('customerJourneys').doc(customerId).set({
      nextBestActions: recommendations,
      recommendationsGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    return recommendations;
  } catch (error) {
    console.error('Error predicting next best actions:', error);
    throw new Error('Failed to predict next best actions');
  }
};

/**
 * Get adjacent journey stages for a given stage
 * @param {string} currentStage - Current journey stage
 * @returns {Array} Adjacent stages
 */
const getAdjacentStages = (currentStage) => {
  const stageOrder = [
    JOURNEY_STAGES.AWARENESS,
    JOURNEY_STAGES.CONSIDERATION,
    JOURNEY_STAGES.DECISION,
    JOURNEY_STAGES.RETENTION,
    JOURNEY_STAGES.ADVOCACY
  ];
  
  const currentIndex = stageOrder.indexOf(currentStage);
  
  if (currentIndex === -1) {
    return [JOURNEY_STAGES.AWARENESS, JOURNEY_STAGES.CONSIDERATION];
  }
  
  const adjacentStages = [];
  
  // Add previous stage if exists
  if (currentIndex > 0) {
    adjacentStages.push(stageOrder[currentIndex - 1]);
  }
  
  // Add next stage if exists
  if (currentIndex < stageOrder.length - 1) {
    adjacentStages.push(stageOrder[currentIndex + 1]);
  }
  
  return adjacentStages;
};

/**
 * Score campaigns for a specific customer based on profile and interactions
 * @param {Array} campaigns - Available campaigns
 * @param {Object} customer - Customer profile
 * @param {Array} interactions - Customer interactions
 * @param {string} currentStage - Current journey stage
 * @returns {Promise<Array>} Scored campaigns
 */
const scoreCampaignsForCustomer = async (campaigns, customer, interactions, currentStage) => {
  try {
    // Get customer segments
    const segments = customer.segments || [];
    
    // Get customer preferences
    const preferences = customer.preferences || {};
    
    // Get interaction history by type
    const interactionsByType = {};
    Object.values(INTERACTION_TYPES).forEach(type => {
      interactionsByType[type] = interactions.filter(i => i.type === type);
    });
    
    // Score each campaign
    const scoredCampaigns = campaigns.map(campaign => {
      let score = 50; // Base score
      let reasoning = [];
      
      // Adjust score based on campaign-customer fit
      
      // 1. Target segment match
      if (campaign.targetSegments && campaign.targetSegments.length > 0) {
        const segmentOverlap = campaign.targetSegments.filter(segment => segments.includes(segment));
        if (segmentOverlap.length > 0) {
          const segmentBoost = 10 * (segmentOverlap.length / campaign.targetSegments.length);
          score += segmentBoost;
          reasoning.push(`Segment match: +${segmentBoost.toFixed(1)} points`);
        } else {
          score -= 15;
          reasoning.push('No segment match: -15 points');
        }
      }
      
      // 2. Channel preference match
      if (preferences.preferredChannels && preferences.preferredChannels.includes(campaign.channelType)) {
        score += 15;
        reasoning.push('Preferred channel: +15 points');
      }
      
      // 3. Content type preference match
      if (preferences.preferredContentTypes && 
          campaign.contentType && 
          preferences.preferredContentTypes.includes(campaign.contentType)) {
        score += 10;
        reasoning.push('Preferred content type: +10 points');
      }
      
      // 4. Previous engagement with similar campaigns
      const similarCampaignInteractions = interactions.filter(i => 
        i.campaignId && i.campaignCategory === campaign.category
      );
      
      if (similarCampaignInteractions.length > 0) {
        // Check if engagements were positive
        const positiveInteractions = similarCampaignInteractions.filter(i => 
          i.type === INTERACTION_TYPES.EMAIL_CLICK || 
          i.type === INTERACTION_TYPES.FORM_SUBMISSION ||
          i.type === INTERACTION_TYPES.PURCHASE
        );
        
        if (positiveInteractions.length > 0) {
          const engagementBoost = Math.min(20, positiveInteractions.length * 5);
          score += engagementBoost;
          reasoning.push(`Positive engagement history: +${engagementBoost} points`);
        } else {
          score -= 10;
          reasoning.push('Poor engagement with similar campaigns: -10 points');
        }
      }
      
      // 5. Journey stage appropriateness
      if (campaign.targetJourneyStage === currentStage) {
        score += 20;
        reasoning.push('Exact journey stage match: +20 points');
      } else if (getAdjacentStages(currentStage).includes(campaign.targetJourneyStage)) {
        score += 5;
        reasoning.push('Adjacent journey stage: +5 points');
      } else {
        score -= 25;
        reasoning.push('Inappropriate journey stage: -25 points');
      }
      
      // 6. Recency penalty (if customer recently received this campaign)
      const recentCampaignInteraction = interactions.find(i => 
        i.campaignId === campaign.id && 
        i.timestamp && 
        (new Date() - new Date(i.timestamp)) < (7 * 24 * 60 * 60 * 1000) // Within last 7 days
      );
      
      if (recentCampaignInteraction) {
        score -= 30;
        reasoning.push('Recently received this campaign: -30 points');
      }
      
      // 7. Campaign performance boost
      if (campaign.performance && campaign.performance.conversionRate > 0.1) {
        const performanceBoost = Math.min(15, campaign.performance.conversionRate * 100);
        score += performanceBoost;
        reasoning.push(`High-performing campaign: +${performanceBoost.toFixed(1)} points`);
      }
      
      // Ensure score is within reasonable bounds
      score = Math.max(0, Math.min(100, score));
      
      return {
        ...campaign,
        score,
        reasoning: reasoning.join(', ')
      };
    });
    
    return scoredCampaigns;
  } catch (error) {
    console.error('Error scoring campaigns:', error);
    throw new Error('Failed to score campaigns');
  }
};

/**
 * Get recommended action based on campaign and journey stage
 * @param {Object} campaign - Campaign data
 * @param {string} currentStage - Current journey stage
 * @returns {string} Recommended action
 */
const getRecommendedAction = (campaign, currentStage) => {
  const actions = {
    [JOURNEY_STAGES.AWARENESS]: {
      email: 'Send educational email about industry trends',
      social: 'Show awareness-building social media ad',
      content: 'Recommend top-of-funnel blog content'
    },
    [JOURNEY_STAGES.CONSIDERATION]: {
      email: 'Send product comparison email',
      social: 'Show product feature highlight on social media',
      content: 'Offer relevant case study or whitepaper'
    },
    [JOURNEY_STAGES.DECISION]: {
      email: 'Send limited-time offer email',
      social: 'Show testimonial-focused social ad',
      content: 'Provide product demo or free trial'
    },
    [JOURNEY_STAGES.RETENTION]: {
      email: 'Send product usage tips email',
      social: 'Show advanced feature tutorial on social media',
      content: 'Offer exclusive content for existing customers'
    },
    [JOURNEY_STAGES.ADVOCACY]: {
      email: 'Send referral program email',
      social: 'Engage with customer on social media',
      content: 'Invite to customer community or event'
    }
  };
  
  // Map campaign channel to action type
  let actionType = 'email';
  if (['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'].includes(campaign.channelType)) {
    actionType = 'social';
  } else if (['blog', 'website', 'landing_page'].includes(campaign.channelType)) {
    actionType = 'content';
  }
  
  // Get action for stage and type
  return actions[currentStage]?.[actionType] || `Send ${campaign.channelType} campaign "${campaign.name}"`;
};

/**
 * Get expected outcome based on campaign and journey stage
 * @param {Object} campaign - Campaign data
 * @param {string} currentStage - Current journey stage
 * @returns {string} Expected outcome
 */
const getExpectedOutcome = (campaign, currentStage) => {
  const outcomes = {
    [JOURNEY_STAGES.AWARENESS]: 'Increase brand awareness and education',
    [JOURNEY_STAGES.CONSIDERATION]: 'Drive product interest and evaluation',
    [JOURNEY_STAGES.DECISION]: 'Convert prospect to customer',
    [JOURNEY_STAGES.RETENTION]: 'Increase product usage and satisfaction',
    [JOURNEY_STAGES.ADVOCACY]: 'Turn customer into brand advocate'
  };
  
  return outcomes[currentStage] || 'Improve customer engagement';
};

/**
 * Detect significant journey transitions
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Detected transitions
 */
const detectJourneyTransitions = async (customerId) => {
  try {
    // Get customer journey history
    const journeyHistoryQuery = await db.collection('customerJourneyHistory')
      .where('customerId', '==', customerId)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const journeyHistory = [];
    journeyHistoryQuery.forEach(doc => {
      journeyHistory.push(doc.data());
    });
    
    // Get current journey stage
    const journeyDoc = await db.collection('customerJourneys').doc(customerId).get();
    
    if (!journeyDoc.exists) {
      // No journey data yet, can't detect transitions
      return {
        customerId,
        transitions: []
      };
    }
    
    const currentJourney = journeyDoc.data();
    const currentStage = currentJourney.currentStage;
    
    // If no history or only one entry, can't detect transitions
    if (journeyHistory.length < 2) {
      return {
        customerId,
        transitions: []
      };
    }
    
    const transitions = [];
    
    // Check for stage changes
    const previousStage = journeyHistory[0].currentStage;
    
    if (currentStage !== previousStage) {
      // Determine transition type
      const stageOrder = [
        JOURNEY_STAGES.AWARENESS,
        JOURNEY_STAGES.CONSIDERATION,
        JOURNEY_STAGES.DECISION,
        JOURNEY_STAGES.RETENTION,
        JOURNEY_STAGES.ADVOCACY
      ];
      
      const currentIndex = stageOrder.indexOf(currentStage);
      const previousIndex = stageOrder.indexOf(previousStage);
      
      if (currentIndex > previousIndex) {
        transitions.push({
          type: TRANSITION_TYPES.PROGRESSION,
          fromStage: previousStage,
          toStage: currentStage,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (currentIndex < previousIndex) {
        transitions.push({
          type: TRANSITION_TYPES.REGRESSION,
          fromStage: previousStage,
          toStage: currentStage,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } else {
      // Check for stagnation
      const oldestHistoryEntry = journeyHistory[journeyHistory.length - 1];
      const daysSinceOldestEntry = (Date.now() - new Date(oldestHistoryEntry.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceOldestEntry > 30 && oldestHistoryEntry.currentStage === currentStage) {
        transitions.push({
          type: TRANSITION_TYPES.STAGNATION,
          stage: currentStage,
          durationDays: Math.floor(daysSinceOldestEntry),
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    // Check for acceleration (multiple stage changes in short period)
    if (journeyHistory.length >= 3) {
      const uniqueStages = new Set(journeyHistory.map(h => h.currentStage));
      const daysSinceThirdEntry = (Date.now() - new Date(journeyHistory[2].timestamp).getTime()) / (1000 * 60 * 60 * 24);
      
      if (uniqueStages.size >= 3 && daysSinceThirdEntry < 14) {
        transitions.push({
          type: TRANSITION_TYPES.ACCELERATION,
          stages: Array.from(uniqueStages),
          durationDays: Math.floor(daysSinceThirdEntry),
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    // Check for churn risk
    const hasRecentNegativeInteractions = await checkForNegativeInteractions(customerId);
    
    if (hasRecentNegativeInteractions) {
      transitions.push({
        type: TRANSITION_TYPES.CHURN_RISK,
        stage: currentStage,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Store detected transitions
    if (transitions.length > 0) {
      await db.collection('customerJourneyTransitions').add({
        customerId,
        transitions,
        detectedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return {
      customerId,
      transitions
    };
  } catch (error) {
    console.error('Error detecting journey transitions:', error);
    throw new Error('Failed to detect journey transitions');
  }
};

/**
 * Check for recent negative interactions that might indicate churn risk
 * @param {string} customerId - Customer ID
 * @returns {Promise<boolean>} Whether negative interactions were detected
 */
const checkForNegativeInteractions = async (customerId) => {
  try {
    // Get recent interactions
    const interactionsQuery = await db.collection('customerInteractions')
      .where('customerId', '==', customerId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    const interactions = [];
    interactionsQuery.forEach(doc => {
      interactions.push(doc.data());
    });
    
    // Check for negative patterns
    
    // 1. Multiple support requests
    const supportRequests = interactions.filter(i => 
      i.type === INTERACTION_TYPES.SUPPORT_REQUEST
    );
    
    if (supportRequests.length >= 3) {
      return true;
    }
    
    // 2. Subscription downgrade
    const subscriptionChanges = interactions.filter(i => 
      i.type === INTERACTION_TYPES.SUBSCRIPTION_CHANGE && 
      i.changeType === 'downgrade'
    );
    
    if (subscriptionChanges.length > 0) {
      return true;
    }
    
    // 3. Decreased product usage
    const productUsage = interactions.filter(i => 
      i.type === INTERACTION_TYPES.PRODUCT_USAGE
    );
    
    if (productUsage.length >= 5) {
      // Check if usage is declining
      const usageValues = productUsage.map(i => i.usageMetric || 0);
      const recentAvg = usageValues.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
      const previousAvg = usageValues.slice(3, 6).reduce((sum, val) => sum + val, 0) / 3;
      
      if (recentAvg < previousAvg * 0.7) {
        return true;
      }
    }
    
    // 4. No recent engagement
    const lastInteractionTime = interactions.length > 0 ? 
      new Date(interactions[0].timestamp) : 
      new Date(0);
    
    const daysSinceLastInteraction = (Date.now() - lastInteractionTime.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastInteraction > 60) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for negative interactions:', error);
    return false;
  }
};

/**
 * Orchestrate customer journey based on predictions
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Orchestration results
 */
const orchestrateCustomerJourney = async (customerId) => {
  try {
    // 1. Analyze current journey stage
    const journeyAnalysis = await analyzeCurrentJourneyStage(customerId);
    
    // 2. Detect any significant transitions
    const transitionDetection = await detectJourneyTransitions(customerId);
    
    // 3. Predict next best actions
    const nextBestActions = await predictNextBestActions(
      customerId,
      journeyAnalysis.currentStage
    );
    
    // 4. Determine if we should take immediate action
    const shouldTakeAction = await shouldTakeImmediateAction(
      customerId,
      journeyAnalysis,
      transitionDetection
    );
    
    // 5. Execute actions if appropriate
    let executedActions = [];
    
    if (shouldTakeAction && nextBestActions.length > 0) {
      executedActions = await executeJourneyActions(
        customerId,
        nextBestActions,
        journeyAnalysis,
        transitionDetection
      );
    }
    
    // 6. Update journey orchestration history
    await db.collection('journeyOrchestrationHistory').add({
      customerId,
      journeyAnalysis,
      transitions: transitionDetection.transitions,
      nextBestActions,
      actionsTaken: executedActions,
      orchestratedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      customerId,
      journeyStage: journeyAnalysis.currentStage,
      confidence: journeyAnalysis.confidence,
      transitions: transitionDetection.transitions,
      recommendedActions: nextBestActions,
      executedActions
    };
  } catch (error) {
    console.error('Error orchestrating customer journey:', error);
    throw new Error('Failed to orchestrate customer journey');
  }
};

/**
 * Determine if immediate action should be taken
 * @param {string} customerId - Customer ID
 * @param {Object} journeyAnalysis - Journey stage analysis
 * @param {Object} transitionDetection - Detected transitions
 * @returns {Promise<boolean>} Whether immediate action should be taken
 */
const shouldTakeImmediateAction = async (customerId, journeyAnalysis, transitionDetection) => {
  try {
    // Get customer settings
    const customerDoc = await db.collection('customers').doc(customerId).get();
    
    if (!customerDoc.exists) {
      return false;
    }
    
    const customer = customerDoc.data();
    
    // Check if customer has opted out of automated journeys
    if (customer.preferences && customer.preferences.optOutAutomatedJourneys) {
      return false;
    }
    
    // Check if we've taken action recently
    const recentActionsQuery = await db.collection('journeyOrchestrationHistory')
      .where('customerId', '==', customerId)
      .where('actionsTaken', '!=', [])
      .orderBy('actionsTaken')
      .orderBy('orchestratedAt', 'desc')
      .limit(1)
      .get();
    
    if (!recentActionsQuery.empty) {
      const recentAction = recentActionsQuery.docs[0].data();
      const hoursSinceLastAction = (Date.now() - new Date(recentAction.orchestratedAt).getTime()) / (1000 * 60 * 60);
      
      // Don't take action if we've acted within the last 24 hours
      if (hoursSinceLastAction < 24) {
        return false;
      }
    }
    
    // Always take action for certain transitions
    const criticalTransitions = transitionDetection.transitions.filter(t => 
      t.type === TRANSITION_TYPES.CHURN_RISK ||
      t.type === TRANSITION_TYPES.REGRESSION ||
      t.type === TRANSITION_TYPES.STAGNATION
    );
    
    if (criticalTransitions.length > 0) {
      return true;
    }
    
    // Take action if we're highly confident about the journey stage
    if (journeyAnalysis.confidence > 0.8) {
      return true;
    }
    
    // Default to not taking action
    return false;
  } catch (error) {
    console.error('Error determining if immediate action should be taken:', error);
    return false;
  }
};

/**
 * Execute journey actions based on predictions
 * @param {string} customerId - Customer ID
 * @param {Array} nextBestActions - Recommended next best actions
 * @param {Object} journeyAnalysis - Journey stage analysis
 * @param {Object} transitionDetection - Detected transitions
 * @returns {Promise<Array>} Executed actions
 */
const executeJourneyActions = async (customerId, nextBestActions, journeyAnalysis, transitionDetection) => {
  try {
    // Get customer data
    const customerDoc = await db.collection('customers').doc(customerId).get();
    
    if (!customerDoc.exists) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    const customer = customerDoc.data();
    
    // Determine which action to take
    let actionToExecute = nextBestActions[0]; // Default to highest-scored action
    
    // Override for critical transitions
    const criticalTransitions = transitionDetection.transitions.filter(t => 
      t.type === TRANSITION_TYPES.CHURN_RISK ||
      t.type === TRANSITION_TYPES.REGRESSION
    );
    
    if (criticalTransitions.length > 0) {
      // For churn risk, find retention-focused action
      const churnRisk = criticalTransitions.find(t => t.type === TRANSITION_TYPES.CHURN_RISK);
      
      if (churnRisk) {
        // Get retention campaigns
        const retentionCampaignsQuery = await db.collection('campaigns')
          .where('status', '==', 'active')
          .where('targetJourneyStage', '==', JOURNEY_STAGES.RETENTION)
          .where('isChurnPrevention', '==', true)
          .limit(1)
          .get();
        
        if (!retentionCampaignsQuery.empty) {
          const retentionCampaign = retentionCampaignsQuery.docs[0].data();
          
          actionToExecute = {
            campaignId: retentionCampaignsQuery.docs[0].id,
            campaignName: retentionCampaign.name,
            channelType: retentionCampaign.channelType,
            recommendedAction: 'Send retention offer to prevent churn',
            expectedOutcome: 'Prevent customer churn and rebuild engagement',
            score: 95,
            reasoning: 'Critical churn risk detected'
          };
        }
      }
    }
    
    // Execute the selected action
    const executionResult = await executeCampaignAction(
      customerId,
      customer,
      actionToExecute,
      journeyAnalysis.currentStage
    );
    
    // Record the execution
    await db.collection('journeyActionExecutions').add({
      customerId,
      action: actionToExecute,
      result: executionResult,
      journeyStage: journeyAnalysis.currentStage,
      executedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return [
      {
        ...actionToExecute,
        executionResult
      }
    ];
  } catch (error) {
    console.error('Error executing journey actions:', error);
    throw new Error('Failed to execute journey actions');
  }
};

/**
 * Execute a specific campaign action for a customer
 * @param {string} customerId - Customer ID
 * @param {Object} customer - Customer data
 * @param {Object} action - Action to execute
 * @param {string} journeyStage - Current journey stage
 * @returns {Promise<Object>} Execution result
 */
const executeCampaignAction = async (customerId, customer, action, journeyStage) => {
  try {
    // Get campaign details
    const campaignDoc = await db.collection('campaigns').doc(action.campaignId).get();
    
    if (!campaignDoc.exists) {
      throw new Error(`Campaign with ID ${action.campaignId} not found`);
    }
    
    const campaign = campaignDoc.data();
    
    // Execute based on channel type
    switch (campaign.channelType) {
      case 'email':
        return await executeEmailCampaign(customerId, customer, campaign, journeyStage);
        
      case 'sms':
        return await executeSMSCampaign(customerId, customer, campaign, journeyStage);
        
      case 'push':
        return await executePushCampaign(customerId, customer, campaign, journeyStage);
        
      case 'facebook':
      case 'instagram':
      case 'twitter':
      case 'linkedin':
      case 'tiktok':
        return await executeSocialCampaign(customerId, customer, campaign, journeyStage);
        
      default:
        throw new Error(`Unsupported channel type: ${campaign.channelType}`);
    }
  } catch (error) {
    console.error('Error executing campaign action:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Execute an email campaign
 * @param {string} customerId - Customer ID
 * @param {Object} customer - Customer data
 * @param {Object} campaign - Campaign data
 * @param {string} journeyStage - Current journey stage
 * @returns {Promise<Object>} Execution result
 */
const executeEmailCampaign = async (customerId, customer, campaign, journeyStage) => {
  try {
    // Check if customer has email
    if (!customer.email) {
      return {
        success: false,
        error: 'Customer has no email address'
      };
    }
    
    // Personalize content
    const personalizedContent = await personalizeContent(
      campaign.content,
      customer,
      journeyStage
    );
    
    // Create email task
    const emailTask = {
      customerId,
      campaignId: campaign.id,
      to: customer.email,
      subject: campaign.subject,
      content: personalizedContent,
      scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to email queue
    const emailTaskRef = await db.collection('emailTasks').add(emailTask);
    
    // Record interaction
    await db.collection('customerInteractions').add({
      customerId,
      campaignId: campaign.id,
      type: 'email_scheduled',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        emailTaskId: emailTaskRef.id,
        subject: campaign.subject
      }
    });
    
    return {
      success: true,
      channelType: 'email',
      scheduledFor: emailTask.scheduledFor,
      emailTaskId: emailTaskRef.id
    };
  } catch (error) {
    console.error('Error executing email campaign:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Execute an SMS campaign
 * @param {string} customerId - Customer ID
 * @param {Object} customer - Customer data
 * @param {Object} campaign - Campaign data
 * @param {string} journeyStage - Current journey stage
 * @returns {Promise<Object>} Execution result
 */
const executeSMSCampaign = async (customerId, customer, campaign, journeyStage) => {
  try {
    // Check if customer has phone
    if (!customer.phone) {
      return {
        success: false,
        error: 'Customer has no phone number'
      };
    }
    
    // Personalize content
    const personalizedContent = await personalizeContent(
      campaign.content,
      customer,
      journeyStage
    );
    
    // Create SMS task
    const smsTask = {
      customerId,
      campaignId: campaign.id,
      to: customer.phone,
      content: personalizedContent,
      scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to SMS queue
    const smsTaskRef = await db.collection('smsTasks').add(smsTask);
    
    // Record interaction
    await db.collection('customerInteractions').add({
      customerId,
      campaignId: campaign.id,
      type: 'sms_scheduled',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        smsTaskId: smsTaskRef.id
      }
    });
    
    return {
      success: true,
      channelType: 'sms',
      scheduledFor: smsTask.scheduledFor,
      smsTaskId: smsTaskRef.id
    };
  } catch (error) {
    console.error('Error executing SMS campaign:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Execute a push notification campaign
 * @param {string} customerId - Customer ID
 * @param {Object} customer - Customer data
 * @param {Object} campaign - Campaign data
 * @param {string} journeyStage - Current journey stage
 * @returns {Promise<Object>} Execution result
 */
const executePushCampaign = async (customerId, customer, campaign, journeyStage) => {
  try {
    // Check if customer has push token
    if (!customer.pushToken) {
      return {
        success: false,
        error: 'Customer has no push token'
      };
    }
    
    // Personalize content
    const personalizedTitle = await personalizeContent(
      campaign.title,
      customer,
      journeyStage
    );
    
    const personalizedBody = await personalizeContent(
      campaign.content,
      customer,
      journeyStage
    );
    
    // Create push task
    const pushTask = {
      customerId,
      campaignId: campaign.id,
      token: customer.pushToken,
      title: personalizedTitle,
      body: personalizedBody,
      data: campaign.data || {},
      scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to push queue
    const pushTaskRef = await db.collection('pushTasks').add(pushTask);
    
    // Record interaction
    await db.collection('customerInteractions').add({
      customerId,
      campaignId: campaign.id,
      type: 'push_scheduled',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        pushTaskId: pushTaskRef.id,
        title: personalizedTitle
      }
    });
    
    return {
      success: true,
      channelType: 'push',
      scheduledFor: pushTask.scheduledFor,
      pushTaskId: pushTaskRef.id
    };
  } catch (error) {
    console.error('Error executing push campaign:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Execute a social media campaign
 * @param {string} customerId - Customer ID
 * @param {Object} customer - Customer data
 * @param {Object} campaign - Campaign data
 * @param {string} journeyStage - Current journey stage
 * @returns {Promise<Object>} Execution result
 */
const executeSocialCampaign = async (customerId, customer, campaign, journeyStage) => {
  try {
    // Check if customer has social ID for this channel
    const socialIdField = `${campaign.channelType}Id`;
    if (!customer[socialIdField]) {
      return {
        success: false,
        error: `Customer has no ${campaign.channelType} ID`
      };
    }
    
    // Personalize content
    const personalizedContent = await personalizeContent(
      campaign.content,
      customer,
      journeyStage
    );
    
    // Create social ad task
    const socialTask = {
      customerId,
      campaignId: campaign.id,
      platform: campaign.channelType,
      targetId: customer[socialIdField],
      content: personalizedContent,
      mediaUrl: campaign.mediaUrl,
      scheduledFor: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to social queue
    const socialTaskRef = await db.collection('socialAdTasks').add(socialTask);
    
    // Record interaction
    await db.collection('customerInteractions').add({
      customerId,
      campaignId: campaign.id,
      type: 'social_ad_scheduled',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        socialTaskId: socialTaskRef.id,
        platform: campaign.channelType
      }
    });
    
    return {
      success: true,
      channelType: campaign.channelType,
      scheduledFor: socialTask.scheduledFor,
      socialTaskId: socialTaskRef.id
    };
  } catch (error) {
    console.error('Error executing social campaign:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Personalize content for a specific customer
 * @param {string} content - Original content
 * @param {Object} customer - Customer data
 * @param {string} journeyStage - Current journey stage
 * @returns {Promise<string>} Personalized content
 */
const personalizeContent = async (content, customer, journeyStage) => {
  try {
    // Basic variable replacement
    let personalizedContent = content
      .replace(/\{\{firstName\}\}/g, customer.firstName || 'there')
      .replace(/\{\{lastName\}\}/g, customer.lastName || '')
      .replace(/\{\{email\}\}/g, customer.email || '')
      .replace(/\{\{company\}\}/g, customer.company || 'your company');
    
    // Advanced personalization based on journey stage
    if (journeyStage === JOURNEY_STAGES.AWARENESS) {
      personalizedContent = personalizedContent
        .replace(/\{\{stageContent\}\}/g, 'Learn more about how our solution can help you.');
    } else if (journeyStage === JOURNEY_STAGES.CONSIDERATION) {
      personalizedContent = personalizedContent
        .replace(/\{\{stageContent\}\}/g, 'Compare our features to see which option is right for you.');
    } else if (journeyStage === JOURNEY_STAGES.DECISION) {
      personalizedContent = personalizedContent
        .replace(/\{\{stageContent\}\}/g, 'Take advantage of this limited-time offer.');
    } else if (journeyStage === JOURNEY_STAGES.RETENTION) {
      personalizedContent = personalizedContent
        .replace(/\{\{stageContent\}\}/g, 'Here are some tips to get the most out of your purchase.');
    } else if (journeyStage === JOURNEY_STAGES.ADVOCACY) {
      personalizedContent = personalizedContent
        .replace(/\{\{stageContent\}\}/g, 'Share your experience with friends and earn rewards.');
    }
    
    // Replace any remaining template variables
    personalizedContent = personalizedContent
      .replace(/\{\{[^}]+\}\}/g, '');
    
    return personalizedContent;
  } catch (error) {
    console.error('Error personalizing content:', error);
    return content; // Return original content if personalization fails
  }
};

/**
 * Generate journey insights for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Journey insights
 */
const generateJourneyInsights = async (customerId) => {
  try {
    // Get customer journey data
    const journeyDoc = await db.collection('customerJourneys').doc(customerId).get();
    
    if (!journeyDoc.exists) {
      throw new Error(`Journey data for customer ${customerId} not found`);
    }
    
    const journeyData = journeyDoc.data();
    
    // Get journey history
    const journeyHistoryQuery = await db.collection('customerJourneyHistory')
      .where('customerId', '==', customerId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    const journeyHistory = [];
    journeyHistoryQuery.forEach(doc => {
      journeyHistory.push(doc.data());
    });
    
    // Get action executions
    const actionExecutionsQuery = await db.collection('journeyActionExecutions')
      .where('customerId', '==', customerId)
      .orderBy('executedAt', 'desc')
      .limit(20)
      .get();
    
    const actionExecutions = [];
    actionExecutionsQuery.forEach(doc => {
      actionExecutions.push(doc.data());
    });
    
    // Generate insights using AI
    const prompt = `
      As a customer journey analyst, provide insights for this customer journey:
      
      Current Journey Stage: ${journeyData.currentStage}
      Stage Confidence: ${journeyData.confidence}
      
      Journey History:
      ${journeyHistory.map(h => `- ${new Date(h.timestamp).toISOString().split('T')[0]}: ${h.currentStage} (confidence: ${h.confidence})`).join('\n')}
      
      Recent Actions:
      ${actionExecutions.map(a => `- ${new Date(a.executedAt).toISOString().split('T')[0]}: ${a.action.recommendedAction} (${a.result.success ? 'Success' : 'Failed'})`).join('\n')}
      
      Provide insights on:
      1. Journey progression pattern and velocity
      2. Effectiveness of actions taken
      3. Recommendations for improving journey progression
      4. Predicted future journey path
      
      Format your response as JSON with sections for each insight category.
    `;
    
    // Get insights from AI
    const insightsResponse = await openai.generateContent(prompt, {
      max_tokens: 1000,
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    // Parse insights
    let insights;
    try {
      insights = JSON.parse(insightsResponse);
    } catch (e) {
      console.error('Error parsing journey insights:', e);
      // Default insights if parsing fails
      insights = {
        journeyProgression: {
          pattern: "Unable to analyze pattern",
          velocity: "Unknown",
          analysis: "Error generating insights"
        },
        actionEffectiveness: {
          analysis: "Error generating insights",
          successRate: "Unknown"
        },
        recommendations: [
          "Review customer journey data manually"
        ],
        predictedPath: {
          nextStage: journeyData.currentStage,
          confidence: "Low",
          timeframe: "Unknown"
        }
      };
    }
    
    // Store insights in Firestore
    await db.collection('customerJourneyInsights').add({
      customerId,
      insights,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      customerId,
      currentStage: journeyData.currentStage,
      insights
    };
  } catch (error) {
    console.error('Error generating journey insights:', error);
    throw new Error('Failed to generate journey insights');
  }
};

/**
 * Batch process customer journeys
 * @param {number} [batchSize=50] - Number of customers to process
 * @returns {Promise<Object>} Processing results
 */
const batchProcessCustomerJourneys = async (batchSize = 50) => {
  try {
    // Get customers to process
    const customersQuery = await db.collection('customers')
      .where('status', '==', 'active')
      .limit(batchSize)
      .get();
    
    if (customersQuery.empty) {
      return {
        success: true,
        customersProcessed: 0,
        message: 'No customers to process'
      };
    }
    
    const processingPromises = [];
    const customerIds = [];
    
    customersQuery.forEach(doc => {
      const customerId = doc.id;
      customerIds.push(customerId);
      
      // Process each customer's journey
      const promise = orchestrateCustomerJourney(customerId)
        .catch(error => {
          console.error(`Error processing journey for customer ${customerId}:`, error);
          return {
            customerId,
            error: error.message
          };
        });
      
      processingPromises.push(promise);
    });
    
    // Wait for all processing to complete
    const results = await Promise.all(processingPromises);
    
    // Count successes and failures
    const successes = results.filter(r => !r.error).length;
    const failures = results.filter(r => r.error).length;
    
    return {
      success: true,
      customersProcessed: customerIds.length,
      successfulJourneys: successes,
      failedJourneys: failures,
      customerIds
    };
  } catch (error) {
    console.error('Error batch processing customer journeys:', error);
    throw new Error('Failed to batch process customer journeys');
  }
};

module.exports = {
  // Journey stage analysis
  JOURNEY_STAGES,
  TRANSITION_TYPES,
  INTERACTION_TYPES,
  analyzeCurrentJourneyStage,
  
  // Prediction and detection
  predictNextBestActions,
  detectJourneyTransitions,
  
  // Journey orchestration
  orchestrateCustomerJourney,
  executeJourneyActions,
  
  // Insights and batch processing
  generateJourneyInsights,
  batchProcessCustomerJourneys
};
