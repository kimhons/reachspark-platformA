/**
 * Revenue Attribution AI
 * 
 * This module implements the Revenue Attribution AI feature,
 * which helps marketers understand the true impact of their campaigns
 * across multiple touchpoints and channels.
 * 
 * The system uses advanced machine learning to analyze customer journeys,
 * attribute revenue to marketing activities, and provide insights for
 * optimizing marketing spend and strategy.
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
 * Attribution models
 */
const ATTRIBUTION_MODELS = {
  FIRST_TOUCH: 'first_touch',
  LAST_TOUCH: 'last_touch',
  LINEAR: 'linear',
  TIME_DECAY: 'time_decay',
  POSITION_BASED: 'position_based',
  ALGORITHMIC: 'algorithmic',
  CUSTOM: 'custom'
};

/**
 * Channel types
 */
const CHANNEL_TYPES = {
  ORGANIC_SEARCH: 'organic_search',
  PAID_SEARCH: 'paid_search',
  SOCIAL_ORGANIC: 'social_organic',
  SOCIAL_PAID: 'social_paid',
  EMAIL: 'email',
  DIRECT: 'direct',
  REFERRAL: 'referral',
  DISPLAY: 'display',
  AFFILIATE: 'affiliate',
  VIDEO: 'video',
  CONTENT: 'content',
  INFLUENCER: 'influencer',
  OFFLINE: 'offline'
};

/**
 * Conversion types
 */
const CONVERSION_TYPES = {
  PURCHASE: 'purchase',
  SUBSCRIPTION: 'subscription',
  LEAD: 'lead',
  SIGNUP: 'signup',
  DOWNLOAD: 'download',
  DEMO_REQUEST: 'demo_request',
  CONTACT_FORM: 'contact_form',
  CUSTOM: 'custom'
};

/**
 * Track customer touchpoint
 * @param {Object} touchpointData - Touchpoint data
 * @returns {Promise<Object>} Tracked touchpoint
 */
