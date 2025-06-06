/**
 * Integrated Influencer Marketplace
 * 
 * This module implements the Integrated Influencer Marketplace feature,
 * which connects brands with relevant influencers, automates campaign management,
 * and provides performance analytics for influencer marketing campaigns.
 * 
 * The system allows brands to discover influencers, negotiate terms,
 * manage campaigns, and track performance all within the ReachSpark platform.
 */

const functions = require('firebase-functions');
const { openai } = require('../apis');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Influencer categories
 */
const INFLUENCER_CATEGORIES = {
  LIFESTYLE: 'lifestyle',
  FASHION: 'fashion',
  BEAUTY: 'beauty',
  FITNESS: 'fitness',
  FOOD: 'food',
  TRAVEL: 'travel',
  TECH: 'tech',
  GAMING: 'gaming',
  BUSINESS: 'business',
  EDUCATION: 'education',
  ENTERTAINMENT: 'entertainment',
  FAMILY: 'family',
  HEALTH: 'health',
  HOME: 'home',
  PETS: 'pets'
};

/**
 * Influencer tiers based on follower count
 */
const INFLUENCER_TIERS = {
  NANO: 'nano',           // 1K-10K followers
  MICRO: 'micro',         // 10K-50K followers
  MID_TIER: 'mid_tier',   // 50K-100K followers
  MACRO: 'macro',         // 100K-1M followers
  MEGA: 'mega'            // 1M+ followers
};

/**
 * Campaign status types
 */
const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Collaboration types
 */
const COLLABORATION_TYPES = {
  SPONSORED_POST: 'sponsored_post',
  PRODUCT_REVIEW: 'product_review',
  BRAND_AMBASSADOR: 'brand_ambassador',
  AFFILIATE_MARKETING: 'affiliate_marketing',
  CONTENT_CREATION: 'content_creation',
  ACCOUNT_TAKEOVER: 'account_takeover',
  EVENT_PROMOTION: 'event_promotion',
  GIVEAWAY: 'giveaway'
};

/**
 * Search for influencers based on criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} Matching influencers
 */
const searchInfluencers = async (criteria) => {
  try {
    // Build query based on criteria
    let query = db.collection('influencers').where('status', '==', 'active');
    
    // Apply category filter if provided
    if (criteria.categories && criteria.categories.length > 0) {
      query = query.where('categories', 'array-contains-any', criteria.categories);
    }
    
    // Apply platform filter if provided
    if (criteria.platforms && criteria.platforms.length > 0) {
      query = query.where('platforms', 'array-contains-any', criteria.platforms);
    }
    
    // Apply location filter if provided
    if (criteria.location) {
      query = query.where('location.country', '==', criteria.location);
    }
    
    // Apply audience demographics filters if provided
    if (criteria.audienceAgeRange) {
      query = query.where('audienceDemographics.primaryAgeRange', '==', criteria.audienceAgeRange);
    }
    
    if (criteria.audienceGender) {
      query = query.where('audienceDemographics.primaryGender', '==', criteria.audienceGender);
    }
    
    // Execute query
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return [];
    }
    
    // Process results
    const influencers = [];
    snapshot.forEach(doc => {
      const influencer = {
        id: doc.id,
        ...doc.data()
      };
      
      // Apply follower count filter if provided
      if (criteria.minFollowers && influencer.followerCount < criteria.minFollowers) {
        return;
      }
      
      if (criteria.maxFollowers && influencer.followerCount > criteria.maxFollowers) {
        return;
      }
      
      // Apply engagement rate filter if provided
      if (criteria.minEngagementRate && 
          influencer.engagementRate < criteria.minEngagementRate) {
        return;
      }
      
      // Apply budget filter if provided
      if (criteria.maxBudget && 
          influencer.rateCard && 
          influencer.rateCard.averagePostRate > criteria.maxBudget) {
        return;
      }
      
      influencers.push(influencer);
    });
    
    // Sort results based on criteria
    if (criteria.sortBy === 'followerCount') {
      influencers.sort((a, b) => b.followerCount - a.followerCount);
    } else if (criteria.sortBy === 'engagementRate') {
      influencers.sort((a, b) => b.engagementRate - a.engagementRate);
    } else if (criteria.sortBy === 'relevanceScore') {
      // Calculate relevance score based on criteria match
      influencers.forEach(influencer => {
        influencer.relevanceScore = calculateRelevanceScore(influencer, criteria);
      });
      influencers.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    return influencers;
  } catch (error) {
    console.error('Error searching influencers:', error);
    throw new Error('Failed to search influencers');
  }
};

/**
 * Calculate relevance score for an influencer based on search criteria
 * @param {Object} influencer - Influencer data
 * @param {Object} criteria - Search criteria
 * @returns {number} Relevance score (0-100)
 */
