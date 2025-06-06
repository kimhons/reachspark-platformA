/**
 * Omnichannel Personalization Engine
 * 
 * This module implements the Omnichannel Personalization Engine feature,
 * which delivers consistent, personalized experiences across all customer touchpoints.
 * 
 * The system uses advanced AI to unify customer data, create dynamic customer profiles,
 * and orchestrate personalized experiences across channels in real-time.
 */

const functions = require('firebase-functions');
const { openai, gemini } = require('../apis');
const admin = require('firebase-admin');
const { retryWithBackoff, ErrorTypes, ReachSparkError, logError } = require('../utils');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Channel types
 */
const CHANNEL_TYPES = {
  WEB: 'web',
  MOBILE_APP: 'mobile_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH_NOTIFICATION: 'push_notification',
  SOCIAL_MEDIA: 'social_media',
  CHATBOT: 'chatbot',
  CALL_CENTER: 'call_center',
  IN_STORE: 'in_store',
  DIRECT_MAIL: 'direct_mail',
  ADVERTISING: 'advertising',
  CUSTOM: 'custom'
};

/**
 * Personalization types
 */
const PERSONALIZATION_TYPES = {
  CONTENT: 'content',
  PRODUCT_RECOMMENDATIONS: 'product_recommendations',
  OFFERS: 'offers',
  MESSAGING: 'messaging',
  TIMING: 'timing',
  CHANNEL_SELECTION: 'channel_selection',
  CREATIVE: 'creative',
  JOURNEY: 'journey',
  CUSTOM: 'custom'
};

/**
 * Customer profile fields
 */
const PROFILE_FIELDS = {
  DEMOGRAPHICS: 'demographics',
  PREFERENCES: 'preferences',
  BEHAVIORS: 'behaviors',
  PURCHASE_HISTORY: 'purchase_history',
  ENGAGEMENT_HISTORY: 'engagement_history',
  CONTENT_AFFINITY: 'content_affinity',
  PRODUCT_AFFINITY: 'product_affinity',
  CHANNEL_AFFINITY: 'channel_affinity',
  LIFECYCLE_STAGE: 'lifecycle_stage',
  CUSTOM_ATTRIBUTES: 'custom_attributes'
};

/**
 * Create or update unified customer profile
 * @param {string} customerId - Customer ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Updated profile
 */
