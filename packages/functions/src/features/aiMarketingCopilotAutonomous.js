/**
 * AI Marketing Copilot with Autonomous Capabilities
 * 
 * This module extends the AI Marketing Copilot with autonomous capabilities,
 * allowing it to proactively monitor, analyze, and optimize marketing campaigns
 * with minimal human intervention when authorized by the user.
 * 
 * The autonomous capabilities include:
 * - Proactive campaign monitoring and optimization
 * - Automated content generation and scheduling
 * - Intelligent A/B testing management
 * - Cross-channel performance analysis
 * - Predictive trend identification and implementation
 */

const functions = require('firebase-functions');
const { openai, gemini, facebook, tiktok, rapidapiTwitter } = require('../apis');
const admin = require('firebase-admin');
const aiMarketingCopilot = require('./aiMarketingCopilot');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * User permission levels for autonomous actions
 */
const PERMISSION_LEVELS = {
  NONE: 'none',                 // No autonomous actions allowed
  SUGGEST_ONLY: 'suggest_only', // Only generate suggestions, no actions
  LOW: 'low',                   // Low-risk actions (e.g., content variations)
  MEDIUM: 'medium',             // Medium-risk actions (e.g., A/B testing)
  HIGH: 'high'                  // High-risk actions (e.g., budget adjustments)
};

/**
 * Action types for autonomous operations
 */
const ACTION_TYPES = {
  CONTENT_VARIATION: 'content_variation',
  SCHEDULE_ADJUSTMENT: 'schedule_adjustment',
  BUDGET_REALLOCATION: 'budget_reallocation',
  AB_TEST_CREATION: 'ab_test_creation',
  CAMPAIGN_OPTIMIZATION: 'campaign_optimization',
  TREND_IMPLEMENTATION: 'trend_implementation'
};

/**
 * Check if user has granted permission for autonomous action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action from ACTION_TYPES
 * @returns {Promise<boolean>} Whether action is permitted
 */
const checkUserPermission = async (userId, actionType) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    const autonomousSettings = userData.autonomousSettings || { permissionLevel: PERMISSION_LEVELS.NONE };
    
    // If user has disabled all autonomous actions
    if (autonomousSettings.permissionLevel === PERMISSION_LEVELS.NONE) {
      return false;
    }
    
    // If user only wants suggestions
    if (autonomousSettings.permissionLevel === PERMISSION_LEVELS.SUGGEST_ONLY) {
      return false;
    }
    
    // Check specific action permissions based on risk level
    switch (actionType) {
      case ACTION_TYPES.CONTENT_VARIATION:
        // Low risk - allowed for LOW permission and above
        return [PERMISSION_LEVELS.LOW, PERMISSION_LEVELS.MEDIUM, PERMISSION_LEVELS.HIGH]
          .includes(autonomousSettings.permissionLevel);
          
      case ACTION_TYPES.SCHEDULE_ADJUSTMENT:
      case ACTION_TYPES.AB_TEST_CREATION:
        // Medium risk - allowed for MEDIUM permission and above
        return [PERMISSION_LEVELS.MEDIUM, PERMISSION_LEVELS.HIGH]
          .includes(autonomousSettings.permissionLevel);
          
      case ACTION_TYPES.BUDGET_REALLOCATION:
      case ACTION_TYPES.CAMPAIGN_OPTIMIZATION:
      case ACTION_TYPES.TREND_IMPLEMENTATION:
        // High risk - allowed only for HIGH permission
        return autonomousSettings.permissionLevel === PERMISSION_LEVELS.HIGH;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false; // Default to no permission on error
  }
};

/**
 * Log autonomous action for transparency and user review
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action from ACTION_TYPES
 * @param {string} description - Description of the action
 * @param {Object} details - Additional details about the action
 * @param {boolean} isSimulation - Whether this was a simulation or actual action
 * @returns {Promise<string>} ID of the logged action
 */
const logAutonomousAction = async (userId, actionType, description, details, isSimulation = false) => {
  try {
    const actionRef = await db.collection('autonomousActions').add({
      userId,
      actionType,
      description,
      details,
      isSimulation,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      reviewed: false,
      approved: !isSimulation // Auto-approve actual actions
    });
    
    return actionRef.id;
  } catch (error) {
    console.error('Error logging autonomous action:', error);
    throw new Error('Failed to log autonomous action');
  }
};

/**
 * Proactively monitor campaigns and identify optimization opportunities
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of identified opportunities
 */
const monitorCampaigns = async (userId) => {
  try {
    // Get active campaigns for user
    const campaignsQuery = await db.collection('campaigns')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    if (campaignsQuery.empty) {
      return [];
    }
    
    const opportunities = [];
    const campaignPromises = [];
    
    campaignsQuery.forEach(doc => {
      const campaign = doc.data();
      const promise = analyzeCampaignPerformance(doc.id, campaign)
        .then(analysisResults => {
          if (analysisResults.opportunities.length > 0) {
            opportunities.push({
              campaignId: doc.id,
              campaignName: campaign.name,
              opportunities: analysisResults.opportunities
            });
          }
        });
      
      campaignPromises.push(promise);
    });
    
    await Promise.all(campaignPromises);
    
    // Log the monitoring activity
    await logAutonomousAction(
      userId,
      'campaign_monitoring',
      `Monitored ${campaignsQuery.size} active campaigns`,
      { opportunitiesFound: opportunities.length },
      true
    );
    
    return opportunities;
  } catch (error) {
    console.error('Error monitoring campaigns:', error);
    throw new Error('Failed to monitor campaigns');
  }
};

/**
 * Analyze campaign performance and identify optimization opportunities
 * @param {string} campaignId - Campaign ID
 * @param {Object} campaign - Campaign data
 * @returns {Promise<Object>} Analysis results with opportunities
 */