const trackTouchpoint = async (touchpointData) => {
  try {
    // Validate required fields
    if (!touchpointData.userId || !touchpointData.customerId || !touchpointData.channelType) {
      throw new Error('Missing required touchpoint fields');
    }
    
    // Create touchpoint
    const touchpoint = {
      ...touchpointData,
      timestamp: touchpointData.timestamp || admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to database
    const touchpointRef = await db.collection('customerTouchpoints').add(touchpoint);
    
    // Update customer journey
    await updateCustomerJourney(touchpointData.customerId, {
      touchpointId: touchpointRef.id,
      ...touchpoint
    });
    
    return {
      id: touchpointRef.id,
      ...touchpoint
    };
  } catch (error) {
    console.error('Error tracking touchpoint:', error);
    throw new Error('Failed to track touchpoint');
  }
};

/**
 * Update customer journey with new touchpoint
 * @param {string} customerId - Customer ID
 * @param {Object} touchpoint - Touchpoint data
 * @returns {Promise<Object>} Updated journey
 */
const updateCustomerJourney = async (customerId, touchpoint) => {
  try {
    // Get customer journey
    const journeyRef = db.collection('customerJourneys').doc(customerId);
    const journeyDoc = await journeyRef.get();
    
    if (!journeyDoc.exists) {
      // Create new journey if it doesn't exist
      await journeyRef.set({
        customerId,
        touchpoints: [touchpoint],
        conversions: [],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        customerId,
        touchpoints: [touchpoint],
        conversions: []
      };
    }
    
    // Update existing journey
    const journey = journeyDoc.data();
    
    await journeyRef.update({
      touchpoints: admin.firestore.FieldValue.arrayUnion(touchpoint),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      customerId,
      touchpoints: [...journey.touchpoints, touchpoint],
      conversions: journey.conversions || []
    };
  } catch (error) {
    console.error('Error updating customer journey:', error);
    throw new Error('Failed to update customer journey');
  }
};

/**
 * Track conversion
 * @param {Object} conversionData - Conversion data
 * @returns {Promise<Object>} Tracked conversion with attribution
 */
const trackConversion = async (conversionData) => {
  try {
    // Validate required fields
    if (!conversionData.userId || !conversionData.customerId || !conversionData.conversionType) {
      throw new Error('Missing required conversion fields');
    }
    
    // Create conversion
    const conversion = {
      ...conversionData,
      timestamp: conversionData.timestamp || admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to database
    const conversionRef = await db.collection('customerConversions').add(conversion);
    
    // Update customer journey
    await updateCustomerJourneyWithConversion(conversionData.customerId, {
      conversionId: conversionRef.id,
      ...conversion
    });
    
    // Perform attribution
    const attribution = await attributeConversion(conversionRef.id);
    
    return {
      id: conversionRef.id,
      ...conversion,
      attribution
    };
  } catch (error) {
    console.error('Error tracking conversion:', error);
    throw new Error('Failed to track conversion');
  }
};

/**
 * Update customer journey with new conversion
 * @param {string} customerId - Customer ID
 * @param {Object} conversion - Conversion data
 * @returns {Promise<Object>} Updated journey
 */
const updateCustomerJourneyWithConversion = async (customerId, conversion) => {
  try {
    // Get customer journey
    const journeyRef = db.collection('customerJourneys').doc(customerId);
    const journeyDoc = await journeyRef.get();
    
    if (!journeyDoc.exists) {
      // Create new journey if it doesn't exist
      await journeyRef.set({
        customerId,
        touchpoints: [],
        conversions: [conversion],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        customerId,
        touchpoints: [],
        conversions: [conversion]
      };
    }
    
    // Update existing journey
    const journey = journeyDoc.data();
    
    await journeyRef.update({
      conversions: admin.firestore.FieldValue.arrayUnion(conversion),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      customerId,
      touchpoints: journey.touchpoints || [],
      conversions: [...journey.conversions, conversion]
    };
  } catch (error) {
    console.error('Error updating customer journey with conversion:', error);
    throw new Error('Failed to update customer journey with conversion');
  }
};

/**
 * Attribute conversion to touchpoints
 * @param {string} conversionId - Conversion ID
 * @param {string} [model=ATTRIBUTION_MODELS.ALGORITHMIC] - Attribution model
 * @returns {Promise<Object>} Attribution results
 */
const attributeConversion = async (conversionId, model = ATTRIBUTION_MODELS.ALGORITHMIC) => {
  try {
    // Get conversion
    const conversionDoc = await db.collection('customerConversions').doc(conversionId).get();
    
    if (!conversionDoc.exists) {
      throw new Error(`Conversion with ID ${conversionId} not found`);
    }
    
    const conversion = conversionDoc.data();
    
    // Get customer journey
    const journeyDoc = await db.collection('customerJourneys').doc(conversion.customerId).get();
    
    if (!journeyDoc.exists) {
      throw new Error(`Customer journey for customer ID ${conversion.customerId} not found`);
    }
    
    const journey = journeyDoc.data();
    
    // Get touchpoints before conversion
    const touchpointsBeforeConversion = journey.touchpoints.filter(touchpoint => {
      const touchpointTime = touchpoint.timestamp instanceof admin.firestore.Timestamp
        ? touchpoint.timestamp.toDate()
        : new Date(touchpoint.timestamp);
      
      const conversionTime = conversion.timestamp instanceof admin.firestore.Timestamp
        ? conversion.timestamp.toDate()
        : new Date(conversion.timestamp);
      
      return touchpointTime < conversionTime;
    });
    
    if (touchpointsBeforeConversion.length === 0) {
      return {
        conversionId,
        model,
        touchpoints: [],
        status: 'no_touchpoints',
        message: 'No touchpoints found before conversion'
      };
    }
    
    // Sort touchpoints by timestamp
    touchpointsBeforeConversion.sort((a, b) => {
      const aTime = a.timestamp instanceof admin.firestore.Timestamp
        ? a.timestamp.toDate()
        : new Date(a.timestamp);
      
      const bTime = b.timestamp instanceof admin.firestore.Timestamp
        ? b.timestamp.toDate()
        : new Date(b.timestamp);
      
      return aTime - bTime;
    });
    
    // Apply attribution model
    let attributedTouchpoints;
    
    switch (model) {
      case ATTRIBUTION_MODELS.FIRST_TOUCH:
        attributedTouchpoints = attributeFirstTouch(touchpointsBeforeConversion, conversion);
        break;
      
      case ATTRIBUTION_MODELS.LAST_TOUCH:
        attributedTouchpoints = attributeLastTouch(touchpointsBeforeConversion, conversion);
        break;
      
      case ATTRIBUTION_MODELS.LINEAR:
        attributedTouchpoints = attributeLinear(touchpointsBeforeConversion, conversion);
        break;
      
      case ATTRIBUTION_MODELS.TIME_DECAY:
        attributedTouchpoints = attributeTimeDecay(touchpointsBeforeConversion, conversion);
        break;
      
      case ATTRIBUTION_MODELS.POSITION_BASED:
        attributedTouchpoints = attributePositionBased(touchpointsBeforeConversion, conversion);
        break;
      
      case ATTRIBUTION_MODELS.ALGORITHMIC:
        attributedTouchpoints = await attributeAlgorithmic(touchpointsBeforeConversion, conversion);
        break;
      
      default:
        attributedTouchpoints = attributeLinear(touchpointsBeforeConversion, conversion);
    }
    
    // Create attribution record
    const attribution = {
      conversionId,
      customerId: conversion.customerId,
      conversionType: conversion.conversionType,
      conversionValue: conversion.value || 0,
      model,
      touchpoints: attributedTouchpoints,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save attribution
    await db.collection('conversionAttributions').doc(conversionId).set(attribution);
    
    // Update conversion with attribution
    await db.collection('customerConversions').doc(conversionId).update({
      attribution: {
        model,
        touchpoints: attributedTouchpoints
      }
    });
    
    return attribution;
  } catch (error) {
    console.error('Error attributing conversion:', error);
    throw new Error('Failed to attribute conversion');
  }
};

/**
 * First-touch attribution model
 * @param {Array} touchpoints - Touchpoints
 * @param {Object} conversion - Conversion
 * @returns {Array} Attributed touchpoints
 */
const attributeFirstTouch = (touchpoints, conversion) => {
  if (touchpoints.length === 0) {
    return [];
  }
  
  // Give 100% credit to first touchpoint
  return touchpoints.map((touchpoint, index) => ({
    touchpointId: touchpoint.touchpointId,
    channelType: touchpoint.channelType,
    timestamp: touchpoint.timestamp,
    attributionCredit: index === 0 ? 1 : 0,
    attributionValue: index === 0 ? (conversion.value || 0) : 0
  }));
};

/**
 * Last-touch attribution model
 * @param {Array} touchpoints - Touchpoints
 * @param {Object} conversion - Conversion
 * @returns {Array} Attributed touchpoints
 */
const attributeLastTouch = (touchpoints, conversion) => {
  if (touchpoints.length === 0) {
    return [];
  }
  
  // Give 100% credit to last touchpoint
  const lastIndex = touchpoints.length - 1;
  
  return touchpoints.map((touchpoint, index) => ({
    touchpointId: touchpoint.touchpointId,
    channelType: touchpoint.channelType,
    timestamp: touchpoint.timestamp,
    attributionCredit: index === lastIndex ? 1 : 0,
    attributionValue: index === lastIndex ? (conversion.value || 0) : 0
  }));
};

/**
 * Linear attribution model
 * @param {Array} touchpoints - Touchpoints
 * @param {Object} conversion - Conversion
 * @returns {Array} Attributed touchpoints
 */
const attributeLinear = (touchpoints, conversion) => {
  if (touchpoints.length === 0) {
    return [];
  }
  
  // Give equal credit to all touchpoints
  const creditPerTouchpoint = 1 / touchpoints.length;
  const valuePerTouchpoint = (conversion.value || 0) / touchpoints.length;
  
  return touchpoints.map(touchpoint => ({
    touchpointId: touchpoint.touchpointId,
    channelType: touchpoint.channelType,
    timestamp: touchpoint.timestamp,
    attributionCredit: creditPerTouchpoint,
    attributionValue: valuePerTouchpoint
  }));
};

/**
 * Time-decay attribution model
 * @param {Array} touchpoints - Touchpoints
 * @param {Object} conversion - Conversion
 * @returns {Array} Attributed touchpoints
 */
const attributeTimeDecay = (touchpoints, conversion) => {
  if (touchpoints.length === 0) {
    return [];
  }
  
  // Calculate time-based weights
  const conversionTime = conversion.timestamp instanceof admin.firestore.Timestamp
    ? conversion.timestamp.toDate()
    : new Date(conversion.timestamp);
  
  const halfLifeDays = 7; // 7-day half-life
  const weights = touchpoints.map(touchpoint => {
    const touchpointTime = touchpoint.timestamp instanceof admin.firestore.Timestamp
      ? touchpoint.timestamp.toDate()
      : new Date(touchpoint.timestamp);
    
    const daysBeforeConversion = (conversionTime - touchpointTime) / (1000 * 60 * 60 * 24);
    return Math.pow(0.5, daysBeforeConversion / halfLifeDays);
  });
  
  // Normalize weights
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  return touchpoints.map((touchpoint, index) => {
    const normalizedWeight = weights[index] / totalWeight;
    
    return {
      touchpointId: touchpoint.touchpointId,
      channelType: touchpoint.channelType,
      timestamp: touchpoint.timestamp,
      attributionCredit: normalizedWeight,
      attributionValue: normalizedWeight * (conversion.value || 0)
    };
  });
};

/**
 * Position-based attribution model
 * @param {Array} touchpoints - Touchpoints
 * @param {Object} conversion - Conversion
 * @returns {Array} Attributed touchpoints
 */
const attributePositionBased = (touchpoints, conversion) => {
  if (touchpoints.length === 0) {
    return [];
  }
  
  if (touchpoints.length === 1) {
    return [{
      touchpointId: touchpoints[0].touchpointId,
      channelType: touchpoints[0].channelType,
      timestamp: touchpoints[0].timestamp,
      attributionCredit: 1,
      attributionValue: conversion.value || 0
    }];
  }
  
  // Give 40% credit to first touchpoint, 40% to last touchpoint, 20% distributed among middle touchpoints
  const firstIndex = 0;
  const lastIndex = touchpoints.length - 1;
  
  let middleTouchpointsCredit = 0;
  let middleTouchpointsValue = 0;
  
  if (touchpoints.length > 2) {
    middleTouchpointsCredit = 0.2 / (touchpoints.length - 2);
    middleTouchpointsValue = 0.2 * (conversion.value || 0) / (touchpoints.length - 2);
  }
  
  return touchpoints.map((touchpoint, index) => {
    let credit = middleTouchpointsCredit;
    let value = middleTouchpointsValue;
    
    if (index === firstIndex) {
      credit = 0.4;
      value = 0.4 * (conversion.value || 0);
    } else if (index === lastIndex) {
      credit = 0.4;
      value = 0.4 * (conversion.value || 0);
    }
    
    return {
      touchpointId: touchpoint.touchpointId,
      channelType: touchpoint.channelType,
      timestamp: touchpoint.timestamp,
      attributionCredit: credit,
      attributionValue: value
    };
  });
};

/**
 * Algorithmic attribution model
 * @param {Array} touchpoints - Touchpoints
 * @param {Object} conversion - Conversion
 * @returns {Promise<Array>} Attributed touchpoints
 */
const attributeAlgorithmic = async (touchpoints, conversion) => {
  try {
    // For algorithmic attribution, we need historical data
    // Get customer's previous conversions
    const previousConversionsQuery = await db.collection('customerConversions')
      .where('customerId', '==', conversion.customerId)
      .where('timestamp', '<', conversion.timestamp)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    
    const previousConversions = [];
    previousConversionsQuery.forEach(doc => {
      previousConversions.push(doc.data());
    });
    
    // Get similar customers' conversions
    const similarConversionsQuery = await db.collection('customerConversions')
      .where('conversionType', '==', conversion.conversionType)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    const similarConversions = [];
    similarConversionsQuery.forEach(doc => {
      if (doc.id !== conversion.conversionId) {
        similarConversions.push(doc.data());
      }
    });
    
    // Get attribution data for similar conversions
    const attributionPromises = similarConversions.map(conv => 
      db.collection('conversionAttributions').doc(conv.conversionId).get()
    );
    
    const attributionDocs = await Promise.all(attributionPromises);
    
    const similarAttributions = [];
    attributionDocs.forEach(doc => {
      if (doc.exists) {
        similarAttributions.push(doc.data());
      }
    });
    
    // If we have enough data, use machine learning to determine weights
    if (similarAttributions.length >= 5) {
      return await calculateMachineLearningAttribution(
        touchpoints,
        conversion,
        previousConversions,
        similarAttributions
      );
    }
    
    // If not enough data, use a hybrid model
    // 30% first touch, 30% last touch, 40% linear
    const firstTouchAttribution = attributeFirstTouch(touchpoints, conversion);
    const lastTouchAttribution = attributeLastTouch(touchpoints, conversion);
    const linearAttribution = attributeLinear(touchpoints, conversion);
    
    return touchpoints.map((touchpoint, index) => {
      const firstTouchCredit = firstTouchAttribution[index].attributionCredit * 0.3;
      const lastTouchCredit = lastTouchAttribution[index].attributionCredit * 0.3;
      const linearCredit = linearAttribution[index].attributionCredit * 0.4;
      
      const totalCredit = firstTouchCredit + lastTouchCredit + linearCredit;
      
      return {
        touchpointId: touchpoint.touchpointId,
        channelType: touchpoint.channelType,
        timestamp: touchpoint.timestamp,
        attributionCredit: totalCredit,
        attributionValue: totalCredit * (conversion.value || 0)
      };
    });
  } catch (error) {
    console.error('Error in algorithmic attribution:', error);
    // Fallback to linear attribution
    return attributeLinear(touchpoints, conversion);
  }
};

/**
 * Calculate machine learning attribution
 * @param {Array} touchpoints - Touchpoints
 * @param {Object} conversion - Conversion
 * @param {Array} previousConversions - Previous conversions
 * @param {Array} similarAttributions - Similar attributions
 * @returns {Promise<Array>} Attributed touchpoints
 */
const calculateMachineLearningAttribution = async (
  touchpoints,
  conversion,
  previousConversions,
  similarAttributions
) => {
  try {
    // Prepare data for AI analysis
    const channelTypes = touchpoints.map(t => t.channelType);
    const uniqueChannels = [...new Set(channelTypes)];
    
    // Calculate channel frequency in touchpoints
    const channelFrequency = {};
    channelTypes.forEach(channel => {
      channelFrequency[channel] = (channelFrequency[channel] || 0) + 1;
    });
    
    // Calculate channel importance from similar attributions
    const channelImportance = {};
    
    similarAttributions.forEach(attribution => {
      attribution.touchpoints.forEach(t => {
        if (!channelImportance[t.channelType]) {
          channelImportance[t.channelType] = {
            totalCredit: 0,
            count: 0
          };
        }
        
        channelImportance[t.channelType].totalCredit += t.attributionCredit;
        channelImportance[t.channelType].count += 1;
      });
    });
    
    // Calculate average importance
    Object.keys(channelImportance).forEach(channel => {
      channelImportance[channel].averageCredit = 
        channelImportance[channel].totalCredit / channelImportance[channel].count;
    });
    
    // Prepare touchpoint sequence
    const touchpointSequence = touchpoints.map(t => ({
      channelType: t.channelType,
      daysBeforeConversion: calculateDaysDifference(t.timestamp, conversion.timestamp)
    }));
    
    // Prepare prompt for AI
    const prompt = `
      As a marketing attribution expert, analyze this customer journey and determine the attribution weights for each touchpoint:
      
      Conversion Type: ${conversion.conversionType}
      Conversion Value: ${conversion.value || 0}
      
      Touchpoint Sequence: ${JSON.stringify(touchpointSequence)}
      
      Channel Frequency: ${JSON.stringify(channelFrequency)}
      
      Channel Importance from Similar Conversions: ${JSON.stringify(channelImportance)}
      
      Previous Conversions by this Customer: ${previousConversions.length}
      
      Determine the attribution credit for each touchpoint in the sequence.
      The sum of all attribution credits must equal exactly 1.
      
      Format your response as a JSON array of attribution credits in the same order as the touchpoint sequence.
      For example: [0.2, 0.3, 0.5] for a 3-touchpoint sequence.
    `;
    
    // Get attribution weights from AI
    const attributionResponse = await openai.generateContent(prompt, {
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse attribution weights
    let attributionWeights;
    try {
      const parsedResponse = JSON.parse(attributionResponse);
      
      // Handle different response formats
      if (Array.isArray(parsedResponse)) {
        attributionWeights = parsedResponse;
      } else if (parsedResponse.weights && Array.isArray(parsedResponse.weights)) {
        attributionWeights = parsedResponse.weights;
      } else if (parsedResponse.attribution && Array.isArray(parsedResponse.attribution)) {
        attributionWeights = parsedResponse.attribution;
      } else if (parsedResponse.credits && Array.isArray(parsedResponse.credits)) {
        attributionWeights = parsedResponse.credits;
      } else {
        // Try to find any array in the response
        for (const key in parsedResponse) {
          if (Array.isArray(parsedResponse[key])) {
            attributionWeights = parsedResponse[key];
            break;
          }
        }
      }
      
      // Validate weights
      if (!attributionWeights || attributionWeights.length !== touchpoints.length) {
        throw new Error('Invalid attribution weights');
      }
      
      // Normalize weights to ensure they sum to 1
      const totalWeight = attributionWeights.reduce((sum, weight) => sum + weight, 0);
      
      if (totalWeight === 0) {
        throw new Error('Attribution weights sum to zero');
      }
      
      attributionWeights = attributionWeights.map(weight => weight / totalWeight);
    } catch (e) {
      console.error('Error parsing attribution weights:', e);
      // Fallback to linear attribution
      attributionWeights = touchpoints.map(() => 1 / touchpoints.length);
    }
    
    // Apply weights to touchpoints
    return touchpoints.map((touchpoint, index) => ({
      touchpointId: touchpoint.touchpointId,
      channelType: touchpoint.channelType,
      timestamp: touchpoint.timestamp,
      attributionCredit: attributionWeights[index],
      attributionValue: attributionWeights[index] * (conversion.value || 0)
    }));
  } catch (error) {
    console.error('Error in machine learning attribution:', error);
    // Fallback to linear attribution
    return attributeLinear(touchpoints, conversion);
  }
};

/**
 * Calculate days difference between two timestamps
 * @param {any} timestamp1 - First timestamp
 * @param {any} timestamp2 - Second timestamp
 * @returns {number} Days difference
 */
const calculateDaysDifference = (timestamp1, timestamp2) => {
  const date1 = timestamp1 instanceof admin.firestore.Timestamp
    ? timestamp1.toDate()
    : new Date(timestamp1);
  
  const date2 = timestamp2 instanceof admin.firestore.Timestamp
    ? timestamp2.toDate()
    : new Date(timestamp2);
  
  return Math.abs(date2 - date1) / (1000 * 60 * 60 * 24);
};

/**
 * Generate attribution report
 * @param {string} userId - User ID
 * @param {Object} reportParams - Report parameters
 * @returns {Promise<Object>} Attribution report
 */
const generateAttributionReport = async (userId, reportParams) => {
  try {
    // Validate required fields
    if (!reportParams.startDate || !reportParams.endDate) {
      throw new Error('Missing required report parameters');
    }
    
    // Parse dates
    const startDate = new Date(reportParams.startDate);
    const endDate = new Date(reportParams.endDate);
    
    // Build query
    let query = db.collection('customerConversions')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate);
    
    // Apply conversion type filter if provided
    if (reportParams.conversionType) {
      query = query.where('conversionType', '==', reportParams.conversionType);
    }
    
    // Get conversions
    const conversionsQuery = await query.get();
    
    if (conversionsQuery.empty) {
      return {
        userId,
        startDate: reportParams.startDate,
        endDate: reportParams.endDate,
        status: 'no_conversions',
        message: 'No conversions found for the specified period'
      };
    }
    
    // Process conversions
    const conversions = [];
    const conversionIds = [];
    
    conversionsQuery.forEach(doc => {
      conversions.push({
        id: doc.id,
        ...doc.data()
      });
      
      conversionIds.push(doc.id);
    });
    
    // Get attributions
    const attributionPromises = conversionIds.map(id => 
      db.collection('conversionAttributions').doc(id).get()
    );
    
    const attributionDocs = await Promise.all(attributionPromises);
    
    const attributions = [];
    attributionDocs.forEach(doc => {
      if (doc.exists) {
        attributions.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    
    // Calculate channel attribution
    const channelAttribution = calculateChannelAttribution(attributions);
    
    // Calculate conversion metrics
    const conversionMetrics = calculateConversionMetrics(conversions);
    
    // Calculate touchpoint effectiveness
    const touchpointEffectiveness = calculateTouchpointEffectiveness(attributions);
    
    // Calculate multi-touch insights
    const multiTouchInsights = calculateMultiTouchInsights(attributions);
    
    // Generate AI insights
    const aiInsights = await generateAIInsights(
      channelAttribution,
      conversionMetrics,
      touchpointEffectiveness,
      multiTouchInsights
    );
    
    // Create report
    const report = {
      userId,
      startDate: reportParams.startDate,
      endDate: reportParams.endDate,
      conversionType: reportParams.conversionType,
      totalConversions: conversions.length,
      totalValue: conversions.reduce((sum, conv) => sum + (conv.value || 0), 0),
      channelAttribution,
      conversionMetrics,
      touchpointEffectiveness,
      multiTouchInsights,
      aiInsights,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save report
    const reportRef = await db.collection('attributionReports').add(report);
    
    return {
      id: reportRef.id,
      ...report
    };
  } catch (error) {
    console.error('Error generating attribution report:', error);
    throw new Error('Failed to generate attribution report');
  }
};

/**
 * Calculate channel attribution
 * @param {Array} attributions - Attributions
 * @returns {Object} Channel attribution
 */
const calculateChannelAttribution = (attributions) => {
  const channelAttribution = {};
  
  // Initialize channel attribution
  Object.values(CHANNEL_TYPES).forEach(channel => {
    channelAttribution[channel] = {
      totalCredit: 0,
      totalValue: 0,
      conversionCount: 0,
      touchpointCount: 0
    };
  });
  
  // Process attributions
  attributions.forEach(attribution => {
    const touchpoints = attribution.touchpoints || [];
    
    // Track unique channels in this conversion
    const channelsInConversion = new Set();
    
    touchpoints.forEach(touchpoint => {
      const channel = touchpoint.channelType;
      
      if (!channelAttribution[channel]) {
        channelAttribution[channel] = {
          totalCredit: 0,
          totalValue: 0,
          conversionCount: 0,
          touchpointCount: 0
        };
      }
      
      channelAttribution[channel].totalCredit += touchpoint.attributionCredit;
      channelAttribution[channel].totalValue += touchpoint.attributionValue;
      channelAttribution[channel].touchpointCount += 1;
      
      channelsInConversion.add(channel);
    });
    
    // Increment conversion count for each channel in this conversion
    channelsInConversion.forEach(channel => {
      channelAttribution[channel].conversionCount += 1;
    });
  });
  
  // Calculate percentages
  const totalValue = Object.values(channelAttribution).reduce(
    (sum, channel) => sum + channel.totalValue, 0
  );
  
  Object.keys(channelAttribution).forEach(channel => {
    channelAttribution[channel].valuePercentage = 
      totalValue > 0 ? channelAttribution[channel].totalValue / totalValue : 0;
  });
  
  return channelAttribution;
};

/**
 * Calculate conversion metrics
 * @param {Array} conversions - Conversions
 * @returns {Object} Conversion metrics
 */
const calculateConversionMetrics = (conversions) => {
  // Group conversions by type
  const conversionsByType = {};
  
  conversions.forEach(conversion => {
    const type = conversion.conversionType;
    
    if (!conversionsByType[type]) {
      conversionsByType[type] = {
        count: 0,
        totalValue: 0
      };
    }
    
    conversionsByType[type].count += 1;
    conversionsByType[type].totalValue += conversion.value || 0;
  });
  
  // Calculate average value
  Object.keys(conversionsByType).forEach(type => {
    conversionsByType[type].averageValue = 
      conversionsByType[type].count > 0
        ? conversionsByType[type].totalValue / conversionsByType[type].count
        : 0;
  });
  
  return {
    byType: conversionsByType,
    total: {
      count: conversions.length,
      totalValue: conversions.reduce((sum, conv) => sum + (conv.value || 0), 0),
      averageValue: conversions.length > 0
        ? conversions.reduce((sum, conv) => sum + (conv.value || 0), 0) / conversions.length
        : 0
    }
  };
};

/**
 * Calculate touchpoint effectiveness
 * @param {Array} attributions - Attributions
 * @returns {Object} Touchpoint effectiveness
 */
const calculateTouchpointEffectiveness = (attributions) => {
  // Calculate effectiveness by position
  const byPosition = {
    first: { totalCredit: 0, count: 0 },
    middle: { totalCredit: 0, count: 0 },
    last: { totalCredit: 0, count: 0 }
  };
  
  // Calculate effectiveness by channel
  const byChannel = {};
  
  // Calculate effectiveness by time to conversion
  const byTimeToConversion = {
    sameDay: { totalCredit: 0, count: 0 },
    within7Days: { totalCredit: 0, count: 0 },
    within30Days: { totalCredit: 0, count: 0 },
    moreThan30Days: { totalCredit: 0, count: 0 }
  };
  
  // Process attributions
  attributions.forEach(attribution => {
    const touchpoints = attribution.touchpoints || [];
    
    if (touchpoints.length === 0) {
      return;
    }
    
    // Process by position
    touchpoints.forEach((touchpoint, index) => {
      const channel = touchpoint.channelType;
      
      // Initialize channel if not exists
      if (!byChannel[channel]) {
        byChannel[channel] = {
          totalCredit: 0,
          count: 0,
          averageCredit: 0
        };
      }
      
      // Update channel stats
      byChannel[channel].totalCredit += touchpoint.attributionCredit;
      byChannel[channel].count += 1;
      
      // Update position stats
      if (index === 0) {
        byPosition.first.totalCredit += touchpoint.attributionCredit;
        byPosition.first.count += 1;
      } else if (index === touchpoints.length - 1) {
        byPosition.last.totalCredit += touchpoint.attributionCredit;
        byPosition.last.count += 1;
      } else {
        byPosition.middle.totalCredit += touchpoint.attributionCredit;
        byPosition.middle.count += 1;
      }
      
      // Calculate time to conversion
      const touchpointTime = touchpoint.timestamp instanceof admin.firestore.Timestamp
        ? touchpoint.timestamp.toDate()
        : new Date(touchpoint.timestamp);
      
      const conversionTime = attribution.createdAt instanceof admin.firestore.Timestamp
        ? attribution.createdAt.toDate()
        : new Date(attribution.createdAt);
      
      const daysToConversion = (conversionTime - touchpointTime) / (1000 * 60 * 60 * 24);
      
      // Update time to conversion stats
      if (daysToConversion < 1) {
        byTimeToConversion.sameDay.totalCredit += touchpoint.attributionCredit;
        byTimeToConversion.sameDay.count += 1;
      } else if (daysToConversion <= 7) {
        byTimeToConversion.within7Days.totalCredit += touchpoint.attributionCredit;
        byTimeToConversion.within7Days.count += 1;
      } else if (daysToConversion <= 30) {
        byTimeToConversion.within30Days.totalCredit += touchpoint.attributionCredit;
        byTimeToConversion.within30Days.count += 1;
      } else {
        byTimeToConversion.moreThan30Days.totalCredit += touchpoint.attributionCredit;
        byTimeToConversion.moreThan30Days.count += 1;
      }
    });
  });
  
  // Calculate averages
  Object.keys(byPosition).forEach(position => {
    byPosition[position].averageCredit = 
      byPosition[position].count > 0
        ? byPosition[position].totalCredit / byPosition[position].count
        : 0;
  });
  
  Object.keys(byChannel).forEach(channel => {
    byChannel[channel].averageCredit = 
      byChannel[channel].count > 0
        ? byChannel[channel].totalCredit / byChannel[channel].count
        : 0;
  });
  
  Object.keys(byTimeToConversion).forEach(timeRange => {
    byTimeToConversion[timeRange].averageCredit = 
      byTimeToConversion[timeRange].count > 0
        ? byTimeToConversion[timeRange].totalCredit / byTimeToConversion[timeRange].count
        : 0;
  });
  
  return {
    byPosition,
    byChannel,
    byTimeToConversion
  };
};

/**
 * Calculate multi-touch insights
 * @param {Array} attributions - Attributions
 * @returns {Object} Multi-touch insights
 */
const calculateMultiTouchInsights = (attributions) => {
  // Calculate common channel sequences
  const channelSequences = {};
  const channelPairs = {};
  
  // Process attributions
  attributions.forEach(attribution => {
    const touchpoints = attribution.touchpoints || [];
    
    if (touchpoints.length < 2) {
      return;
    }
    
    // Create channel sequence
    const sequence = touchpoints.map(t => t.channelType).join(' > ');
    
    // Update sequence count
    channelSequences[sequence] = (channelSequences[sequence] || 0) + 1;
    
    // Process channel pairs
    for (let i = 0; i < touchpoints.length - 1; i++) {
      const channel1 = touchpoints[i].channelType;
      const channel2 = touchpoints[i + 1].channelType;
      
      const pairKey = `${channel1} > ${channel2}`;
      
      channelPairs[pairKey] = (channelPairs[pairKey] || 0) + 1;
    }
  });
  
  // Get top sequences and pairs
  const topSequences = Object.entries(channelSequences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sequence, count]) => ({ sequence, count }));
  
  const topPairs = Object.entries(channelPairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pair, count]) => ({ pair, count }));
  
  // Calculate average touchpoints per conversion
  const avgTouchpoints = attributions.reduce(
    (sum, attr) => sum + (attr.touchpoints?.length || 0), 0
  ) / (attributions.length || 1);
  
  // Calculate conversion path length distribution
  const pathLengthDistribution = {};
  
  attributions.forEach(attribution => {
    const length = attribution.touchpoints?.length || 0;
    pathLengthDistribution[length] = (pathLengthDistribution[length] || 0) + 1;
  });
  
  return {
    topSequences,
    topPairs,
    avgTouchpoints,
    pathLengthDistribution
  };
};

/**
 * Generate AI insights
 * @param {Object} channelAttribution - Channel attribution
 * @param {Object} conversionMetrics - Conversion metrics
 * @param {Object} touchpointEffectiveness - Touchpoint effectiveness
 * @param {Object} multiTouchInsights - Multi-touch insights
 * @returns {Promise<Object>} AI insights
 */
const generateAIInsights = async (
  channelAttribution,
  conversionMetrics,
  touchpointEffectiveness,
  multiTouchInsights
) => {
  try {
    // Prepare data for AI analysis
    const insightData = {
      channelAttribution,
      conversionMetrics,
      touchpointEffectiveness,
      multiTouchInsights
    };
    
    // Prepare prompt for AI
    const prompt = `
      As a marketing attribution expert, analyze this attribution data and provide strategic insights:
      
      Attribution Data: ${JSON.stringify(insightData)}
      
      Provide insights on:
      1. Key findings and trends
      2. Top performing channels and why
      3. Underperforming channels that need attention
      4. Optimal channel mix recommendations
      5. Budget allocation recommendations
      6. Specific action items to improve ROI
      
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
      console.error('Error parsing AI insights:', e);
      // Default insights if parsing fails
      insights = {
        keyFindings: ["Unable to generate key findings"],
        topPerformingChannels: ["Unable to identify top performing channels"],
        underperformingChannels: ["Unable to identify underperforming channels"],
        channelMixRecommendations: ["Unable to generate channel mix recommendations"],
        budgetRecommendations: ["Unable to generate budget recommendations"],
        actionItems: ["Unable to generate action items"]
      };
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return {
      keyFindings: ["Error generating insights"],
      topPerformingChannels: [],
      underperformingChannels: [],
      channelMixRecommendations: [],
      budgetRecommendations: [],
      actionItems: []
    };
  }
};

/**
 * Generate budget recommendations
 * @param {string} userId - User ID
 * @param {Object} budgetParams - Budget parameters
 * @returns {Promise<Object>} Budget recommendations
 */
const generateBudgetRecommendations = async (userId, budgetParams) => {
  try {
    // Validate required fields
    if (!budgetParams.totalBudget || !budgetParams.startDate || !budgetParams.endDate) {
      throw new Error('Missing required budget parameters');
    }
    
    // Get recent attribution report
    const reportQuery = await db.collection('attributionReports')
      .where('userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();
    
    if (reportQuery.empty) {
      return {
        userId,
        status: 'no_data',
        message: 'No attribution data available for budget recommendations'
      };
    }
    
    const report = reportQuery.docs[0].data();
    
    // Calculate optimal budget allocation based on channel attribution
    const channelAttribution = report.channelAttribution;
    const totalBudget = budgetParams.totalBudget;
    
    // Filter out channels with no attribution
    const activeChannels = Object.entries(channelAttribution)
      .filter(([_, data]) => data.totalValue > 0)
      .map(([channel, data]) => ({
        channel,
        valuePercentage: data.valuePercentage,
        conversionCount: data.conversionCount,
        touchpointCount: data.touchpointCount
      }));
    
    if (activeChannels.length === 0) {
      return {
        userId,
        status: 'no_active_channels',
        message: 'No active channels found for budget allocation'
      };
    }
    
    // Calculate initial allocation based on value percentage
    let budgetAllocation = activeChannels.reduce((allocation, channel) => {
      allocation[channel.channel] = {
        percentage: channel.valuePercentage,
        amount: channel.valuePercentage * totalBudget
      };
      return allocation;
    }, {});
    
    // Adjust allocation based on AI recommendations
    budgetAllocation = await optimizeBudgetAllocation(
      budgetAllocation,
      report,
      budgetParams
    );
    
    // Generate implementation plan
    const implementationPlan = await generateImplementationPlan(
      budgetAllocation,
      budgetParams
    );
    
    // Create recommendations
    const recommendations = {
      userId,
      totalBudget: budgetParams.totalBudget,
      startDate: budgetParams.startDate,
      endDate: budgetParams.endDate,
      budgetAllocation,
      implementationPlan,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save recommendations
    const recommendationsRef = await db.collection('budgetRecommendations').add(recommendations);
    
    return {
      id: recommendationsRef.id,
      ...recommendations
    };
  } catch (error) {
    console.error('Error generating budget recommendations:', error);
    throw new Error('Failed to generate budget recommendations');
  }
};

/**
 * Optimize budget allocation
 * @param {Object} initialAllocation - Initial budget allocation
 * @param {Object} attributionReport - Attribution report
 * @param {Object} budgetParams - Budget parameters
 * @returns {Promise<Object>} Optimized budget allocation
 */
const optimizeBudgetAllocation = async (initialAllocation, attributionReport, budgetParams) => {
  try {
    // Prepare data for AI analysis
    const allocationData = {
      initialAllocation,
      channelAttribution: attributionReport.channelAttribution,
      touchpointEffectiveness: attributionReport.touchpointEffectiveness,
      multiTouchInsights: attributionReport.multiTouchInsights,
      totalBudget: budgetParams.totalBudget,
      businessObjectives: budgetParams.businessObjectives || 'Maximize ROI',
      targetAudience: budgetParams.targetAudience || 'General audience',
      seasonality: budgetParams.seasonality || 'None'
    };
    
    // Prepare prompt for AI
    const prompt = `
      As a marketing budget optimization expert, optimize this budget allocation:
      
      Allocation Data: ${JSON.stringify(allocationData)}
      
      Optimize the budget allocation based on:
      1. Channel attribution and performance
      2. Touchpoint effectiveness
      3. Multi-touch insights
      4. Business objectives: ${budgetParams.businessObjectives || 'Maximize ROI'}
      5. Target audience: ${budgetParams.targetAudience || 'General audience'}
      6. Seasonality factors: ${budgetParams.seasonality || 'None'}
      
      Provide an optimized budget allocation that maintains or improves performance.
      The total budget must remain exactly ${budgetParams.totalBudget}.
      
      Format your response as a JSON object with channel names as keys, and objects with 'percentage' and 'amount' as values.
      For example: {"organic_search": {"percentage": 0.3, "amount": 3000}, "paid_search": {"percentage": 0.2, "amount": 2000}}
    `;
    
    // Get optimized allocation from AI
    const optimizationResponse = await openai.generateContent(prompt, {
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse optimized allocation
    let optimizedAllocation;
    try {
      optimizedAllocation = JSON.parse(optimizationResponse);
      
      // Validate allocation
      let totalPercentage = 0;
      let totalAmount = 0;
      
      Object.values(optimizedAllocation).forEach(allocation => {
        totalPercentage += allocation.percentage;
        totalAmount += allocation.amount;
      });
      
      // Ensure total is correct
      if (Math.abs(totalPercentage - 1) > 0.01 || Math.abs(totalAmount - budgetParams.totalBudget) > 1) {
        // Normalize if needed
        const normalizationFactor = budgetParams.totalBudget / totalAmount;
        
        Object.keys(optimizedAllocation).forEach(channel => {
          optimizedAllocation[channel].amount *= normalizationFactor;
          optimizedAllocation[channel].percentage = optimizedAllocation[channel].amount / budgetParams.totalBudget;
        });
      }
    } catch (e) {
      console.error('Error parsing optimized budget allocation:', e);
      // Fallback to initial allocation
      optimizedAllocation = initialAllocation;
    }
    
    return optimizedAllocation;
  } catch (error) {
    console.error('Error optimizing budget allocation:', error);
    return initialAllocation;
  }
};

/**
 * Generate implementation plan
 * @param {Object} budgetAllocation - Budget allocation
 * @param {Object} budgetParams - Budget parameters
 * @returns {Promise<Object>} Implementation plan
 */
const generateImplementationPlan = async (budgetAllocation, budgetParams) => {
  try {
    // Prepare data for AI analysis
    const planData = {
      budgetAllocation,
      totalBudget: budgetParams.totalBudget,
      startDate: budgetParams.startDate,
      endDate: budgetParams.endDate,
      businessObjectives: budgetParams.businessObjectives || 'Maximize ROI',
      targetAudience: budgetParams.targetAudience || 'General audience'
    };
    
    // Prepare prompt for AI
    const prompt = `
      As a marketing implementation expert, create a practical implementation plan for this budget allocation:
      
      Budget Data: ${JSON.stringify(planData)}
      
      Create a detailed implementation plan that includes:
      1. Timeline and key milestones
      2. Channel-specific tactics
      3. Key performance indicators (KPIs) to track
      4. Testing and optimization strategy
      5. Contingency plans
      
      Format your response as JSON with these categories.
    `;
    
    // Get implementation plan from AI
    const planResponse = await openai.generateContent(prompt, {
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse implementation plan
    let implementationPlan;
    try {
      implementationPlan = JSON.parse(planResponse);
    } catch (e) {
      console.error('Error parsing implementation plan:', e);
      // Default plan if parsing fails
      implementationPlan = {
        timeline: ["Unable to generate timeline"],
        channelTactics: {},
        kpis: ["Unable to generate KPIs"],
        testingStrategy: ["Unable to generate testing strategy"],
        contingencyPlans: ["Unable to generate contingency plans"]
      };
    }
    
    return implementationPlan;
  } catch (error) {
    console.error('Error generating implementation plan:', error);
    return {
      timeline: ["Error generating timeline"],
      channelTactics: {},
      kpis: ["Error generating KPIs"],
      testingStrategy: ["Error generating testing strategy"],
      contingencyPlans: ["Error generating contingency plans"]
    };
  }
};

/**
 * Generate ROI forecast
 * @param {string} userId - User ID
 * @param {Object} forecastParams - Forecast parameters
 * @returns {Promise<Object>} ROI forecast
 */
const generateROIForecast = async (userId, forecastParams) => {
  try {
    // Validate required fields
    if (!forecastParams.budgetAllocation || !forecastParams.startDate || !forecastParams.endDate) {
      throw new Error('Missing required forecast parameters');
    }
    
    // Get recent attribution report
    const reportQuery = await db.collection('attributionReports')
      .where('userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();
    
    if (reportQuery.empty) {
      return {
        userId,
        status: 'no_data',
        message: 'No attribution data available for ROI forecast'
      };
    }
    
    const report = reportQuery.docs[0].data();
    
    // Get historical conversion data
    const historicalConversionsQuery = await db.collection('customerConversions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    const historicalConversions = [];
    historicalConversionsQuery.forEach(doc => {
      historicalConversions.push(doc.data());
    });
    
    // Calculate forecast
    const forecast = await calculateROIForecast(
      forecastParams.budgetAllocation,
      report,
      historicalConversions,
      forecastParams
    );
    
    // Create forecast record
    const forecastRecord = {
      userId,
      budgetAllocation: forecastParams.budgetAllocation,
      startDate: forecastParams.startDate,
      endDate: forecastParams.endDate,
      forecast,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save forecast
    const forecastRef = await db.collection('roiForecasts').add(forecastRecord);
    
    return {
      id: forecastRef.id,
      ...forecastRecord
    };
  } catch (error) {
    console.error('Error generating ROI forecast:', error);
    throw new Error('Failed to generate ROI forecast');
  }
};

/**
 * Calculate ROI forecast
 * @param {Object} budgetAllocation - Budget allocation
 * @param {Object} attributionReport - Attribution report
 * @param {Array} historicalConversions - Historical conversions
 * @param {Object} forecastParams - Forecast parameters
 * @returns {Promise<Object>} ROI forecast
 */
const calculateROIForecast = async (
  budgetAllocation,
  attributionReport,
  historicalConversions,
  forecastParams
) => {
  try {
    // Calculate historical channel performance
    const channelPerformance = {};
    
    Object.entries(attributionReport.channelAttribution).forEach(([channel, data]) => {
      if (data.totalValue > 0 && data.conversionCount > 0) {
        const spend = forecastParams.historicalSpend?.[channel] || 0;
        
        channelPerformance[channel] = {
          conversions: data.conversionCount,
          value: data.totalValue,
          spend,
          roi: spend > 0 ? data.totalValue / spend - 1 : 0,
          cpa: spend > 0 ? spend / data.conversionCount : 0
        };
      }
    });
    
    // Calculate historical conversion trends
    const conversionTrends = calculateConversionTrends(historicalConversions);
    
    // Prepare data for AI analysis
    const forecastData = {
      budgetAllocation,
      channelPerformance,
      conversionTrends,
      startDate: forecastParams.startDate,
      endDate: forecastParams.endDate,
      seasonalityFactors: forecastParams.seasonalityFactors || {},
      marketConditions: forecastParams.marketConditions || 'stable',
      competitiveIntensity: forecastParams.competitiveIntensity || 'medium'
    };
    
    // Prepare prompt for AI
    const prompt = `
      As a marketing ROI forecasting expert, generate a detailed ROI forecast:
      
      Forecast Data: ${JSON.stringify(forecastData)}
      
      Generate a comprehensive ROI forecast that includes:
      1. Expected conversions by channel
      2. Expected revenue by channel
      3. Projected ROI by channel
      4. Overall campaign ROI
      5. Key performance indicators
      6. Risk assessment
      
      Consider these factors in your forecast:
      - Historical channel performance
      - Conversion trends
      - Seasonality: ${JSON.stringify(forecastParams.seasonalityFactors || {})}
      - Market conditions: ${forecastParams.marketConditions || 'stable'}
      - Competitive intensity: ${forecastParams.competitiveIntensity || 'medium'}
      
      Format your response as JSON with these categories.
    `;
    
    // Get forecast from AI
    const forecastResponse = await openai.generateContent(prompt, {
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse forecast
    let forecast;
    try {
      forecast = JSON.parse(forecastResponse);
    } catch (e) {
      console.error('Error parsing ROI forecast:', e);
      // Default forecast if parsing fails
      forecast = {
        channelForecasts: {},
        overallForecast: {
          totalConversions: 0,
          totalRevenue: 0,
          totalROI: 0
        },
        kpis: ["Unable to generate KPIs"],
        riskAssessment: {
          riskLevel: "medium",
          riskFactors: ["Unable to identify risk factors"]
        }
      };
    }
    
    return forecast;
  } catch (error) {
    console.error('Error calculating ROI forecast:', error);
    return {
      channelForecasts: {},
      overallForecast: {
        totalConversions: 0,
        totalRevenue: 0,
        totalROI: 0
      },
      kpis: ["Error generating KPIs"],
      riskAssessment: {
        riskLevel: "high",
        riskFactors: ["Error in forecast calculation"]
      }
    };
  }
};

/**
 * Calculate conversion trends
 * @param {Array} historicalConversions - Historical conversions
 * @returns {Object} Conversion trends
 */
const calculateConversionTrends = (historicalConversions) => {
  // Group conversions by month
  const conversionsByMonth = {};
  
  historicalConversions.forEach(conversion => {
    const timestamp = conversion.timestamp instanceof admin.firestore.Timestamp
      ? conversion.timestamp.toDate()
      : new Date(conversion.timestamp);
    
    const monthKey = `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}`;
    
    if (!conversionsByMonth[monthKey]) {
      conversionsByMonth[monthKey] = {
        count: 0,
        value: 0
      };
    }
    
    conversionsByMonth[monthKey].count += 1;
    conversionsByMonth[monthKey].value += conversion.value || 0;
  });
  
  // Sort months chronologically
  const sortedMonths = Object.keys(conversionsByMonth).sort();
  
  // Calculate month-over-month growth
  const monthlyGrowth = [];
  
  for (let i = 1; i < sortedMonths.length; i++) {
    const currentMonth = sortedMonths[i];
    const previousMonth = sortedMonths[i - 1];
    
    const currentData = conversionsByMonth[currentMonth];
    const previousData = conversionsByMonth[previousMonth];
    
    const countGrowth = previousData.count > 0
      ? (currentData.count - previousData.count) / previousData.count
      : 0;
    
    const valueGrowth = previousData.value > 0
      ? (currentData.value - previousData.value) / previousData.value
      : 0;
    
    monthlyGrowth.push({
      month: currentMonth,
      countGrowth,
      valueGrowth
    });
  }
  
  // Calculate average growth
  let avgCountGrowth = 0;
  let avgValueGrowth = 0;
  
  if (monthlyGrowth.length > 0) {
    avgCountGrowth = monthlyGrowth.reduce((sum, month) => sum + month.countGrowth, 0) / monthlyGrowth.length;
    avgValueGrowth = monthlyGrowth.reduce((sum, month) => sum + month.valueGrowth, 0) / monthlyGrowth.length;
  }
  
  return {
    byMonth: conversionsByMonth,
    monthlyGrowth,
    avgCountGrowth,
    avgValueGrowth
  };
};

/**
 * Generate marketing mix model
 * @param {string} userId - User ID
 * @param {Object} modelParams - Model parameters
 * @returns {Promise<Object>} Marketing mix model
 */
const generateMarketingMixModel = async (userId, modelParams) => {
  try {
    // Validate required fields
    if (!modelParams.startDate || !modelParams.endDate) {
      throw new Error('Missing required model parameters');
    }
    
    // Parse dates
    const startDate = new Date(modelParams.startDate);
    const endDate = new Date(modelParams.endDate);
    
    // Get marketing spend data
    const spendData = modelParams.channelSpend || {};
    
    // Get conversions for the period
    const conversionsQuery = await db.collection('customerConversions')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .get();
    
    const conversions = [];
    conversionsQuery.forEach(doc => {
      conversions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    if (conversions.length === 0) {
      return {
        userId,
        startDate: modelParams.startDate,
        endDate: modelParams.endDate,
        status: 'no_conversions',
        message: 'No conversions found for the specified period'
      };
    }
    
    // Get attributions for these conversions
    const conversionIds = conversions.map(conv => conv.id);
    
    const attributionPromises = conversionIds.map(id => 
      db.collection('conversionAttributions').doc(id).get()
    );
    
    const attributionDocs = await Promise.all(attributionPromises);
    
    const attributions = [];
    attributionDocs.forEach(doc => {
      if (doc.exists) {
        attributions.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    
    // Calculate channel impact
    const channelImpact = calculateChannelImpact(attributions, spendData);
    
    // Calculate cross-channel effects
    const crossChannelEffects = calculateCrossChannelEffects(attributions);
    
    // Calculate diminishing returns
    const diminishingReturns = calculateDiminishingReturns(channelImpact, spendData);
    
    // Generate optimal mix
    const optimalMix = await generateOptimalMix(
      channelImpact,
      crossChannelEffects,
      diminishingReturns,
      modelParams
    );
    
    // Create model
    const model = {
      userId,
      startDate: modelParams.startDate,
      endDate: modelParams.endDate,
      channelSpend: spendData,
      channelImpact,
      crossChannelEffects,
      diminishingReturns,
      optimalMix,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save model
    const modelRef = await db.collection('marketingMixModels').add(model);
    
    return {
      id: modelRef.id,
      ...model
    };
  } catch (error) {
    console.error('Error generating marketing mix model:', error);
    throw new Error('Failed to generate marketing mix model');
  }
};

/**
 * Calculate channel impact
 * @param {Array} attributions - Attributions
 * @param {Object} spendData - Channel spend data
 * @returns {Object} Channel impact
 */
const calculateChannelImpact = (attributions, spendData) => {
  const channelImpact = {};
  
  // Initialize channel impact
  Object.keys(spendData).forEach(channel => {
    channelImpact[channel] = {
      conversions: 0,
      value: 0,
      spend: spendData[channel],
      roi: 0,
      efficiency: 0
    };
  });
  
  // Process attributions
  attributions.forEach(attribution => {
    const touchpoints = attribution.touchpoints || [];
    
    touchpoints.forEach(touchpoint => {
      const channel = touchpoint.channelType;
      
      if (!channelImpact[channel]) {
        channelImpact[channel] = {
          conversions: 0,
          value: 0,
          spend: spendData[channel] || 0,
          roi: 0,
          efficiency: 0
        };
      }
      
      channelImpact[channel].conversions += touchpoint.attributionCredit;
      channelImpact[channel].value += touchpoint.attributionValue;
    });
  });
  
  // Calculate ROI and efficiency
  Object.keys(channelImpact).forEach(channel => {
    const impact = channelImpact[channel];
    
    if (impact.spend > 0) {
      impact.roi = impact.value / impact.spend - 1;
      impact.efficiency = impact.conversions / impact.spend;
    }
  });
  
  return channelImpact;
};

/**
 * Calculate cross-channel effects
 * @param {Array} attributions - Attributions
 * @returns {Object} Cross-channel effects
 */
const calculateCrossChannelEffects = (attributions) => {
  const channelPairs = {};
  const channelCounts = {};
  
  // Process attributions
  attributions.forEach(attribution => {
    const touchpoints = attribution.touchpoints || [];
    
    if (touchpoints.length < 2) {
      return;
    }
    
    // Count channel occurrences
    touchpoints.forEach(touchpoint => {
      const channel = touchpoint.channelType;
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });
    
    // Process channel pairs
    for (let i = 0; i < touchpoints.length; i++) {
      for (let j = i + 1; j < touchpoints.length; j++) {
        const channel1 = touchpoints[i].channelType;
        const channel2 = touchpoints[j].channelType;
        
        // Create pair key (alphabetical order)
        const pairKey = [channel1, channel2].sort().join('_');
        
        if (!channelPairs[pairKey]) {
          channelPairs[pairKey] = {
            channels: [channel1, channel2],
            count: 0,
            conversionValue: 0
          };
        }
        
        channelPairs[pairKey].count += 1;
        channelPairs[pairKey].conversionValue += attribution.conversionValue || 0;
      }
    }
  });
  
  // Calculate lift for each pair
  const crossChannelEffects = {};
  
  Object.entries(channelPairs).forEach(([pairKey, pairData]) => {
    const [channel1, channel2] = pairData.channels;
    
    // Calculate expected co-occurrence if channels were independent
    const totalConversions = attributions.length;
    const expectedCoOccurrence = 
      (channelCounts[channel1] / totalConversions) * 
      (channelCounts[channel2] / totalConversions) * 
      totalConversions;
    
    // Calculate lift
    const actualCoOccurrence = pairData.count;
    const lift = expectedCoOccurrence > 0 ? actualCoOccurrence / expectedCoOccurrence : 0;
    
    crossChannelEffects[pairKey] = {
      channels: pairData.channels,
      lift,
      synergy: lift > 1.2 ? 'positive' : lift < 0.8 ? 'negative' : 'neutral',
      conversionValue: pairData.conversionValue,
      count: pairData.count
    };
  });
  
  return crossChannelEffects;
};

/**
 * Calculate diminishing returns
 * @param {Object} channelImpact - Channel impact
 * @param {Object} spendData - Channel spend data
 * @returns {Object} Diminishing returns
 */
const calculateDiminishingReturns = (channelImpact, spendData) => {
  const diminishingReturns = {};
  
  // Calculate diminishing returns for each channel
  Object.entries(channelImpact).forEach(([channel, impact]) => {
    if (impact.spend > 0 && impact.conversions > 0) {
      // Simple power law model: y = a * x^b where b < 1 indicates diminishing returns
      // We'll use b = 0.7 as a reasonable default
      const b = 0.7;
      const a = impact.conversions / Math.pow(impact.spend, b);
      
      // Calculate marginal returns at different spend levels
      const spendLevels = [
        impact.spend * 0.5,
        impact.spend,
        impact.spend * 1.5,
        impact.spend * 2
      ];
      
      const marginalReturns = {};
      
      spendLevels.forEach(spend => {
        const expectedConversions = a * Math.pow(spend, b);
        marginalReturns[spend] = expectedConversions;
      });
      
      diminishingReturns[channel] = {
        model: {
          a,
          b
        },
        marginalReturns
      };
    }
  });
  
  return diminishingReturns;
};

/**
 * Generate optimal mix
 * @param {Object} channelImpact - Channel impact
 * @param {Object} crossChannelEffects - Cross-channel effects
 * @param {Object} diminishingReturns - Diminishing returns
 * @param {Object} modelParams - Model parameters
 * @returns {Promise<Object>} Optimal mix
 */
const generateOptimalMix = async (
  channelImpact,
  crossChannelEffects,
  diminishingReturns,
  modelParams
) => {
  try {
    // Prepare data for AI analysis
    const mixData = {
      channelImpact,
      crossChannelEffects,
      diminishingReturns,
      totalBudget: modelParams.totalBudget || Object.values(modelParams.channelSpend || {}).reduce((sum, spend) => sum + spend, 0),
      businessObjectives: modelParams.businessObjectives || 'Maximize ROI',
      constraints: modelParams.constraints || {}
    };
    
    // Prepare prompt for AI
    const prompt = `
      As a marketing mix modeling expert, determine the optimal marketing mix:
      
      Mix Data: ${JSON.stringify(mixData)}
      
      Generate an optimal marketing mix that:
      1. Maximizes overall ROI
      2. Accounts for diminishing returns
      3. Leverages positive cross-channel effects
      4. Aligns with business objectives: ${modelParams.businessObjectives || 'Maximize ROI'}
      5. Respects these constraints: ${JSON.stringify(modelParams.constraints || {})}
      
      Provide:
      1. Recommended budget allocation by channel
      2. Expected performance metrics
      3. Rationale for recommendations
      4. Implementation considerations
      
      Format your response as JSON with these categories.
    `;
    
    // Get optimal mix from AI
    const mixResponse = await openai.generateContent(prompt, {
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse optimal mix
    let optimalMix;
    try {
      optimalMix = JSON.parse(mixResponse);
    } catch (e) {
      console.error('Error parsing optimal mix:', e);
      // Default mix if parsing fails
      optimalMix = {
        budgetAllocation: modelParams.channelSpend || {},
        expectedPerformance: {
          totalConversions: 0,
          totalValue: 0,
          roi: 0
        },
        rationale: ["Unable to generate rationale"],
        implementationConsiderations: ["Unable to generate implementation considerations"]
      };
    }
    
    return optimalMix;
  } catch (error) {
    console.error('Error generating optimal mix:', error);
    return {
      budgetAllocation: modelParams.channelSpend || {},
      expectedPerformance: {
        totalConversions: 0,
        totalValue: 0,
        roi: 0
      },
      rationale: ["Error generating rationale"],
      implementationConsiderations: ["Error generating implementation considerations"]
    };
  }
};

module.exports = {
  // Constants
  ATTRIBUTION_MODELS,
  CHANNEL_TYPES,
  CONVERSION_TYPES,
  
  // Tracking and attribution
  trackTouchpoint,
  trackConversion,
  attributeConversion,
  
  // Reporting and analysis
  generateAttributionReport,
  generateBudgetRecommendations,
  generateROIForecast,
  generateMarketingMixModel
};