const updateCustomerProfile = async (customerId, profileData) => {
  const functionName = 'updateCustomerProfile';
  const context = { customerId };
  
  try {
    // Validate required fields
    if (!customerId) {
      throw new ReachSparkError(
        'Missing required customer ID',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Get existing profile with retry
    const getProfileData = async () => {
      try {
        const profileRef = db.collection('customerProfiles').doc(customerId);
        const profileDoc = await profileRef.get();
        
        if (!profileDoc.exists) {
          // Create new profile
          const newProfile = {
            customerId,
            ...profileData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          await profileRef.set(newProfile);
          
          return {
            customerId,
            ...newProfile,
            isNewProfile: true
          };
        } else {
          // Update existing profile
          const existingProfile = profileDoc.data();
          const updatedProfile = {
            ...existingProfile,
            ...profileData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          await profileRef.update(updatedProfile);
          
          return {
            ...updatedProfile,
            isNewProfile: false
          };
        }
      } catch (error) {
        throw new ReachSparkError(
          `Failed to update customer profile: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    return await retryWithBackoff(
      getProfileData,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof ReachSparkError)) {
      error = new ReachSparkError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to update customer profile: ${error.message}`);
  }
};

/**
 * Generate personalized content for a specific channel
 * @param {string} customerId - Customer ID
 * @param {string} channelType - Channel type from CHANNEL_TYPES
 * @param {string} personalizationType - Personalization type from PERSONALIZATION_TYPES
 * @param {Object} options - Additional options for personalization
 * @returns {Promise<Object>} Personalized content
 */
const generatePersonalizedContent = async (customerId, channelType, personalizationType, options = {}) => {
  const functionName = 'generatePersonalizedContent';
  const context = { customerId, channelType, personalizationType, options };
  
  try {
    // Validate inputs
    if (!customerId) {
      throw new ReachSparkError(
        'Missing required customer ID',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    if (!Object.values(CHANNEL_TYPES).includes(channelType)) {
      throw new ReachSparkError(
        `Invalid channel type: ${channelType}`,
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    if (!Object.values(PERSONALIZATION_TYPES).includes(personalizationType)) {
      throw new ReachSparkError(
        `Invalid personalization type: ${personalizationType}`,
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Get customer profile with retry
    const getCustomerProfile = async () => {
      try {
        const profileRef = db.collection('customerProfiles').doc(customerId);
        const profileDoc = await profileRef.get();
        
        if (!profileDoc.exists) {
          throw new ReachSparkError(
            `Customer profile not found for ID: ${customerId}`,
            ErrorTypes.NOT_FOUND_ERROR,
            null,
            context
          );
        }
        
        return profileDoc.data();
      } catch (error) {
        if (error instanceof ReachSparkError) {
          throw error;
        }
        
        throw new ReachSparkError(
          `Failed to retrieve customer profile: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const customerProfile = await retryWithBackoff(
      getCustomerProfile,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Get personalization model with retry
    const getPersonalizationModel = async () => {
      try {
        const modelQuery = await db.collection('personalizationModels')
          .where('channelType', '==', channelType)
          .where('personalizationType', '==', personalizationType)
          .where('isActive', '==', true)
          .limit(1)
          .get();
        
        if (modelQuery.empty) {
          throw new ReachSparkError(
            `No active personalization model found for channel ${channelType} and type ${personalizationType}`,
            ErrorTypes.NOT_FOUND_ERROR,
            null,
            context
          );
        }
        
        return modelQuery.docs[0].data();
      } catch (error) {
        if (error instanceof ReachSparkError) {
          throw error;
        }
        
        throw new ReachSparkError(
          `Failed to retrieve personalization model: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const personalizationModel = await retryWithBackoff(
      getPersonalizationModel,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Generate personalized content using AI with retry
    const generateContent = async () => {
      try {
        // Prepare prompt for AI
        const prompt = `
          As an expert in personalized marketing, create personalized ${personalizationType} for a customer with the following profile:
          
          Demographics: ${JSON.stringify(customerProfile[PROFILE_FIELDS.DEMOGRAPHICS] || {})}
          Preferences: ${JSON.stringify(customerProfile[PROFILE_FIELDS.PREFERENCES] || {})}
          Behaviors: ${JSON.stringify(customerProfile[PROFILE_FIELDS.BEHAVIORS] || {})}
          Content Affinity: ${JSON.stringify(customerProfile[PROFILE_FIELDS.CONTENT_AFFINITY] || {})}
          Product Affinity: ${JSON.stringify(customerProfile[PROFILE_FIELDS.PRODUCT_AFFINITY] || {})}
          Channel Affinity: ${JSON.stringify(customerProfile[PROFILE_FIELDS.CHANNEL_AFFINITY] || {})}
          Lifecycle Stage: ${customerProfile[PROFILE_FIELDS.LIFECYCLE_STAGE] || 'unknown'}
          
          Channel: ${channelType}
          Personalization Type: ${personalizationType}
          Additional Options: ${JSON.stringify(options)}
          
          Based on this information, generate personalized content that will resonate with this customer.
          Format the response as a JSON object with the following structure:
          {
            "content": "The personalized content",
            "reasoning": "Explanation of why this content is personalized for this customer",
            "expectedOutcome": "Expected customer response or action",
            "metadata": {
              "key1": "value1",
              "key2": "value2"
            }
          }
        `;
        
        // Select AI model based on personalization model configuration
        const aiModel = personalizationModel.preferredAiModel || 'openai';
        let aiResponse;
        
        switch (aiModel) {
          case 'gemini':
            aiResponse = await gemini.generateContent(prompt, {
              temperature: 0.7,
              max_tokens: 1000
            });
            break;
          default: // openai
            aiResponse = await openai.generateContent(prompt, {
              temperature: 0.7,
              max_tokens: 1000
            });
        }
        
        // Parse AI response
        const parsedResponse = JSON.parse(aiResponse);
        
        return {
          ...parsedResponse,
          channelType,
          personalizationType,
          customerId,
          timestamp: new Date().toISOString(),
          modelId: personalizationModel.id
        };
      } catch (error) {
        throw new ReachSparkError(
          `Failed to generate personalized content: ${error.message}`,
          ErrorTypes.AI_SERVICE_ERROR,
          error,
          context
        );
      }
    };
    
    const personalizedContent = await retryWithBackoff(
      generateContent,
      3,
      500,
      (error) => error.type === ErrorTypes.AI_SERVICE_ERROR
    );
    
    // Store personalization result with retry
    const storeResult = async () => {
      try {
        await db.collection('personalizationResults').add({
          customerId,
          channelType,
          personalizationType,
          content: personalizedContent,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          options
        });
      } catch (error) {
        throw new ReachSparkError(
          `Failed to store personalization result: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          { ...context, personalizedContent }
        );
      }
    };
    
    await retryWithBackoff(
      storeResult,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    return personalizedContent;
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof ReachSparkError)) {
      error = new ReachSparkError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to generate personalized content: ${error.message}`);
  }
};

/**
 * Track customer interaction with personalized content
 * @param {string} customerId - Customer ID
 * @param {string} resultId - Personalization result ID
 * @param {string} interactionType - Type of interaction (view, click, convert, etc.)
 * @param {Object} interactionData - Additional interaction data
 * @returns {Promise<Object>} Tracked interaction
 */
const trackPersonalizationInteraction = async (customerId, resultId, interactionType, interactionData = {}) => {
  const functionName = 'trackPersonalizationInteraction';
  const context = { customerId, resultId, interactionType, interactionData };
  
  try {
    // Validate inputs
    if (!customerId || !resultId || !interactionType) {
      throw new ReachSparkError(
        'Missing required parameters',
        ErrorTypes.VALIDATION_ERROR,
        null,
        context
      );
    }
    
    // Store interaction with retry
    const storeInteraction = async () => {
      try {
        const interactionRef = await db.collection('personalizationInteractions').add({
          customerId,
          resultId,
          interactionType,
          interactionData,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return {
          id: interactionRef.id,
          customerId,
          resultId,
          interactionType,
          interactionData,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new ReachSparkError(
          `Failed to store interaction: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    const interaction = await retryWithBackoff(
      storeInteraction,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    // Update customer profile with interaction data
    const updateProfile = async () => {
      try {
        const profileRef = db.collection('customerProfiles').doc(customerId);
        const profileDoc = await profileRef.get();
        
        if (!profileDoc.exists) {
          throw new ReachSparkError(
            `Customer profile not found for ID: ${customerId}`,
            ErrorTypes.NOT_FOUND_ERROR,
            null,
            context
          );
        }
        
        // Get personalization result
        const resultDoc = await db.collection('personalizationResults').doc(resultId).get();
        
        if (!resultDoc.exists) {
          throw new ReachSparkError(
            `Personalization result not found for ID: ${resultId}`,
            ErrorTypes.NOT_FOUND_ERROR,
            null,
            context
          );
        }
        
        const result = resultDoc.data();
        
        // Update profile with interaction data
        await profileRef.update({
          [`${PROFILE_FIELDS.ENGAGEMENT_HISTORY}.${result.channelType}`]: admin.firestore.FieldValue.arrayUnion({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            interactionType,
            personalizationType: result.personalizationType,
            resultId
          }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        if (error instanceof ReachSparkError) {
          throw error;
        }
        
        throw new ReachSparkError(
          `Failed to update customer profile with interaction: ${error.message}`,
          ErrorTypes.DATABASE_ERROR,
          error,
          context
        );
      }
    };
    
    await retryWithBackoff(
      updateProfile,
      3,
      300,
      (error) => error.type === ErrorTypes.DATABASE_ERROR
    );
    
    return interaction;
  } catch (error) {
    // Handle and log any errors
    if (!(error instanceof ReachSparkError)) {
      error = new ReachSparkError(
        `Unexpected error in ${functionName}: ${error.message}`,
        ErrorTypes.UNKNOWN_ERROR,
        error,
        context
      );
    }
    
    await logError(error, functionName, context);
    
    // Rethrow with clean user-facing message
    throw new Error(`Failed to track personalization interaction: ${error.message}`);
  }
};

module.exports = {
  CHANNEL_TYPES,
  PERSONALIZATION_TYPES,
  PROFILE_FIELDS,
  updateCustomerProfile,
  generatePersonalizedContent,
  trackPersonalizationInteraction
};