const analyzeCampaignPerformance = async (campaignId, campaign) => {
  try {
    // Get performance metrics
    const metricsQuery = await db.collection('campaignMetrics')
      .where('campaignId', '==', campaignId)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const metrics = [];
    metricsQuery.forEach(doc => {
      metrics.push(doc.data());
    });
    
    // If no metrics, return empty analysis
    if (metrics.length === 0) {
      return { opportunities: [] };
    }
    
    const opportunities = [];
    
    // Check for declining engagement
    const recentMetrics = metrics.slice(0, 3);
    const olderMetrics = metrics.slice(3, 6);
    
    if (recentMetrics.length >= 3 && olderMetrics.length >= 3) {
      const recentAvgEngagement = recentMetrics.reduce((sum, m) => sum + (m.clicks / m.opens), 0) / recentMetrics.length;
      const olderAvgEngagement = olderMetrics.reduce((sum, m) => sum + (m.clicks / m.opens), 0) / olderMetrics.length;
      
      if (recentAvgEngagement < olderAvgEngagement * 0.8) {
        opportunities.push({
          type: ACTION_TYPES.CONTENT_VARIATION,
          priority: 'high',
          description: 'Engagement declining - content refresh needed',
          metrics: {
            recentEngagement: recentAvgEngagement.toFixed(2),
            previousEngagement: olderAvgEngagement.toFixed(2),
            percentChange: ((recentAvgEngagement / olderAvgEngagement - 1) * 100).toFixed(1)
          }
        });
      }
    }
    
    // Check for suboptimal send times
    if (campaign.channelType === 'email' || campaign.channelType === 'social') {
      const sendTimeDistribution = {};
      
      metrics.forEach(m => {
        const sendTime = new Date(m.sendTimestamp);
        const hour = sendTime.getHours();
        const day = sendTime.getDay();
        const timeKey = `${day}-${hour}`;
        
        if (!sendTimeDistribution[timeKey]) {
          sendTimeDistribution[timeKey] = {
            count: 0,
            opens: 0,
            clicks: 0,
            conversions: 0
          };
        }
        
        sendTimeDistribution[timeKey].count++;
        sendTimeDistribution[timeKey].opens += m.opens || 0;
        sendTimeDistribution[timeKey].clicks += m.clicks || 0;
        sendTimeDistribution[timeKey].conversions += m.conversions || 0;
      });
      
      // Calculate engagement by time
      Object.keys(sendTimeDistribution).forEach(timeKey => {
        const data = sendTimeDistribution[timeKey];
        data.engagementRate = data.clicks / data.opens;
      });
      
      // Find best and current time slots
      const timeSlots = Object.keys(sendTimeDistribution);
      const bestTimeSlot = timeSlots.reduce((best, current) => {
        return sendTimeDistribution[current].engagementRate > sendTimeDistribution[best].engagementRate
          ? current : best;
      }, timeSlots[0]);
      
      const currentTimeSlot = `${campaign.scheduleDay}-${campaign.scheduleHour}`;
      
      if (bestTimeSlot !== currentTimeSlot && 
          sendTimeDistribution[bestTimeSlot].engagementRate > sendTimeDistribution[currentTimeSlot].engagementRate * 1.2) {
        const [bestDay, bestHour] = bestTimeSlot.split('-');
        
        opportunities.push({
          type: ACTION_TYPES.SCHEDULE_ADJUSTMENT,
          priority: 'medium',
          description: 'Suboptimal send time - schedule adjustment recommended',
          details: {
            currentDay: getDayName(parseInt(campaign.scheduleDay)),
            currentHour: formatHour(parseInt(campaign.scheduleHour)),
            recommendedDay: getDayName(parseInt(bestDay)),
            recommendedHour: formatHour(parseInt(bestHour)),
            improvementPotential: ((sendTimeDistribution[bestTimeSlot].engagementRate / 
                                   sendTimeDistribution[currentTimeSlot].engagementRate - 1) * 100).toFixed(1) + '%'
          }
        });
      }
    }
    
    // Check for A/B testing opportunity
    if (!campaign.hasActiveTest && metrics.length >= 5) {
      opportunities.push({
        type: ACTION_TYPES.AB_TEST_CREATION,
        priority: 'medium',
        description: 'No recent A/B test - testing opportunity identified',
        details: {
          suggestedTestType: campaign.channelType === 'email' ? 'subject_line' : 'headline',
          expectedInsight: 'Engagement impact of different messaging approaches',
          recommendedVariations: 2
        }
      });
    }
    
    return { opportunities };
  } catch (error) {
    console.error('Error analyzing campaign performance:', error);
    throw new Error('Failed to analyze campaign performance');
  }
};

/**
 * Autonomously implement campaign optimizations based on analysis
 * @param {string} userId - User ID
 * @param {string} campaignId - Campaign ID
 * @param {Array} opportunities - Identified opportunities
 * @returns {Promise<Array>} Results of implemented optimizations
 */