const calculateRelevanceScore = (influencer, criteria) => {
  let score = 50; // Base score
  
  // Category match
  if (criteria.categories && criteria.categories.length > 0) {
    const categoryMatches = criteria.categories.filter(c => 
      influencer.categories && influencer.categories.includes(c)
    );
    score += (categoryMatches.length / criteria.categories.length) * 20;
  }
  
  // Platform match
  if (criteria.platforms && criteria.platforms.length > 0) {
    const platformMatches = criteria.platforms.filter(p => 
      influencer.platforms && influencer.platforms.includes(p)
    );
    score += (platformMatches.length / criteria.platforms.length) * 15;
  }
  
  // Engagement rate bonus
  if (influencer.engagementRate > 0.05) {
    score += 10;
  } else if (influencer.engagementRate > 0.03) {
    score += 5;
  }
  
  // Audience match
  if (criteria.targetAudience && influencer.audienceDemographics) {
    if (criteria.targetAudience.primaryAgeRange === 
        influencer.audienceDemographics.primaryAgeRange) {
      score += 10;
    }
    
    if (criteria.targetAudience.primaryGender === 
        influencer.audienceDemographics.primaryGender) {
      score += 5;
    }
  }
  
  // Previous performance
  if (influencer.campaignHistory && influencer.campaignHistory.length > 0) {
    const successfulCampaigns = influencer.campaignHistory.filter(c => 
      c.performance && c.performance.goalAchieved
    );
    
    if (successfulCampaigns.length > 0) {
      score += Math.min(10, successfulCampaigns.length * 2);
    }
  }
  
  // Cap score at 100
  return Math.min(100, score);
};

/**
 * Get detailed influencer profile
 * @param {string} influencerId - Influencer ID
 * @returns {Promise<Object>} Influencer profile
 */