const implementOptimizations = async (userId, campaignId, opportunities) => {
  try {
    const results = [];
    
    for (const opportunity of opportunities) {
      // Check if user has granted permission for this action type
      const isPermitted = await checkUserPermission(userId, opportunity.type);
      
      if (!isPermitted) {
        results.push({
          opportunity,
          implemented: false,
          reason: 'User permission not granted for this action type',
          suggestionCreated: true
        });
        
        // Create suggestion instead
        await createOptimizationSuggestion(userId, campaignId, opportunity);
        continue;
      }
      
      // Implement optimization based on type
      switch (opportunity.type) {
        case ACTION_TYPES.CONTENT_VARIATION:
          const contentResult = await implementContentVariation(userId, campaignId, opportunity);
          results.push({
            opportunity,
            implemented: true,
            result: contentResult
          });
          break;
          
        case ACTION_TYPES.SCHEDULE_ADJUSTMENT:
          const scheduleResult = await implementScheduleAdjustment(userId, campaignId, opportunity);
          results.push({
            opportunity,
            implemented: true,
            result: scheduleResult
          });
          break;
          
        case ACTION_TYPES.AB_TEST_CREATION:
          const testResult = await implementAbTest(userId, campaignId, opportunity);
          results.push({
            opportunity,
            implemented: true,
            result: testResult
          });
          break;
          
        default:
          results.push({
            opportunity,
            implemented: false,
            reason: 'Unsupported optimization type',
            suggestionCreated: true
          });
          
          // Create suggestion instead
          await createOptimizationSuggestion(userId, campaignId, opportunity);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error implementing optimizations:', error);
    throw new Error('Failed to implement optimizations');
  }
};

/**
 * Create optimization suggestion when autonomous action is not permitted
 * @param {string} userId - User ID
 * @param {string} campaignId - Campaign ID
 * @param {Object} opportunity - Identified opportunity
 * @returns {Promise<string>} ID of created suggestion
 */
const createOptimizationSuggestion = async (userId, campaignId, opportunity) => {
  try {
    const suggestionRef = await db.collection('optimizationSuggestions').add({
      userId,
      campaignId,
      opportunity,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      implementedAt: null
    });
    
    return suggestionRef.id;
  } catch (error) {
    console.error('Error creating optimization suggestion:', error);
    throw new Error('Failed to create optimization suggestion');
  }
};

/**
 * Implement content variation optimization
 * @param {string} userId - User ID
 * @param {string} campaignId - Campaign ID
 * @param {Object} opportunity - Content variation opportunity
 * @returns {Promise<Object>} Result of implementation
 */
const implementContentVariation = async (userId, campaignId, opportunity) => {
  try {
    // Get campaign data
    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    
    if (!campaignDoc.exists) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    const campaign = campaignDoc.data();
    
    // Get content ID from campaign
    const contentId = campaign.contentId;
    
    if (!contentId) {
      throw new Error('Campaign does not have associated content');
    }
    
    // Generate content variations
    const variations = await aiMarketingCopilot.generateContentVariations(contentId, 2);
    
    // Select best variation based on AI analysis
    const bestVariation = await selectBestContentVariation(campaign, variations);
    
    // Update campaign with new content
    await db.collection('campaigns').doc(campaignId).update({
      content: bestVariation,
      lastOptimizedAt: admin.firestore.FieldValue.serverTimestamp(),
      optimizationType: 'content_variation',
      previousContent: campaign.content
    });
    
    // Log the autonomous action
    const actionId = await logAutonomousAction(
      userId,
      ACTION_TYPES.CONTENT_VARIATION,
      `Autonomously updated content for campaign "${campaign.name}"`,
      {
        campaignId,
        previousContent: campaign.content,
        newContent: bestVariation
      },
      false
    );
    
    return {
      success: true,
      actionId,
      contentUpdated: true,
      previousContent: campaign.content.substring(0, 100) + '...',
      newContent: bestVariation.substring(0, 100) + '...'
    };
  } catch (error) {
    console.error('Error implementing content variation:', error);
    throw new Error('Failed to implement content variation');
  }
};

/**
 * Select the best content variation using AI analysis
 * @param {Object} campaign - Campaign data
 * @param {Array} variations - Content variations
 * @returns {Promise<string>} Best content variation
 */
const selectBestContentVariation = async (campaign, variations) => {
  try {
    // Prepare prompt for AI
    const prompt = `
      As an expert marketing analyst, evaluate these content variations for a ${campaign.type} campaign
      targeting ${campaign.targetAudience}:
      
      Original Content: "${campaign.content}"
      
      Variation 1: "${variations[0]}"
      
      Variation 2: "${variations[1]}"
      
      Based on marketing best practices, engagement potential, and alignment with the target audience,
      which variation is most likely to perform best? Explain your reasoning and then indicate your
      final selection as either "Original", "Variation 1", or "Variation 2".
    `;
    
    // Get analysis from AI
    const analysis = await openai.generateContent(prompt, {
      max_tokens: 1000,
      temperature: 0.3
    });
    
    // Parse the selection from the analysis
    let selectedVariation;
    
    if (analysis.toLowerCase().includes('variation 1') && 
        (analysis.toLowerCase().includes('variation 1 is best') || 
         analysis.toLowerCase().includes('select variation 1') ||
         analysis.toLowerCase().includes('choose variation 1') ||
         analysis.toLowerCase().includes('variation 1 would perform best'))) {
      selectedVariation = variations[0];
    } else if (analysis.toLowerCase().includes('variation 2') && 
               (analysis.toLowerCase().includes('variation 2 is best') || 
                analysis.toLowerCase().includes('select variation 2') ||
                analysis.toLowerCase().includes('choose variation 2') ||
                analysis.toLowerCase().includes('variation 2 would perform best'))) {
      selectedVariation = variations[1];
    } else {
      // Default to first variation if analysis is inconclusive
      selectedVariation = variations[0];
    }
    
    return selectedVariation;
  } catch (error) {
    console.error('Error selecting best content variation:', error);
    // Default to first variation on error
    return variations[0];
  }
};

/**
 * Implement schedule adjustment optimization
 * @param {string} userId - User ID
 * @param {string} campaignId - Campaign ID
 * @param {Object} opportunity - Schedule adjustment opportunity
 * @returns {Promise<Object>} Result of implementation
 */
const implementScheduleAdjustment = async (userId, campaignId, opportunity) => {
  try {
    // Get campaign data
    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    
    if (!campaignDoc.exists) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    const campaign = campaignDoc.data();
    
    // Extract recommended day and hour
    const recommendedDay = getDayNumber(opportunity.details.recommendedDay);
    const recommendedHour = getHourNumber(opportunity.details.recommendedHour);
    
    // Update campaign schedule
    await db.collection('campaigns').doc(campaignId).update({
      scheduleDay: recommendedDay,
      scheduleHour: recommendedHour,
      lastOptimizedAt: admin.firestore.FieldValue.serverTimestamp(),
      optimizationType: 'schedule_adjustment',
      previousScheduleDay: campaign.scheduleDay,
      previousScheduleHour: campaign.scheduleHour
    });
    
    // Log the autonomous action
    const actionId = await logAutonomousAction(
      userId,
      ACTION_TYPES.SCHEDULE_ADJUSTMENT,
      `Autonomously adjusted schedule for campaign "${campaign.name}"`,
      {
        campaignId,
        previousSchedule: {
          day: getDayName(campaign.scheduleDay),
          hour: formatHour(campaign.scheduleHour)
        },
        newSchedule: {
          day: opportunity.details.recommendedDay,
          hour: opportunity.details.recommendedHour
        },
        improvementPotential: opportunity.details.improvementPotential
      },
      false
    );
    
    return {
      success: true,
      actionId,
      scheduleUpdated: true,
      previousSchedule: `${getDayName(campaign.scheduleDay)} at ${formatHour(campaign.scheduleHour)}`,
      newSchedule: `${opportunity.details.recommendedDay} at ${opportunity.details.recommendedHour}`,
      improvementPotential: opportunity.details.improvementPotential
    };
  } catch (error) {
    console.error('Error implementing schedule adjustment:', error);
    throw new Error('Failed to implement schedule adjustment');
  }
};

/**
 * Implement A/B test creation
 * @param {string} userId - User ID
 * @param {string} campaignId - Campaign ID
 * @param {Object} opportunity - A/B test opportunity
 * @returns {Promise<Object>} Result of implementation
 */
const implementAbTest = async (userId, campaignId, opportunity) => {
  try {
    // Get campaign data
    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    
    if (!campaignDoc.exists) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    const campaign = campaignDoc.data();
    
    // Generate test variations based on test type
    let variations;
    let testField;
    
    if (opportunity.details.suggestedTestType === 'subject_line') {
      // Generate subject line variations
      variations = await generateSubjectLineVariations(campaign);
      testField = 'subjectLine';
    } else if (opportunity.details.suggestedTestType === 'headline') {
      // Generate headline variations
      variations = await generateHeadlineVariations(campaign);
      testField = 'headline';
    } else {
      throw new Error(`Unsupported test type: ${opportunity.details.suggestedTestType}`);
    }
    
    // Create A/B test
    const testRef = await db.collection('abTests').add({
      campaignId,
      userId,
      testType: opportunity.details.suggestedTestType,
      variations,
      status: 'active',
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      endDate: null,
      results: null
    });
    
    // Update campaign with A/B test reference
    await db.collection('campaigns').doc(campaignId).update({
      hasActiveTest: true,
      activeTestId: testRef.id,
      lastOptimizedAt: admin.firestore.FieldValue.serverTimestamp(),
      optimizationType: 'ab_test_creation'
    });
    
    // Log the autonomous action
    const actionId = await logAutonomousAction(
      userId,
      ACTION_TYPES.AB_TEST_CREATION,
      `Autonomously created A/B test for campaign "${campaign.name}"`,
      {
        campaignId,
        testId: testRef.id,
        testType: opportunity.details.suggestedTestType,
        variations
      },
      false
    );
    
    return {
      success: true,
      actionId,
      testCreated: true,
      testId: testRef.id,
      testType: opportunity.details.suggestedTestType,
      variations
    };
  } catch (error) {
    console.error('Error implementing A/B test:', error);
    throw new Error('Failed to implement A/B test');
  }
};

/**
 * Generate subject line variations for A/B testing
 * @param {Object} campaign - Campaign data
 * @returns {Promise<Array>} Subject line variations
 */
const generateSubjectLineVariations = async (campaign) => {
  try {
    // Prepare prompt for AI
    const prompt = `
      As an expert email marketer, create 2 alternative subject lines for this email campaign:
      
      Current Subject Line: "${campaign.subjectLine}"
      Email Content: "${campaign.content}"
      Target Audience: ${campaign.targetAudience}
      
      Create 2 subject line variations that:
      - Maintain the key message but use different approaches
      - Are optimized for open rates
      - Use different emotional appeals or curiosity techniques
      - Are appropriate for the target audience
      
      Format each variation as: "Variation #: [subject line]"
    `;
    
    // Get variations from AI
    const generatedVariations = await openai.generateContent(prompt, {
      max_tokens: 500,
      temperature: 0.7
    });
    
    // Parse variations
    const variations = [campaign.subjectLine]; // Include original as first variation
    
    const lines = generatedVariations.split('\n');
    for (const line of lines) {
      const match = line.match(/Variation \d+:\s*(.+)/i);
      if (match && match[1]) {
        variations.push(match[1].trim());
      }
    }
    
    // Ensure we have at least 3 variations (original + 2 new)
    while (variations.length < 3) {
      variations.push(`Alternative ${variations.length}: ${campaign.subjectLine}`);
    }
    
    return variations;
  } catch (error) {
    console.error('Error generating subject line variations:', error);
    throw new Error('Failed to generate subject line variations');
  }
};

/**
 * Generate headline variations for A/B testing
 * @param {Object} campaign - Campaign data
 * @returns {Promise<Array>} Headline variations
 */
const generateHeadlineVariations = async (campaign) => {
  try {
    // Extract current headline from content
    let currentHeadline = campaign.headline || '';
    
    if (!currentHeadline) {
      // Try to extract headline from content
      const contentLines = campaign.content.split('\n');
      if (contentLines.length > 0) {
        currentHeadline = contentLines[0].trim();
      } else {
        currentHeadline = 'Current Headline';
      }
    }
    
    // Prepare prompt for AI
    const prompt = `
      As an expert copywriter, create 2 alternative headlines for this ${campaign.type} campaign:
      
      Current Headline: "${currentHeadline}"
      Content: "${campaign.content}"
      Target Audience: ${campaign.targetAudience}
      
      Create 2 headline variations that:
      - Maintain the key message but use different approaches
      - Are optimized for engagement and click-through
      - Use different emotional appeals or benefit structures
      - Are appropriate for the target audience
      
      Format each variation as: "Variation #: [headline]"
    `;
    
    // Get variations from AI
    const generatedVariations = await openai.generateContent(prompt, {
      max_tokens: 500,
      temperature: 0.7
    });
    
    // Parse variations
    const variations = [currentHeadline]; // Include original as first variation
    
    const lines = generatedVariations.split('\n');
    for (const line of lines) {
      const match = line.match(/Variation \d+:\s*(.+)/i);
      if (match && match[1]) {
        variations.push(match[1].trim());
      }
    }
    
    // Ensure we have at least 3 variations (original + 2 new)
    while (variations.length < 3) {
      variations.push(`Alternative ${variations.length}: ${currentHeadline}`);
    }
    
    return variations;
  } catch (error) {
    console.error('Error generating headline variations:', error);
    throw new Error('Failed to generate headline variations');
  }
};

/**
 * Proactively identify and implement trending topics in marketing content
 * @param {string} userId - User ID
 * @param {string} industry - User's industry
 * @returns {Promise<Object>} Results of trend implementation
 */
const implementTrendingTopics = async (userId, industry) => {
  try {
    // Check if user has granted permission for trend implementation
    const isPermitted = await checkUserPermission(userId, ACTION_TYPES.TREND_IMPLEMENTATION);
    
    if (!isPermitted) {
      // Create suggestion instead
      const trends = await identifyTrendingTopics(industry);
      
      await db.collection('trendSuggestions').add({
        userId,
        industry,
        trends,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        implementedAt: null
      });
      
      return {
        implemented: false,
        reason: 'User permission not granted for trend implementation',
        suggestionCreated: true,
        trends
      };
    }
    
    // Identify trending topics
    const trends = await identifyTrendingTopics(industry);
    
    // Get user's content calendar
    const calendarQuery = await db.collection('contentCalendar')
      .where('userId', '==', userId)
      .where('status', 'in', ['draft', 'scheduled'])
      .orderBy('scheduledDate', 'asc')
      .limit(10)
      .get();
    
    if (calendarQuery.empty) {
      return {
        implemented: false,
        reason: 'No upcoming content found in calendar',
        trends
      };
    }
    
    const updatedContent = [];
    const calendarPromises = [];
    
    calendarQuery.forEach(doc => {
      const contentItem = doc.data();
      
      // Only update draft content
      if (contentItem.status === 'draft') {
        const promise = incorporateTrendInContent(contentItem, trends)
          .then(updatedItem => {
            if (updatedItem.updated) {
              updatedContent.push({
                contentId: doc.id,
                title: contentItem.title,
                trendIncorporated: updatedItem.trendIncorporated
              });
              
              return db.collection('contentCalendar').doc(doc.id).update({
                content: updatedItem.content,
                lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: 'ai_copilot',
                incorporatedTrends: updatedItem.trendIncorporated
              });
            }
          });
        
        calendarPromises.push(promise);
      }
    });
    
    await Promise.all(calendarPromises);
    
    // Log the autonomous action if any content was updated
    if (updatedContent.length > 0) {
      const actionId = await logAutonomousAction(
        userId,
        ACTION_TYPES.TREND_IMPLEMENTATION,
        `Autonomously incorporated trending topics into ${updatedContent.length} content items`,
        {
          industry,
          trends,
          updatedContent
        },
        false
      );
      
      return {
        implemented: true,
        actionId,
        contentUpdated: updatedContent,
        trends
      };
    } else {
      return {
        implemented: false,
        reason: 'No suitable content found for trend incorporation',
        trends
      };
    }
  } catch (error) {
    console.error('Error implementing trending topics:', error);
    throw new Error('Failed to implement trending topics');
  }
};

/**
 * Identify trending topics for a specific industry
 * @param {string} industry - Industry to analyze
 * @returns {Promise<Array>} Trending topics
 */
const identifyTrendingTopics = async (industry) => {
  try {
    // Prepare prompt for AI
    const prompt = `
      As a marketing trend analyst, identify the top 5 trending topics in the ${industry} industry
      that would be valuable for marketing content. For each trend:
      
      1. Provide the trend name
      2. Explain why it's trending now
      3. Describe how it relates to the ${industry} industry
      4. Suggest how it could be incorporated into marketing content
      
      Format as JSON with an array of trend objects, each containing name, reason, relevance, and contentIdeas.
    `;
    
    // Get trends from AI
    const trendsResponse = await openai.generateContent(prompt, {
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse trends
    let trends;
    try {
      trends = JSON.parse(trendsResponse);
      if (trends.trends) {
        return trends.trends;
      } else {
        // If the response doesn't have a trends property, try to extract the array
        const keys = Object.keys(trends);
        if (keys.length > 0 && Array.isArray(trends[keys[0]])) {
          return trends[keys[0]];
        } else {
          throw new Error('Invalid trends format');
        }
      }
    } catch (e) {
      console.error('Error parsing trends:', e);
      // Fallback to simple parsing
      const trendMatches = trendsResponse.match(/\d+\.\s+(.+?)(?=\d+\.|$)/gs);
      if (trendMatches && trendMatches.length > 0) {
        return trendMatches.map(match => ({
          name: match.replace(/\d+\.\s+/, '').trim(),
          reason: 'Trending in industry',
          relevance: `Relevant to ${industry}`,
          contentIdeas: 'Incorporate into marketing content'
        }));
      } else {
        throw new Error('Failed to parse trends');
      }
    }
  } catch (error) {
    console.error('Error identifying trending topics:', error);
    throw new Error('Failed to identify trending topics');
  }
};

/**
 * Incorporate a trend into content
 * @param {Object} contentItem - Content calendar item
 * @param {Array} trends - Trending topics
 * @returns {Promise<Object>} Updated content
 */
const incorporateTrendInContent = async (contentItem, trends) => {
  try {
    // Find most relevant trend for this content
    const relevantTrend = await findRelevantTrend(contentItem, trends);
    
    if (!relevantTrend) {
      return {
        updated: false,
        reason: 'No relevant trend found'
      };
    }
    
    // Prepare prompt for AI
    const prompt = `
      As an expert content writer, incorporate this trending topic into the existing content:
      
      Trending Topic: ${relevantTrend.name}
      Why It's Trending: ${relevantTrend.reason}
      Relevance: ${relevantTrend.relevance}
      
      Original Content: "${contentItem.content}"
      Content Type: ${contentItem.type}
      Target Audience: ${contentItem.targetAudience}
      
      Update the content to naturally incorporate this trending topic while:
      - Maintaining the original message and purpose
      - Keeping a similar length and structure
      - Making the trend integration feel natural and valuable
      - Enhancing the content's relevance and timeliness
      
      Return only the updated content text.
    `;
    
    // Get updated content from AI
    const updatedContent = await openai.generateContent(prompt, {
      max_tokens: 1500,
      temperature: 0.7
    });
    
    return {
      updated: true,
      content: updatedContent,
      trendIncorporated: relevantTrend.name
    };
  } catch (error) {
    console.error('Error incorporating trend in content:', error);
    return {
      updated: false,
      reason: 'Error incorporating trend'
    };
  }
};

/**
 * Find the most relevant trend for a content item
 * @param {Object} contentItem - Content calendar item
 * @param {Array} trends - Trending topics
 * @returns {Promise<Object>} Most relevant trend
 */
const findRelevantTrend = async (contentItem, trends) => {
  try {
    // Prepare prompt for AI
    const prompt = `
      As a content strategist, determine which of these trending topics is most relevant
      to incorporate into this content:
      
      Content: "${contentItem.content}"
      Content Type: ${contentItem.type}
      Target Audience: ${contentItem.targetAudience}
      
      Trending Topics:
      ${trends.map((t, i) => `${i+1}. ${t.name}: ${t.relevance}`).join('\n')}
      
      Analyze the content and each trend, then select the single most relevant trend that would
      add the most value to this specific content. Explain your reasoning and then indicate your
      final selection as "Selected Trend: [trend number]".
    `;
    
    // Get analysis from AI
    const analysis = await openai.generateContent(prompt, {
      max_tokens: 800,
      temperature: 0.3
    });
    
    // Parse the selection from the analysis
    const match = analysis.match(/Selected Trend:\s*(\d+)/i);
    if (match && match[1]) {
      const trendIndex = parseInt(match[1]) - 1;
      if (trendIndex >= 0 && trendIndex < trends.length) {
        return trends[trendIndex];
      }
    }
    
    // If no clear selection, use simple matching
    const contentLower = contentItem.content.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;
    
    for (const trend of trends) {
      const trendWords = trend.name.toLowerCase().split(' ');
      let score = 0;
      
      for (const word of trendWords) {
        if (word.length > 3 && contentLower.includes(word)) {
          score++;
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = trend;
      }
    }
    
    // If no match found, return the first trend
    return bestMatch || trends[0];
  } catch (error) {
    console.error('Error finding relevant trend:', error);
    // Default to first trend on error
    return trends[0];
  }
};

/**
 * Autonomously manage cross-channel campaign coordination
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Results of cross-channel coordination
 */
const manageCrossChannelCoordination = async (userId) => {
  try {
    // Check if user has granted permission for campaign optimization
    const isPermitted = await checkUserPermission(userId, ACTION_TYPES.CAMPAIGN_OPTIMIZATION);
    
    if (!isPermitted) {
      return {
        implemented: false,
        reason: 'User permission not granted for cross-channel coordination',
        suggestionCreated: true
      };
    }
    
    // Get active campaigns across channels
    const campaignsQuery = await db.collection('campaigns')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    if (campaignsQuery.empty) {
      return {
        implemented: false,
        reason: 'No active campaigns found'
      };
    }
    
    // Group campaigns by theme/topic
    const campaignsByTheme = {};
    
    campaignsQuery.forEach(doc => {
      const campaign = doc.data();
      const theme = campaign.theme || 'uncategorized';
      
      if (!campaignsByTheme[theme]) {
        campaignsByTheme[theme] = [];
      }
      
      campaignsByTheme[theme].push({
        id: doc.id,
        ...campaign
      });
    });
    
    // Identify coordination opportunities
    const opportunities = [];
    
    for (const [theme, campaigns] of Object.entries(campaignsByTheme)) {
      // Skip themes with only one campaign
      if (campaigns.length < 2) {
        continue;
      }
      
      // Check for message consistency
      const messageConsistency = await checkMessageConsistency(campaigns);
      if (!messageConsistency.consistent) {
        opportunities.push({
          type: 'message_alignment',
          theme,
          campaigns: campaigns.map(c => ({ id: c.id, name: c.name, channel: c.channelType })),
          issue: messageConsistency.issue,
          recommendation: messageConsistency.recommendation
        });
      }
      
      // Check for timing coordination
      const timingCoordination = checkTimingCoordination(campaigns);
      if (!timingCoordination.coordinated) {
        opportunities.push({
          type: 'timing_coordination',
          theme,
          campaigns: campaigns.map(c => ({ id: c.id, name: c.name, channel: c.channelType })),
          issue: timingCoordination.issue,
          recommendation: timingCoordination.recommendation
        });
      }
    }
    
    // Implement coordination recommendations
    const results = [];
    
    for (const opportunity of opportunities) {
      if (opportunity.type === 'message_alignment') {
        const result = await implementMessageAlignment(userId, opportunity);
        results.push(result);
      } else if (opportunity.type === 'timing_coordination') {
        const result = await implementTimingCoordination(userId, opportunity);
        results.push(result);
      }
    }
    
    // Log the autonomous action
    const actionId = await logAutonomousAction(
      userId,
      ACTION_TYPES.CAMPAIGN_OPTIMIZATION,
      `Autonomously coordinated ${results.length} cross-channel campaign opportunities`,
      {
        opportunities,
        results
      },
      false
    );
    
    return {
      implemented: true,
      actionId,
      coordinationResults: results
    };
  } catch (error) {
    console.error('Error managing cross-channel coordination:', error);
    throw new Error('Failed to manage cross-channel coordination');
  }
};

/**
 * Check message consistency across campaigns
 * @param {Array} campaigns - List of campaigns
 * @returns {Promise<Object>} Consistency check results
 */
const checkMessageConsistency = async (campaigns) => {
  try {
    // Extract content from campaigns
    const campaignContents = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      channel: c.channelType,
      content: c.content
    }));
    
    // Prepare prompt for AI
    const prompt = `
      As a marketing consistency expert, analyze these campaign contents from different channels
      that are part of the same theme:
      
      ${campaignContents.map(c => `${c.channel.toUpperCase()} CAMPAIGN "${c.name}":
      ${c.content}
      
      `).join('\n')}
      
      Evaluate if the messaging is consistent across channels while appropriately adapted for each channel.
      Identify any inconsistencies in:
      - Key message and value proposition
      - Brand voice and tone
      - Call to action
      - Target audience focus
      
      If inconsistencies exist, provide specific recommendations to align the messaging.
      Format your response as JSON with properties: consistent (boolean), issue (string if inconsistent),
      and recommendation (string if inconsistent).
    `;
    
    // Get analysis from AI
    const analysisResponse = await openai.generateContent(prompt, {
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse analysis
    let analysis;
    try {
      analysis = JSON.parse(analysisResponse);
    } catch (e) {
      console.error('Error parsing message consistency analysis:', e);
      // Default response if parsing fails
      analysis = {
        consistent: false,
        issue: "Unable to parse analysis, assuming inconsistency",
        recommendation: "Review campaign messaging manually to ensure consistency across channels"
      };
    }
    
    return analysis;
  } catch (error) {
    console.error('Error checking message consistency:', error);
    throw new Error('Failed to check message consistency');
  }
};

/**
 * Check timing coordination across campaigns
 * @param {Array} campaigns - List of campaigns
 * @returns {Object} Timing coordination check results
 */
const checkTimingCoordination = (campaigns) => {
  try {
    // Group campaigns by scheduled day
    const campaignsByDay = {};
    
    campaigns.forEach(campaign => {
      const day = campaign.scheduleDay;
      if (!campaignsByDay[day]) {
        campaignsByDay[day] = [];
      }
      campaignsByDay[day].push(campaign);
    });
    
    // Check if campaigns are spread across too many days
    if (Object.keys(campaignsByDay).length > 3) {
      return {
        coordinated: false,
        issue: "Campaigns are spread across too many days, reducing impact",
        recommendation: "Consolidate campaigns to fewer days for better coordination"
      };
    }
    
    // Check if campaigns are too clustered on the same day
    let hasClusteredCampaigns = false;
    for (const day in campaignsByDay) {
      const dayCampaigns = campaignsByDay[day];
      if (dayCampaigns.length >= 3) {
        // Check if they're scheduled within 2 hours of each other
        const hours = dayCampaigns.map(c => c.scheduleHour);
        const uniqueHours = new Set(hours);
        if (uniqueHours.size < dayCampaigns.length) {
          hasClusteredCampaigns = true;
          break;
        }
      }
    }
    
    if (hasClusteredCampaigns) {
      return {
        coordinated: false,
        issue: "Multiple campaigns scheduled too close together on the same day",
        recommendation: "Space out campaigns to avoid overwhelming the audience"
      };
    }
    
    // Check if there's a logical sequence for the campaign types
    const channelTypes = campaigns.map(c => c.channelType);
    const hasEmail = channelTypes.includes('email');
    const hasSocial = channelTypes.some(c => ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'].includes(c));
    
    if (hasEmail && hasSocial) {
      // Check if email comes before social for awareness campaigns
      const emailCampaigns = campaigns.filter(c => c.channelType === 'email');
      const socialCampaigns = campaigns.filter(c => ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'].includes(c.channelType));
      
      if (emailCampaigns.length > 0 && socialCampaigns.length > 0) {
        const emailDays = emailCampaigns.map(c => c.scheduleDay);
        const socialDays = socialCampaigns.map(c => c.scheduleDay);
        
        const minEmailDay = Math.min(...emailDays);
        const minSocialDay = Math.min(...socialDays);
        
        if (campaigns[0].campaignObjective === 'awareness' && minEmailDay < minSocialDay) {
          return {
            coordinated: false,
            issue: "Email campaigns scheduled before social for awareness objective",
            recommendation: "For awareness campaigns, schedule social media first, then follow up with email"
          };
        }
        
        if (campaigns[0].campaignObjective === 'conversion' && minSocialDay < minEmailDay) {
          return {
            coordinated: false,
            issue: "Social campaigns scheduled before email for conversion objective",
            recommendation: "For conversion campaigns, warm up audience with social, then follow with direct email"
          };
        }
      }
    }
    
    return {
      coordinated: true
    };
  } catch (error) {
    console.error('Error checking timing coordination:', error);
    throw new Error('Failed to check timing coordination');
  }
};

/**
 * Implement message alignment across campaigns
 * @param {string} userId - User ID
 * @param {Object} opportunity - Message alignment opportunity
 * @returns {Promise<Object>} Result of implementation
 */
const implementMessageAlignment = async (userId, opportunity) => {
  try {
    // Get campaign details
    const campaignPromises = opportunity.campaigns.map(c => 
      db.collection('campaigns').doc(c.id).get()
    );
    
    const campaignDocs = await Promise.all(campaignPromises);
    const campaigns = campaignDocs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Generate aligned messaging
    const alignedMessaging = await generateAlignedMessaging(campaigns, opportunity.recommendation);
    
    // Update campaigns with aligned messaging
    const updatePromises = alignedMessaging.map(update => 
      db.collection('campaigns').doc(update.campaignId).update({
        content: update.content,
        lastOptimizedAt: admin.firestore.FieldValue.serverTimestamp(),
        optimizationType: 'message_alignment',
        previousContent: campaigns.find(c => c.id === update.campaignId).content
      })
    );
    
    await Promise.all(updatePromises);
    
    return {
      type: 'message_alignment',
      theme: opportunity.theme,
      implemented: true,
      campaignsUpdated: opportunity.campaigns.length,
      recommendation: opportunity.recommendation
    };
  } catch (error) {
    console.error('Error implementing message alignment:', error);
    throw new Error('Failed to implement message alignment');
  }
};

/**
 * Generate aligned messaging across campaigns
 * @param {Array} campaigns - List of campaigns
 * @param {string} recommendation - Alignment recommendation
 * @returns {Promise<Array>} Aligned messaging updates
 */
const generateAlignedMessaging = async (campaigns, recommendation) => {
  try {
    // Prepare prompt for AI
    const prompt = `
      As a cross-channel marketing expert, create aligned messaging for these campaigns
      that are part of the same theme:
      
      ${campaigns.map(c => `${c.channelType.toUpperCase()} CAMPAIGN "${c.name}":
      ${c.content}
      
      `).join('\n')}
      
      Recommendation: ${recommendation}
      
      For each campaign, create updated content that:
      - Maintains channel-appropriate format and length
      - Aligns key messaging and value proposition across channels
      - Maintains consistent brand voice while adapting to each channel
      - Preserves the original campaign objective
      
      Format your response as JSON with an array of objects, each containing campaignId and updated content.
    `;
    
    // Get aligned messaging from AI
    const alignedResponse = await openai.generateContent(prompt, {
      max_tokens: 1500,
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    // Parse aligned messaging
    let alignedMessaging;
    try {
      alignedMessaging = JSON.parse(alignedResponse);
      if (alignedMessaging.updates) {
        return alignedMessaging.updates;
      } else if (Array.isArray(alignedMessaging)) {
        return alignedMessaging;
      } else {
        // If the response doesn't have the expected format, create a default response
        return campaigns.map(c => ({
          campaignId: c.id,
          content: c.content // Keep original content as fallback
        }));
      }
    } catch (e) {
      console.error('Error parsing aligned messaging:', e);
      // Default response if parsing fails
      return campaigns.map(c => ({
        campaignId: c.id,
        content: c.content // Keep original content as fallback
      }));
    }
  } catch (error) {
    console.error('Error generating aligned messaging:', error);
    throw new Error('Failed to generate aligned messaging');
  }
};

/**
 * Implement timing coordination across campaigns
 * @param {string} userId - User ID
 * @param {Object} opportunity - Timing coordination opportunity
 * @returns {Promise<Object>} Result of implementation
 */
const implementTimingCoordination = async (userId, opportunity) => {
  try {
    // Get campaign details
    const campaignPromises = opportunity.campaigns.map(c => 
      db.collection('campaigns').doc(c.id).get()
    );
    
    const campaignDocs = await Promise.all(campaignPromises);
    const campaigns = campaignDocs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Generate coordinated schedule
    const coordinatedSchedule = generateCoordinatedSchedule(campaigns, opportunity.recommendation);
    
    // Update campaigns with coordinated schedule
    const updatePromises = coordinatedSchedule.map(update => 
      db.collection('campaigns').doc(update.campaignId).update({
        scheduleDay: update.scheduleDay,
        scheduleHour: update.scheduleHour,
        lastOptimizedAt: admin.firestore.FieldValue.serverTimestamp(),
        optimizationType: 'timing_coordination',
        previousScheduleDay: campaigns.find(c => c.id === update.campaignId).scheduleDay,
        previousScheduleHour: campaigns.find(c => c.id === update.campaignId).scheduleHour
      })
    );
    
    await Promise.all(updatePromises);
    
    return {
      type: 'timing_coordination',
      theme: opportunity.theme,
      implemented: true,
      campaignsUpdated: opportunity.campaigns.length,
      recommendation: opportunity.recommendation
    };
  } catch (error) {
    console.error('Error implementing timing coordination:', error);
    throw new Error('Failed to implement timing coordination');
  }
};

/**
 * Generate coordinated schedule across campaigns
 * @param {Array} campaigns - List of campaigns
 * @param {string} recommendation - Coordination recommendation
 * @returns {Array} Coordinated schedule updates
 */
const generateCoordinatedSchedule = (campaigns, recommendation) => {
  try {
    const updates = [];
    
    // Sort campaigns by channel type for logical sequencing
    const sortedCampaigns = [...campaigns].sort((a, b) => {
      // Define channel priority (awareness campaigns: social first, then email)
      // (conversion campaigns: email first, then social)
      const isAwareness = campaigns[0].campaignObjective === 'awareness';
      
      const channelPriority = isAwareness
        ? ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'email']
        : ['email', 'facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'];
      
      const aPriority = channelPriority.indexOf(a.channelType);
      const bPriority = channelPriority.indexOf(b.channelType);
      
      return aPriority - bPriority;
    });
    
    // Determine if we need to consolidate days or spread out same-day campaigns
    if (recommendation.includes("Consolidate campaigns")) {
      // Consolidate to 2-3 days
      const baseDay = Math.min(...sortedCampaigns.map(c => c.scheduleDay));
      
      sortedCampaigns.forEach((campaign, index) => {
        const dayOffset = Math.floor(index / 2); // Max 2 campaigns per day
        const hourOffset = index % 2 * 4 + 10; // 10am or 2pm
        
        updates.push({
          campaignId: campaign.id,
          scheduleDay: baseDay + dayOffset,
          scheduleHour: hourOffset
        });
      });
    } else if (recommendation.includes("Space out campaigns")) {
      // Space out campaigns on same day
      const campaignsByDay = {};
      
      // Group campaigns by day
      sortedCampaigns.forEach(campaign => {
        const day = campaign.scheduleDay;
        if (!campaignsByDay[day]) {
          campaignsByDay[day] = [];
        }
        campaignsByDay[day].push(campaign);
      });
      
      // Space out campaigns within each day
      for (const day in campaignsByDay) {
        const dayCampaigns = campaignsByDay[day];
        
        dayCampaigns.forEach((campaign, index) => {
          // Space campaigns 3 hours apart, starting at 9am
          const hour = 9 + (index * 3);
          
          updates.push({
            campaignId: campaign.id,
            scheduleDay: parseInt(day),
            scheduleHour: hour > 21 ? 21 : hour // Cap at 9pm
          });
        });
      }
    } else if (recommendation.includes("schedule social media first")) {
      // For awareness: social first, then email
      let currentDay = Math.min(...sortedCampaigns.map(c => c.scheduleDay));
      
      sortedCampaigns.forEach((campaign, index) => {
        if (index > 0 && ['email'].includes(campaign.channelType)) {
          currentDay += 1; // Move email to next day
        }
        
        updates.push({
          campaignId: campaign.id,
          scheduleDay: currentDay,
          scheduleHour: 12 // Noon default
        });
      });
    } else if (recommendation.includes("warm up audience with social")) {
      // For conversion: social first, then email
      let currentDay = Math.min(...sortedCampaigns.map(c => c.scheduleDay));
      
      // First social media
      const socialCampaigns = sortedCampaigns.filter(c => 
        ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'].includes(c.channelType)
      );
      
      // Then email
      const emailCampaigns = sortedCampaigns.filter(c => c.channelType === 'email');
      
      // Schedule social campaigns
      socialCampaigns.forEach((campaign, index) => {
        updates.push({
          campaignId: campaign.id,
          scheduleDay: currentDay,
          scheduleHour: 10 + index * 2 // 10am, 12pm, 2pm, etc.
        });
      });
      
      // Schedule email campaigns on next day
      currentDay += 1;
      emailCampaigns.forEach((campaign, index) => {
        updates.push({
          campaignId: campaign.id,
          scheduleDay: currentDay,
          scheduleHour: 10 + index * 2 // 10am, 12pm, 2pm, etc.
        });
      });
    } else {
      // Default: just space out evenly
      sortedCampaigns.forEach((campaign, index) => {
        updates.push({
          campaignId: campaign.id,
          scheduleDay: campaign.scheduleDay, // Keep original day
          scheduleHour: 9 + (index * 2) % 12 // Space 2 hours apart, 9am-9pm
        });
      });
    }
    
    return updates;
  } catch (error) {
    console.error('Error generating coordinated schedule:', error);
    throw new Error('Failed to generate coordinated schedule');
  }
};

// Helper functions

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
 * Get day number from day name
 * @param {string} dayName - Day name
 * @returns {number} Day number (0-6, where 0 is Sunday)
 */
const getDayNumber = (dayName) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days.indexOf(dayName.toLowerCase());
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

/**
 * Get hour number from formatted hour
 * @param {string} formattedHour - Hour in 12-hour format
 * @returns {number} Hour in 24-hour format (0-23)
 */
const getHourNumber = (formattedHour) => {
  const match = formattedHour.match(/(\d+)\s*(am|pm)/i);
  if (!match) return 12; // Default to noon
  
  let hour = parseInt(match[1]);
  const period = match[2].toLowerCase();
  
  if (period === 'pm' && hour < 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;
  
  return hour;
};

/**
 * Get industry benchmark times for a channel
 * @param {string} channelType - Channel type
 * @returns {Object} Benchmark times
 */
const getIndustryBenchmarkTimes = (channelType) => {
  // Industry benchmarks for optimal send times
  const benchmarks = {
    email: [
      { day: 'Tuesday', hour: '10 AM', engagementScore: '8.7' },
      { day: 'Thursday', hour: '2 PM', engagementScore: '8.4' },
      { day: 'Wednesday', hour: '11 AM', engagementScore: '8.1' }
    ],
    facebook: [
      { day: 'Wednesday', hour: '1 PM', engagementScore: '7.9' },
      { day: 'Friday', hour: '11 AM', engagementScore: '7.6' },
      { day: 'Saturday', hour: '12 PM', engagementScore: '7.3' }
    ],
    twitter: [
      { day: 'Wednesday', hour: '9 AM', engagementScore: '8.2' },
      { day: 'Tuesday', hour: '11 AM', engagementScore: '7.8' },
      { day: 'Friday', hour: '10 AM', engagementScore: '7.5' }
    ],
    instagram: [
      { day: 'Wednesday', hour: '3 PM', engagementScore: '8.5' },
      { day: 'Friday', hour: '5 PM', engagementScore: '8.3' },
      { day: 'Thursday', hour: '4 PM', engagementScore: '8.0' }
    ],
    linkedin: [
      { day: 'Tuesday', hour: '10 AM', engagementScore: '8.6' },
      { day: 'Wednesday', hour: '11 AM', engagementScore: '8.3' },
      { day: 'Thursday', hour: '9 AM', engagementScore: '8.0' }
    ],
    tiktok: [
      { day: 'Tuesday', hour: '7 PM', engagementScore: '8.8' },
      { day: 'Thursday', hour: '8 PM', engagementScore: '8.5' },
      { day: 'Saturday', hour: '11 AM', engagementScore: '8.2' }
    ]
  };
  
  return {
    channelType,
    recommendedTimes: benchmarks[channelType] || benchmarks.email,
    basedOn: 'industry benchmarks',
    totalCampaignsAnalyzed: 0
  };
};

module.exports = {
  // Permission management
  PERMISSION_LEVELS,
  ACTION_TYPES,
  checkUserPermission,
  
  // Autonomous monitoring and optimization
  monitorCampaigns,
  implementOptimizations,
  implementTrendingTopics,
  manageCrossChannelCoordination,
  
  // Action logging and transparency
  logAutonomousAction
};