const getInfluencerProfile = async (influencerId) => {
  try {
    const doc = await db.collection('influencers').doc(influencerId).get();
    
    if (!doc.exists) {
      throw new Error(`Influencer with ID ${influencerId} not found`);
    }
    
    const influencer = {
      id: doc.id,
      ...doc.data()
    };
    
    // Get recent content samples
    const contentQuery = await db.collection('influencerContent')
      .where('influencerId', '==', influencerId)
      .orderBy('postedAt', 'desc')
      .limit(5)
      .get();
    
    const contentSamples = [];
    contentQuery.forEach(doc => {
      contentSamples.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get campaign history
    const campaignQuery = await db.collection('influencerCampaigns')
      .where('influencerId', '==', influencerId)
      .where('status', '==', CAMPAIGN_STATUS.COMPLETED)
      .orderBy('completedAt', 'desc')
      .limit(5)
      .get();
    
    const campaignHistory = [];
    campaignQuery.forEach(doc => {
      campaignHistory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get reviews
    const reviewsQuery = await db.collection('influencerReviews')
      .where('influencerId', '==', influencerId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const reviews = [];
    reviewsQuery.forEach(doc => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }
    
    return {
      ...influencer,
      contentSamples,
      campaignHistory,
      reviews,
      averageRating
    };
  } catch (error) {
    console.error('Error getting influencer profile:', error);
    throw new Error('Failed to get influencer profile');
  }
};

/**
 * Analyze influencer's audience and content
 * @param {string} influencerId - Influencer ID
 * @returns {Promise<Object>} Analysis results
 */
const analyzeInfluencer = async (influencerId) => {
  try {
    // Get influencer profile
    const profile = await getInfluencerProfile(influencerId);
    
    // Get more content samples for analysis
    const contentQuery = await db.collection('influencerContent')
      .where('influencerId', '==', influencerId)
      .orderBy('postedAt', 'desc')
      .limit(20)
      .get();
    
    const contentSamples = [];
    contentQuery.forEach(doc => {
      contentSamples.push(doc.data());
    });
    
    // Analyze content themes and style
    const contentAnalysis = await analyzeContentThemes(contentSamples);
    
    // Analyze audience engagement patterns
    const engagementAnalysis = await analyzeEngagementPatterns(contentSamples);
    
    // Analyze brand alignment
    const brandAlignmentAnalysis = await analyzeBrandAlignment(profile, contentSamples);
    
    // Analyze performance prediction
    const performancePrediction = await predictPerformance(profile, contentSamples);
    
    return {
      influencerId,
      influencerName: profile.name,
      contentAnalysis,
      engagementAnalysis,
      brandAlignmentAnalysis,
      performancePrediction,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp()
    };
  } catch (error) {
    console.error('Error analyzing influencer:', error);
    throw new Error('Failed to analyze influencer');
  }
};

/**
 * Analyze content themes and style
 * @param {Array} contentSamples - Content samples
 * @returns {Promise<Object>} Content analysis
 */
const analyzeContentThemes = async (contentSamples) => {
  try {
    // Extract text content
    const textContent = contentSamples
      .map(sample => sample.caption || sample.description || '')
      .join('\n\n');
    
    // Prepare prompt for AI
    const prompt = `
      As a content analyst, analyze these social media posts from an influencer:
      
      ${textContent}
      
      Identify:
      1. Main themes and topics
      2. Content style and tone
      3. Recurring hashtags or phrases
      4. Types of content that receive highest engagement
      
      Format your response as JSON with these categories.
    `;
    
    // Get analysis from AI
    const analysisResponse = await openai.generateContent(prompt, {
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse analysis
    let analysis;
    try {
      analysis = JSON.parse(analysisResponse);
    } catch (e) {
      console.error('Error parsing content analysis:', e);
      // Default response if parsing fails
      analysis = {
        themes: ["Unable to analyze themes"],
        style: "Unable to analyze style",
        recurringElements: ["Unable to analyze recurring elements"],
        highEngagementContent: ["Unable to analyze high engagement content"]
      };
    }
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing content themes:', error);
    throw new Error('Failed to analyze content themes');
  }
};

/**
 * Analyze engagement patterns
 * @param {Array} contentSamples - Content samples
 * @returns {Promise<Object>} Engagement analysis
 */
const analyzeEngagementPatterns = async (contentSamples) => {
  try {
    // Calculate engagement metrics
    const engagementByDayOfWeek = {
      0: { count: 0, total: 0 }, // Sunday
      1: { count: 0, total: 0 }, // Monday
      2: { count: 0, total: 0 }, // Tuesday
      3: { count: 0, total: 0 }, // Wednesday
      4: { count: 0, total: 0 }, // Thursday
      5: { count: 0, total: 0 }, // Friday
      6: { count: 0, total: 0 }  // Saturday
    };
    
    const engagementByHour = {};
    for (let i = 0; i < 24; i++) {
      engagementByHour[i] = { count: 0, total: 0 };
    }
    
    const engagementByContentType = {
      photo: { count: 0, total: 0 },
      video: { count: 0, total: 0 },
      carousel: { count: 0, total: 0 },
      text: { count: 0, total: 0 }
    };
    
    // Process each content sample
    contentSamples.forEach(sample => {
      if (!sample.postedAt || !sample.engagementMetrics) {
        return;
      }
      
      const postedDate = new Date(sample.postedAt);
      const dayOfWeek = postedDate.getDay();
      const hour = postedDate.getHours();
      
      // Calculate total engagement
      const totalEngagement = 
        (sample.engagementMetrics.likes || 0) + 
        (sample.engagementMetrics.comments || 0) + 
        (sample.engagementMetrics.shares || 0);
      
      // Update day of week stats
      engagementByDayOfWeek[dayOfWeek].count++;
      engagementByDayOfWeek[dayOfWeek].total += totalEngagement;
      
      // Update hour stats
      engagementByHour[hour].count++;
      engagementByHour[hour].total += totalEngagement;
      
      // Update content type stats
      const contentType = sample.contentType || 'photo';
      if (engagementByContentType[contentType]) {
        engagementByContentType[contentType].count++;
        engagementByContentType[contentType].total += totalEngagement;
      }
    });
    
    // Calculate averages
    const dayOfWeekAverages = {};
    Object.keys(engagementByDayOfWeek).forEach(day => {
      const data = engagementByDayOfWeek[day];
      dayOfWeekAverages[day] = data.count > 0 ? data.total / data.count : 0;
    });
    
    const hourAverages = {};
    Object.keys(engagementByHour).forEach(hour => {
      const data = engagementByHour[hour];
      hourAverages[hour] = data.count > 0 ? data.total / data.count : 0;
    });
    
    const contentTypeAverages = {};
    Object.keys(engagementByContentType).forEach(type => {
      const data = engagementByContentType[type];
      contentTypeAverages[type] = data.count > 0 ? data.total / data.count : 0;
    });
    
    // Find best day and time
    let bestDay = '0';
    let bestDayEngagement = 0;
    Object.keys(dayOfWeekAverages).forEach(day => {
      if (dayOfWeekAverages[day] > bestDayEngagement) {
        bestDay = day;
        bestDayEngagement = dayOfWeekAverages[day];
      }
    });
    
    let bestHour = '0';
    let bestHourEngagement = 0;
    Object.keys(hourAverages).forEach(hour => {
      if (hourAverages[hour] > bestHourEngagement) {
        bestHour = hour;
        bestHourEngagement = hourAverages[hour];
      }
    });
    
    // Find best content type
    let bestContentType = 'photo';
    let bestContentTypeEngagement = 0;
    Object.keys(contentTypeAverages).forEach(type => {
      if (contentTypeAverages[type] > bestContentTypeEngagement) {
        bestContentType = type;
        bestContentTypeEngagement = contentTypeAverages[type];
      }
    });
    
    return {
      engagementByDayOfWeek: dayOfWeekAverages,
      engagementByHour: hourAverages,
      engagementByContentType: contentTypeAverages,
      bestPostingTime: {
        day: getDayName(parseInt(bestDay)),
        hour: formatHour(parseInt(bestHour)),
        contentType: bestContentType
      }
    };
  } catch (error) {
    console.error('Error analyzing engagement patterns:', error);
    throw new Error('Failed to analyze engagement patterns');
  }
};

/**
 * Analyze brand alignment
 * @param {Object} profile - Influencer profile
 * @param {Array} contentSamples - Content samples
 * @returns {Promise<Object>} Brand alignment analysis
 */
const analyzeBrandAlignment = async (profile, contentSamples) => {
  try {
    // Extract text content
    const textContent = contentSamples
      .map(sample => sample.caption || sample.description || '')
      .join('\n\n');
    
    // Get brand categories from profile
    const categories = profile.categories || [];
    const tone = profile.contentStyle || 'Not specified';
    const values = profile.brandValues || [];
    
    // Prepare prompt for AI
    const prompt = `
      As a brand alignment specialist, analyze this influencer's content:
      
      Content: "${textContent}"
      
      Influencer Categories: ${categories.join(', ')}
      Content Tone: ${tone}
      Brand Values: ${values.join(', ')}
      
      Analyze:
      1. Brand categories this influencer would align well with
      2. Brand categories to avoid
      3. Authenticity assessment (how genuine the influencer appears)
      4. Values expressed in content
      5. Potential red flags for brands (controversial content, etc.)
      
      Format your response as JSON with these categories.
    `;
    
    // Get analysis from AI
    const analysisResponse = await openai.generateContent(prompt, {
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse analysis
    let analysis;
    try {
      analysis = JSON.parse(analysisResponse);
    } catch (e) {
      console.error('Error parsing brand alignment analysis:', e);
      // Default response if parsing fails
      analysis = {
        alignedBrandCategories: categories,
        brandCategoriesToAvoid: ["Unable to analyze categories to avoid"],
        authenticityScore: 5,
        expressedValues: values,
        potentialRedFlags: ["Unable to analyze potential red flags"]
      };
    }
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing brand alignment:', error);
    throw new Error('Failed to analyze brand alignment');
  }
};

/**
 * Predict influencer performance
 * @param {Object} profile - Influencer profile
 * @param {Array} contentSamples - Content samples
 * @returns {Promise<Object>} Performance prediction
 */
const predictPerformance = async (profile, contentSamples) => {
  try {
    // Calculate average engagement rate
    let totalEngagement = 0;
    let totalReach = 0;
    
    contentSamples.forEach(sample => {
      if (sample.engagementMetrics) {
        const sampleEngagement = 
          (sample.engagementMetrics.likes || 0) + 
          (sample.engagementMetrics.comments || 0) + 
          (sample.engagementMetrics.shares || 0);
        
        totalEngagement += sampleEngagement;
        totalReach += sample.reach || profile.followerCount || 0;
      }
    });
    
    const averageEngagementRate = totalReach > 0 ? 
      totalEngagement / totalReach : 
      profile.engagementRate || 0;
    
    // Calculate performance metrics based on historical data
    const campaignHistory = profile.campaignHistory || [];
    const completedCampaigns = campaignHistory.filter(c => 
      c.status === CAMPAIGN_STATUS.COMPLETED && c.performance
    );
    
    let averageGoalCompletion = 0;
    let averageROI = 0;
    
    if (completedCampaigns.length > 0) {
      const totalGoalCompletion = completedCampaigns.reduce((sum, campaign) => 
        sum + (campaign.performance.goalCompletionRate || 0), 0);
      
      const totalROI = completedCampaigns.reduce((sum, campaign) => 
        sum + (campaign.performance.roi || 0), 0);
      
      averageGoalCompletion = totalGoalCompletion / completedCampaigns.length;
      averageROI = totalROI / completedCampaigns.length;
    }
    
    // Predict performance by campaign type
    const performanceByType = {};
    
    Object.values(COLLABORATION_TYPES).forEach(type => {
      const typeCampaigns = completedCampaigns.filter(c => c.collaborationType === type);
      
      if (typeCampaigns.length > 0) {
        const typeGoalCompletion = typeCampaigns.reduce((sum, campaign) => 
          sum + (campaign.performance.goalCompletionRate || 0), 0) / typeCampaigns.length;
        
        const typeROI = typeCampaigns.reduce((sum, campaign) => 
          sum + (campaign.performance.roi || 0), 0) / typeCampaigns.length;
        
        performanceByType[type] = {
          predictedEngagementRate: averageEngagementRate,
          predictedGoalCompletion: typeGoalCompletion,
          predictedROI: typeROI,
          confidenceScore: Math.min(100, typeCampaigns.length * 20)
        };
      } else {
        // No historical data for this type, use overall averages
        performanceByType[type] = {
          predictedEngagementRate: averageEngagementRate,
          predictedGoalCompletion: averageGoalCompletion,
          predictedROI: averageROI,
          confidenceScore: 30 // Lower confidence due to lack of type-specific data
        };
      }
    });
    
    return {
      overallPrediction: {
        predictedEngagementRate: averageEngagementRate,
        predictedGoalCompletion: averageGoalCompletion,
        predictedROI: averageROI,
        confidenceScore: Math.min(100, completedCampaigns.length * 10)
      },
      performanceByType
    };
  } catch (error) {
    console.error('Error predicting performance:', error);
    throw new Error('Failed to predict performance');
  }
};

/**
 * Create influencer campaign
 * @param {Object} campaignData - Campaign data
 * @returns {Promise<Object>} Created campaign
 */
const createInfluencerCampaign = async (campaignData) => {
  try {
    // Validate required fields
    if (!campaignData.brandId || !campaignData.name || !campaignData.brief) {
      throw new Error('Missing required campaign fields');
    }
    
    // Create campaign
    const campaign = {
      ...campaignData,
      status: CAMPAIGN_STATUS.DRAFT,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to database
    const campaignRef = await db.collection('influencerCampaigns').add(campaign);
    
    // If influencers are specified, create collaboration requests
    if (campaignData.influencers && campaignData.influencers.length > 0) {
      const collaborationPromises = campaignData.influencers.map(influencerId => 
        createCollaborationRequest({
          campaignId: campaignRef.id,
          influencerId,
          brandId: campaignData.brandId,
          status: 'pending',
          message: campaignData.inviteMessage || 'We would like to collaborate with you on our campaign.',
          compensation: campaignData.compensation,
          requirements: campaignData.requirements,
          deadline: campaignData.deadline
        })
      );
      
      await Promise.all(collaborationPromises);
    }
    
    return {
      id: campaignRef.id,
      ...campaign
    };
  } catch (error) {
    console.error('Error creating influencer campaign:', error);
    throw new Error('Failed to create influencer campaign');
  }
};

/**
 * Create collaboration request
 * @param {Object} requestData - Collaboration request data
 * @returns {Promise<Object>} Created request
 */
const createCollaborationRequest = async (requestData) => {
  try {
    // Validate required fields
    if (!requestData.campaignId || !requestData.influencerId || !requestData.brandId) {
      throw new Error('Missing required collaboration request fields');
    }
    
    // Create request
    const request = {
      ...requestData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to database
    const requestRef = await db.collection('collaborationRequests').add(request);
    
    // Update campaign with request
    await db.collection('influencerCampaigns').doc(requestData.campaignId).update({
      collaborationRequests: admin.firestore.FieldValue.arrayUnion(requestRef.id),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send notification to influencer
    await createInfluencerNotification(
      requestData.influencerId,
      'New Collaboration Request',
      `You have received a new collaboration request for campaign: ${requestData.campaignName || 'Unnamed Campaign'}`,
      {
        type: 'collaboration_request',
        requestId: requestRef.id,
        campaignId: requestData.campaignId
      }
    );
    
    return {
      id: requestRef.id,
      ...request
    };
  } catch (error) {
    console.error('Error creating collaboration request:', error);
    throw new Error('Failed to create collaboration request');
  }
};

/**
 * Create notification for influencer
 * @param {string} influencerId - Influencer ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} Created notification
 */
const createInfluencerNotification = async (influencerId, title, message, data = {}) => {
  try {
    const notification = {
      influencerId,
      title,
      message,
      data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const notificationRef = await db.collection('influencerNotifications').add(notification);
    
    return {
      id: notificationRef.id,
      ...notification
    };
  } catch (error) {
    console.error('Error creating influencer notification:', error);
    throw new Error('Failed to create influencer notification');
  }
};

/**
 * Update collaboration request status
 * @param {string} requestId - Request ID
 * @param {string} status - New status
 * @param {string} message - Optional message
 * @returns {Promise<Object>} Updated request
 */
const updateCollaborationRequestStatus = async (requestId, status, message = '') => {
  try {
    // Get request
    const requestDoc = await db.collection('collaborationRequests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      throw new Error(`Collaboration request with ID ${requestId} not found`);
    }
    
    const request = requestDoc.data();
    
    // Update status
    await db.collection('collaborationRequests').doc(requestId).update({
      status,
      responseMessage: message,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If accepted, update campaign
    if (status === 'accepted') {
      await db.collection('influencerCampaigns').doc(request.campaignId).update({
        acceptedInfluencers: admin.firestore.FieldValue.arrayUnion(request.influencerId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create notification for brand
      await createBrandNotification(
        request.brandId,
        'Collaboration Request Accepted',
        `Your collaboration request has been accepted by influencer ID: ${request.influencerId}`,
        {
          type: 'collaboration_accepted',
          requestId,
          campaignId: request.campaignId,
          influencerId: request.influencerId
        }
      );
    } else if (status === 'declined') {
      // Create notification for brand
      await createBrandNotification(
        request.brandId,
        'Collaboration Request Declined',
        `Your collaboration request has been declined by influencer ID: ${request.influencerId}`,
        {
          type: 'collaboration_declined',
          requestId,
          campaignId: request.campaignId,
          influencerId: request.influencerId
        }
      );
    }
    
    return {
      id: requestId,
      ...request,
      status,
      responseMessage: message
    };
  } catch (error) {
    console.error('Error updating collaboration request status:', error);
    throw new Error('Failed to update collaboration request status');
  }
};

/**
 * Create notification for brand
 * @param {string} brandId - Brand ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} Created notification
 */
const createBrandNotification = async (brandId, title, message, data = {}) => {
  try {
    const notification = {
      brandId,
      title,
      message,
      data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const notificationRef = await db.collection('brandNotifications').add(notification);
    
    return {
      id: notificationRef.id,
      ...notification
    };
  } catch (error) {
    console.error('Error creating brand notification:', error);
    throw new Error('Failed to create brand notification');
  }
};

/**
 * Submit campaign content for approval
 * @param {string} campaignId - Campaign ID
 * @param {string} influencerId - Influencer ID
 * @param {Object} contentData - Content data
 * @returns {Promise<Object>} Submitted content
 */
const submitCampaignContent = async (campaignId, influencerId, contentData) => {
  try {
    // Validate required fields
    if (!contentData.contentUrl) {
      throw new Error('Missing required content fields');
    }
    
    // Get campaign
    const campaignDoc = await db.collection('influencerCampaigns').doc(campaignId).get();
    
    if (!campaignDoc.exists) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    const campaign = campaignDoc.data();
    
    // Check if influencer is part of campaign
    if (!campaign.acceptedInfluencers || !campaign.acceptedInfluencers.includes(influencerId)) {
      throw new Error('Influencer is not part of this campaign');
    }
    
    // Create content submission
    const content = {
      campaignId,
      influencerId,
      ...contentData,
      status: 'pending_approval',
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to database
    const contentRef = await db.collection('campaignContent').add(content);
    
    // Update campaign
    await db.collection('influencerCampaigns').doc(campaignId).update({
      contentSubmissions: admin.firestore.FieldValue.arrayUnion(contentRef.id),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create notification for brand
    await createBrandNotification(
      campaign.brandId,
      'New Content Submission',
      `Influencer ID: ${influencerId} has submitted content for your campaign`,
      {
        type: 'content_submission',
        contentId: contentRef.id,
        campaignId,
        influencerId
      }
    );
    
    return {
      id: contentRef.id,
      ...content
    };
  } catch (error) {
    console.error('Error submitting campaign content:', error);
    throw new Error('Failed to submit campaign content');
  }
};

/**
 * Review submitted content
 * @param {string} contentId - Content ID
 * @param {string} status - New status (approved/rejected)
 * @param {string} feedback - Feedback message
 * @returns {Promise<Object>} Updated content
 */
const reviewCampaignContent = async (contentId, status, feedback = '') => {
  try {
    // Get content
    const contentDoc = await db.collection('campaignContent').doc(contentId).get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    const content = contentDoc.data();
    
    // Update status
    await db.collection('campaignContent').doc(contentId).update({
      status,
      feedback,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create notification for influencer
    await createInfluencerNotification(
      content.influencerId,
      `Content ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your content for campaign ID: ${content.campaignId} has been ${status === 'approved' ? 'approved' : 'rejected'}`,
      {
        type: 'content_review',
        contentId,
        campaignId: content.campaignId,
        status
      }
    );
    
    // If approved, update campaign
    if (status === 'approved') {
      await db.collection('influencerCampaigns').doc(content.campaignId).update({
        approvedContent: admin.firestore.FieldValue.arrayUnion(contentId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return {
      id: contentId,
      ...content,
      status,
      feedback
    };
  } catch (error) {
    console.error('Error reviewing campaign content:', error);
    throw new Error('Failed to review campaign content');
  }
};

/**
 * Track campaign performance
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Campaign performance
 */
const trackCampaignPerformance = async (campaignId) => {
  try {
    // Get campaign
    const campaignDoc = await db.collection('influencerCampaigns').doc(campaignId).get();
    
    if (!campaignDoc.exists) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    const campaign = campaignDoc.data();
    
    // Get approved content
    const approvedContentIds = campaign.approvedContent || [];
    
    if (approvedContentIds.length === 0) {
      return {
        campaignId,
        status: 'no_content',
        message: 'No approved content to track'
      };
    }
    
    const contentPromises = approvedContentIds.map(id => 
      db.collection('campaignContent').doc(id).get()
    );
    
    const contentDocs = await Promise.all(contentPromises);
    const contentItems = contentDocs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate performance metrics
    let totalReach = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    
    const performanceByInfluencer = {};
    
    contentItems.forEach(item => {
      if (!item.performanceMetrics) {
        return;
      }
      
      const metrics = item.performanceMetrics;
      
      totalReach += metrics.reach || 0;
      totalEngagement += 
        (metrics.likes || 0) + 
        (metrics.comments || 0) + 
        (metrics.shares || 0);
      totalClicks += metrics.clicks || 0;
      totalConversions += metrics.conversions || 0;
      
      // Track by influencer
      if (!performanceByInfluencer[item.influencerId]) {
        performanceByInfluencer[item.influencerId] = {
          reach: 0,
          engagement: 0,
          clicks: 0,
          conversions: 0
        };
      }
      
      performanceByInfluencer[item.influencerId].reach += metrics.reach || 0;
      performanceByInfluencer[item.influencerId].engagement += 
        (metrics.likes || 0) + 
        (metrics.comments || 0) + 
        (metrics.shares || 0);
      performanceByInfluencer[item.influencerId].clicks += metrics.clicks || 0;
      performanceByInfluencer[item.influencerId].conversions += metrics.conversions || 0;
    });
    
    // Calculate ROI if budget is available
    let roi = 0;
    if (campaign.budget && campaign.budget > 0 && campaign.conversionValue && campaign.conversionValue > 0) {
      const totalValue = totalConversions * campaign.conversionValue;
      roi = (totalValue - campaign.budget) / campaign.budget;
    }
    
    // Calculate goal completion
    let goalCompletion = 0;
    if (campaign.goals) {
      const goalMetrics = {
        reach: totalReach,
        engagement: totalEngagement,
        clicks: totalClicks,
        conversions: totalConversions
      };
      
      let achievedGoals = 0;
      let totalGoals = 0;
      
      Object.keys(campaign.goals).forEach(metric => {
        if (campaign.goals[metric] > 0) {
          totalGoals++;
          if (goalMetrics[metric] >= campaign.goals[metric]) {
            achievedGoals++;
          }
        }
      });
      
      goalCompletion = totalGoals > 0 ? achievedGoals / totalGoals : 0;
    }
    
    // Create performance report
    const performance = {
      campaignId,
      totalReach,
      totalEngagement,
      totalClicks,
      totalConversions,
      engagementRate: totalReach > 0 ? totalEngagement / totalReach : 0,
      clickThroughRate: totalEngagement > 0 ? totalClicks / totalEngagement : 0,
      conversionRate: totalClicks > 0 ? totalConversions / totalClicks : 0,
      roi,
      goalCompletion,
      performanceByInfluencer,
      trackedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save performance report
    await db.collection('campaignPerformance').add(performance);
    
    // Update campaign with latest performance
    await db.collection('influencerCampaigns').doc(campaignId).update({
      performance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return performance;
  } catch (error) {
    console.error('Error tracking campaign performance:', error);
    throw new Error('Failed to track campaign performance');
  }
};

/**
 * Generate campaign report
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Campaign report
 */
const generateCampaignReport = async (campaignId) => {
  try {
    // Get campaign
    const campaignDoc = await db.collection('influencerCampaigns').doc(campaignId).get();
    
    if (!campaignDoc.exists) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    const campaign = campaignDoc.data();
    
    // Get performance data
    const performance = campaign.performance || await trackCampaignPerformance(campaignId);
    
    // Get content items
    const approvedContentIds = campaign.approvedContent || [];
    
    const contentPromises = approvedContentIds.map(id => 
      db.collection('campaignContent').doc(id).get()
    );
    
    const contentDocs = await Promise.all(contentPromises);
    const contentItems = contentDocs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get influencer data
    const influencerIds = Object.keys(performance.performanceByInfluencer || {});
    
    const influencerPromises = influencerIds.map(id => 
      db.collection('influencers').doc(id).get()
    );
    
    const influencerDocs = await Promise.all(influencerPromises);
    const influencers = influencerDocs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Generate insights
    const insights = await generateCampaignInsights(campaign, performance, contentItems, influencers);
    
    // Create report
    const report = {
      campaignId,
      campaignName: campaign.name,
      dateRange: {
        start: campaign.startDate,
        end: campaign.endDate || admin.firestore.FieldValue.serverTimestamp()
      },
      performance,
      contentSummary: contentItems.map(item => ({
        id: item.id,
        influencerId: item.influencerId,
        contentUrl: item.contentUrl,
        contentType: item.contentType,
        caption: item.caption,
        performanceMetrics: item.performanceMetrics
      })),
      influencerSummary: influencers.map(influencer => ({
        id: influencer.id,
        name: influencer.name,
        followerCount: influencer.followerCount,
        engagementRate: influencer.engagementRate,
        performance: performance.performanceByInfluencer[influencer.id]
      })),
      insights,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save report
    const reportRef = await db.collection('campaignReports').add(report);
    
    // Update campaign with report reference
    await db.collection('influencerCampaigns').doc(campaignId).update({
      reportId: reportRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      id: reportRef.id,
      ...report
    };
  } catch (error) {
    console.error('Error generating campaign report:', error);
    throw new Error('Failed to generate campaign report');
  }
};

/**
 * Generate campaign insights
 * @param {Object} campaign - Campaign data
 * @param {Object} performance - Performance data
 * @param {Array} contentItems - Content items
 * @param {Array} influencers - Influencers
 * @returns {Promise<Object>} Campaign insights
 */
const generateCampaignInsights = async (campaign, performance, contentItems, influencers) => {
  try {
    // Prepare data for AI analysis
    const campaignSummary = {
      name: campaign.name,
      brief: campaign.brief,
      goals: campaign.goals,
      budget: campaign.budget,
      performance: {
        totalReach: performance.totalReach,
        totalEngagement: performance.totalEngagement,
        totalClicks: performance.totalClicks,
        totalConversions: performance.totalConversions,
        engagementRate: performance.engagementRate,
        roi: performance.roi,
        goalCompletion: performance.goalCompletion
      }
    };
    
    const influencerPerformance = influencers.map(influencer => ({
      name: influencer.name,
      followerCount: influencer.followerCount,
      engagementRate: influencer.engagementRate,
      performance: performance.performanceByInfluencer[influencer.id]
    }));
    
    const contentPerformance = contentItems.map(item => ({
      type: item.contentType,
      caption: item.caption,
      metrics: item.performanceMetrics
    }));
    
    // Prepare prompt for AI
    const prompt = `
      As a marketing analyst, provide insights for this influencer marketing campaign:
      
      Campaign: ${JSON.stringify(campaignSummary)}
      
      Influencer Performance: ${JSON.stringify(influencerPerformance)}
      
      Content Performance: ${JSON.stringify(contentPerformance)}
      
      Provide insights on:
      1. Key performance highlights
      2. Top performing influencers and why
      3. Top performing content types and why
      4. Areas for improvement
      5. Recommendations for future campaigns
      
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
      console.error('Error parsing campaign insights:', e);
      // Default insights if parsing fails
      insights = {
        keyHighlights: ["Unable to generate key highlights"],
        topPerformingInfluencers: ["Unable to identify top performing influencers"],
        topPerformingContent: ["Unable to identify top performing content"],
        areasForImprovement: ["Unable to identify areas for improvement"],
        recommendations: ["Unable to generate recommendations"]
      };
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating campaign insights:', error);
    throw new Error('Failed to generate campaign insights');
  }
};

/**
 * Recommend influencers for a campaign
 * @param {Object} campaignData - Campaign data
 * @param {number} [count=10] - Number of recommendations
 * @returns {Promise<Array>} Recommended influencers
 */
const recommendInfluencers = async (campaignData, count = 10) => {
  try {
    // Extract campaign criteria
    const criteria = {
      categories: campaignData.categories || [],
      platforms: campaignData.platforms || [],
      minFollowers: campaignData.audienceSize?.min,
      maxFollowers: campaignData.audienceSize?.max,
      location: campaignData.targetLocation,
      audienceAgeRange: campaignData.targetAudience?.ageRange,
      audienceGender: campaignData.targetAudience?.gender,
      maxBudget: campaignData.budget,
      sortBy: 'relevanceScore'
    };
    
    // Search for matching influencers
    const influencers = await searchInfluencers(criteria);
    
    // If not enough results, broaden search
    if (influencers.length < count) {
      // Remove some constraints
      delete criteria.location;
      delete criteria.audienceAgeRange;
      delete criteria.audienceGender;
      
      // Search again
      const moreInfluencers = await searchInfluencers(criteria);
      
      // Add new influencers that weren't in original results
      const existingIds = influencers.map(i => i.id);
      moreInfluencers.forEach(influencer => {
        if (!existingIds.includes(influencer.id)) {
          influencers.push(influencer);
        }
      });
    }
    
    // Sort by relevance score and take top results
    const recommendations = influencers
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, count)
      .map(influencer => ({
        id: influencer.id,
        name: influencer.name,
        followerCount: influencer.followerCount,
        engagementRate: influencer.engagementRate,
        categories: influencer.categories,
        platforms: influencer.platforms,
        relevanceScore: influencer.relevanceScore,
        estimatedReach: influencer.followerCount,
        estimatedEngagement: Math.round(influencer.followerCount * influencer.engagementRate),
        rateCard: influencer.rateCard
      }));
    
    return recommendations;
  } catch (error) {
    console.error('Error recommending influencers:', error);
    throw new Error('Failed to recommend influencers');
  }
};

/**
 * Negotiate collaboration terms
 * @param {string} requestId - Collaboration request ID
 * @param {Object} counterOffer - Counter offer terms
 * @returns {Promise<Object>} Updated request
 */
const negotiateTerms = async (requestId, counterOffer) => {
  try {
    // Get request
    const requestDoc = await db.collection('collaborationRequests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      throw new Error(`Collaboration request with ID ${requestId} not found`);
    }
    
    const request = requestDoc.data();
    
    // Update with counter offer
    await db.collection('collaborationRequests').doc(requestId).update({
      counterOffer,
      negotiationHistory: admin.firestore.FieldValue.arrayUnion({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        offeredBy: counterOffer.offeredBy,
        terms: counterOffer.terms
      }),
      status: 'negotiating',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create notification for recipient
    const recipientId = counterOffer.offeredBy === 'brand' ? 
      request.influencerId : request.brandId;
    
    const notificationMethod = counterOffer.offeredBy === 'brand' ? 
      createInfluencerNotification : createBrandNotification;
    
    await notificationMethod(
      recipientId,
      'New Counter Offer',
      `You have received a counter offer for collaboration request ID: ${requestId}`,
      {
        type: 'counter_offer',
        requestId,
        campaignId: request.campaignId
      }
    );
    
    return {
      id: requestId,
      ...request,
      counterOffer,
      status: 'negotiating'
    };
  } catch (error) {
    console.error('Error negotiating terms:', error);
    throw new Error('Failed to negotiate terms');
  }
};

/**
 * Get day name from day number
 * @param {number} day - Day number (0-6, where 0 is Sunday)
 * @returns {string} Day name
 */
const getDayName = (day) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
};

/**
 * Format hour in 12-hour format
 * @param {number} hour - Hour in 24-hour format (0-23)
 * @returns {string} Formatted hour
 */
const formatHour = (hour) => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
};

module.exports = {
  // Constants
  INFLUENCER_CATEGORIES,
  INFLUENCER_TIERS,
  CAMPAIGN_STATUS,
  COLLABORATION_TYPES,
  
  // Influencer discovery and analysis
  searchInfluencers,
  getInfluencerProfile,
  analyzeInfluencer,
  recommendInfluencers,
  
  // Campaign management
  createInfluencerCampaign,
  createCollaborationRequest,
  updateCollaborationRequestStatus,
  negotiateTerms,
  
  // Content management
  submitCampaignContent,
  reviewCampaignContent,
  
  // Performance tracking and reporting
  trackCampaignPerformance,
  generateCampaignReport
};
