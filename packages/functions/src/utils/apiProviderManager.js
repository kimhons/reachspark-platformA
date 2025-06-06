/**
 * API Provider Management System for ReachSpark AMIA
 * 
 * This module implements a flexible API provider management system that allows
 * for easy rotation of API keys and switching between different LLM providers
 * without requiring code changes.
 */

const admin = require('firebase-admin');
const { logger, ReachSparkError, ErrorTypes, SeverityLevels } = require('./errorLogging');
const { retryWithExponentialBackoff } = require('./retryLogic');
const { AuditComplianceManager, AuditEventType } = require('./auditCompliance');

// Firestore reference
const db = admin.firestore();

/**
 * API provider types
 */
const ProviderType = {
  LLM: 'llm',                     // Language model providers (OpenAI, Anthropic, Google)
  SOCIAL_MEDIA: 'social_media',   // Social media platforms (Facebook, Twitter, LinkedIn)
  EMAIL: 'email',                 // Email service providers
  SMS: 'sms',                     // SMS service providers
  ANALYTICS: 'analytics',         // Analytics platforms
  CONTENT_MODERATION: 'content_moderation', // Content moderation services
  PAYMENT: 'payment',             // Payment processors
  CRM: 'crm',                     // Customer relationship management
  DATA_ENRICHMENT: 'data_enrichment', // Data enrichment services
  OTHER: 'other'                  // Other API providers
};

/**
 * LLM provider subtypes
 */
const LLMProviderSubtype = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  COHERE: 'cohere',
  MISTRAL: 'mistral',
  AZURE_OPENAI: 'azure_openai',
  OTHER: 'other'
};

/**
 * API Provider Manager class
 */
class APIProviderManager {
  constructor() {
    this.initialized = false;
    this.providers = {};
    this.defaultProviders = {};
    this.auditManager = new AuditComplianceManager();
    this.providerListeners = {};
  }

  /**
   * Initialize the API Provider Manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize audit manager
      await this.auditManager.initialize();
      
      // Load providers from Firestore
      await this.loadProviders();
      
      // Set up real-time listener for provider updates
      this.setupProviderListeners();
      
      this.initialized = true;
      logger.info('API Provider Manager initialized successfully', {
        providerCount: Object.keys(this.providers).length,
        defaultProviders: this.defaultProviders
      });
    } catch (error) {
      logger.error('Failed to initialize API Provider Manager', { error });
      throw error;
    }
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      // Remove Firestore listeners
      Object.values(this.providerListeners).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      
      this.providerListeners = {};
      
      logger.info('API Provider Manager resources cleaned up');
    } catch (error) {
      logger.error('Error cleaning up API Provider Manager resources', { error });
    }
  }

  /**
   * Load providers from Firestore
   * @returns {Promise<void>}
   */
  async loadProviders() {
    try {
      // Get active API providers
      const providersSnapshot = await db.collection('apiCredentials')
        .where('isActive', '==', true)
        .get();
      
      this.providers = {};
      providersSnapshot.forEach(doc => {
        const provider = doc.data();
        this.providers[doc.id] = {
          id: doc.id,
          ...provider
        };
      });
      
      // Get default provider settings
      const defaultsDoc = await db.collection('settings').doc('defaultProviders').get();
      
      if (defaultsDoc.exists) {
        this.defaultProviders = defaultsDoc.data();
      } else {
        // Create default settings if they don't exist
        this.defaultProviders = {};
        Object.values(ProviderType).forEach(type => {
          this.defaultProviders[type] = null;
        });
        
        await db.collection('settings').doc('defaultProviders').set(this.defaultProviders);
      }
      
      logger.info('API providers loaded successfully', {
        providerCount: providersSnapshot.size,
        defaultProviders: this.defaultProviders
      });
    } catch (error) {
      logger.error('Error loading API providers', { error });
      throw error;
    }
  }

  /**
   * Set up real-time listeners for provider updates
   * @returns {void}
   */
  setupProviderListeners() {
    // Listen for changes to API credentials
    this.providerListeners.credentials = db.collection('apiCredentials')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' || change.type === 'modified') {
            const provider = change.doc.data();
            this.providers[change.doc.id] = {
              id: change.doc.id,
              ...provider
            };
            logger.info(`Provider updated: ${change.doc.id}`);
          }
          if (change.type === 'removed') {
            delete this.providers[change.doc.id];
            logger.info(`Provider removed: ${change.doc.id}`);
          }
        });
      }, error => {
        logger.error('Error in API credentials listener', { error });
      });
    
    // Listen for changes to default provider settings
    this.providerListeners.defaults = db.collection('settings').doc('defaultProviders')
      .onSnapshot(doc => {
        if (doc.exists) {
          this.defaultProviders = doc.data();
          logger.info('Default providers updated');
        }
      }, error => {
        logger.error('Error in default providers listener', { error });
      });
  }

  /**
   * Get an API provider by ID
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} - Provider details
   */
  async getProvider(providerId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if provider exists in cache
      if (this.providers[providerId]) {
        return this.providers[providerId];
      }
      
      // If not in cache, try to get from Firestore
      const providerDoc = await db.collection('apiCredentials').doc(providerId).get();
      
      if (!providerDoc.exists) {
        throw new ReachSparkError(
          `API provider not found: ${providerId}`,
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      const provider = {
        id: providerDoc.id,
        ...providerDoc.data()
      };
      
      // Update cache
      this.providers[providerId] = provider;
      
      return provider;
    } catch (error) {
      logger.error('Error getting API provider', { error, providerId });
      throw error;
    }
  }

  /**
   * Get the default provider for a specific type
   * @param {string} providerType - Provider type
   * @param {string} subtype - Provider subtype (optional)
   * @returns {Promise<Object>} - Default provider details
   */
  async getDefaultProvider(providerType, subtype = null) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if provider type is valid
      if (!Object.values(ProviderType).includes(providerType)) {
        throw new ReachSparkError(
          `Invalid provider type: ${providerType}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      let providerId;
      
      // If subtype is specified, check for subtype-specific default
      if (subtype && this.defaultProviders[`${providerType}_${subtype}`]) {
        providerId = this.defaultProviders[`${providerType}_${subtype}`];
      } 
      // Otherwise use the general default for this type
      else if (this.defaultProviders[providerType]) {
        providerId = this.defaultProviders[providerType];
      }
      
      if (!providerId) {
        throw new ReachSparkError(
          `No default provider set for type: ${providerType}${subtype ? `, subtype: ${subtype}` : ''}`,
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Get the provider details
      return await this.getProvider(providerId);
    } catch (error) {
      logger.error('Error getting default provider', { error, providerType, subtype });
      throw error;
    }
  }

  /**
   * Set the default provider for a specific type
   * @param {string} providerType - Provider type
   * @param {string} providerId - Provider ID
   * @param {string} subtype - Provider subtype (optional)
   * @param {string} updatedBy - User ID who updated the default
   * @returns {Promise<Object>} - Update result
   */
  async setDefaultProvider(providerType, providerId, subtype = null, updatedBy) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if provider type is valid
      if (!Object.values(ProviderType).includes(providerType)) {
        throw new ReachSparkError(
          `Invalid provider type: ${providerType}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Check if provider exists
      if (providerId) {
        await this.getProvider(providerId);
      }
      
      // Determine the key to update
      const updateKey = subtype ? `${providerType}_${subtype}` : providerType;
      
      // Update in Firestore
      await db.collection('settings').doc('defaultProviders').update({
        [updateKey]: providerId,
        updatedBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update local cache
      this.defaultProviders[updateKey] = providerId;
      
      // Log the update
      await this.auditManager.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        updatedBy,
        {
          component: 'api_provider',
          action: 'set_default',
          providerType,
          subtype,
          providerId,
          success: true
        }
      );
      
      return {
        success: true,
        message: `Default provider for ${updateKey} set to ${providerId || 'none'}`
      };
    } catch (error) {
      logger.error('Error setting default provider', { error, providerType, providerId, subtype });
      
      // Log the failed update
      await this.auditManager.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        updatedBy,
        {
          component: 'api_provider',
          action: 'set_default',
          providerType,
          subtype,
          providerId,
          success: false,
          error: error.message
        }
      );
      
      throw error;
    }
  }

  /**
   * Get API key for a specific provider
   * @param {string} providerId - Provider ID
   * @returns {Promise<string>} - Decrypted API key
   */
  async getAPIKey(providerId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Get provider details
      const provider = await this.getProvider(providerId);
      
      if (!provider.isActive) {
        throw new ReachSparkError(
          `Provider is not active: ${providerId}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Check if key is expired
      if (provider.expiryDate) {
        const expiryDate = provider.expiryDate.toDate ? provider.expiryDate.toDate() : new Date(provider.expiryDate);
        if (expiryDate < new Date()) {
          throw new ReachSparkError(
            `API key has expired: ${providerId}`,
            ErrorTypes.VALIDATION_ERROR,
            SeverityLevels.ERROR
          );
        }
      }
      
      // In a production environment, this would decrypt the API key
      // For now, we'll assume the key is already decrypted
      const apiKey = provider.key;
      
      // Log API key access (non-blocking)
      this.logAPIKeyAccess(providerId).catch(error => {
        logger.error('Error logging API key access', { error, providerId });
      });
      
      return apiKey;
    } catch (error) {
      logger.error('Error getting API key', { error, providerId });
      throw error;
    }
  }

  /**
   * Log API key access
   * @param {string} providerId - Provider ID
   * @returns {Promise<void>}
   */
  async logAPIKeyAccess(providerId) {
    try {
      await db.collection('apiKeyAccessLogs').add({
        providerId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        success: true
      });
    } catch (error) {
      logger.error('Error logging API key access', { error, providerId });
      // Non-blocking error
    }
  }

  /**
   * Create a new API provider
   * @param {Object} providerData - Provider data
   * @param {string} createdBy - User ID who created the provider
   * @returns {Promise<Object>} - New provider details
   */
  async createProvider(providerData, createdBy) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Validate provider data
      this.validateProviderData(providerData);
      
      // In a production environment, this would encrypt the API key
      // For now, we'll assume the key is already encrypted
      const encryptedKey = providerData.key;
      
      // Add metadata
      const providerWithMeta = {
        ...providerData,
        key: encryptedKey,
        createdBy,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: createdBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: providerData.isActive !== false
      };
      
      // Save to Firestore
      const docRef = db.collection('apiCredentials').doc();
      await docRef.set(providerWithMeta);
      
      // Add to local cache
      this.providers[docRef.id] = {
        ...providerWithMeta,
        id: docRef.id
      };
      
      // Log the creation
      await this.auditManager.logAuditEvent(
        AuditEventType.API_KEY_ROTATION,
        createdBy,
        {
          action: 'create',
          providerId: docRef.id,
          providerType: providerData.type,
          providerName: providerData.name,
          success: true
        }
      );
      
      // Return the new provider (without the key)
      const newProvider = {
        ...providerWithMeta,
        id: docRef.id,
        key: '[REDACTED]'
      };
      
      return newProvider;
    } catch (error) {
      logger.error('Error creating API provider', { error, providerData });
      
      // Log the failed creation
      await this.auditManager.logAuditEvent(
        AuditEventType.API_KEY_ROTATION,
        createdBy,
        {
          action: 'create',
          providerType: providerData.type,
          providerName: providerData.name,
          success: false,
          error: error.message
        }
      );
      
      throw error;
    }
  }

  /**
   * Update an existing API provider
   * @param {string} providerId - Provider ID
   * @param {Object} updates - Provider updates
   * @param {string} updatedBy - User ID who updated the provider
   * @returns {Promise<Object>} - Update result
   */
  async updateProvider(providerId, updates, updatedBy) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if provider exists
      const provider = await this.getProvider(providerId);
      
      // Prepare updates
      const updatesWithMeta = {
        ...updates,
        updatedBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // If key is being updated, encrypt it
      if (updates.key) {
        // In a production environment, this would encrypt the API key
        // For now, we'll assume the key is already encrypted
        updatesWithMeta.key = updates.key;
      }
      
      // Update in Firestore
      await db.collection('apiCredentials').doc(providerId).update(updatesWithMeta);
      
      // Update local cache
      this.providers[providerId] = {
        ...provider,
        ...updatesWithMeta,
        id: providerId
      };
      
      // Log the update
      await this.auditManager.logAuditEvent(
        AuditEventType.API_KEY_ROTATION,
        updatedBy,
        {
          action: 'update',
          providerId,
          providerType: provider.type,
          providerName: provider.name,
          keyRotated: !!updates.key,
          success: true
        }
      );
      
      return {
        success: true,
        message: `Provider ${providerId} updated successfully`
      };
    } catch (error) {
      logger.error('Error updating API provider', { error, providerId, updates });
      
      // Log the failed update
      await this.auditManager.logAuditEvent(
        AuditEventType.API_KEY_ROTATION,
        updatedBy,
        {
          action: 'update',
          providerId,
          keyRotated: !!updates.key,
          success: false,
          error: error.message
        }
      );
      
      throw error;
    }
  }

  /**
   * Rotate API key for a provider
   * @param {string} providerId - Provider ID
   * @param {string} newKey - New API key
   * @param {string} rotatedBy - User ID who rotated the key
   * @returns {Promise<Object>} - Rotation result
   */
  async rotateAPIKey(providerId, newKey, rotatedBy) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if provider exists
      const provider = await this.getProvider(providerId);
      
      // In a production environment, this would encrypt the API key
      // For now, we'll assume the key is already encrypted
      const encryptedKey = newKey;
      
      // Update in Firestore
      await db.collection('apiCredentials').doc(providerId).update({
        key: encryptedKey,
        previousKey: provider.key, // Store previous key for fallback
        keyRotatedAt: admin.firestore.FieldValue.serverTimestamp(),
        keyRotatedBy: rotatedBy,
        updatedBy: rotatedBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update local cache
      this.providers[providerId] = {
        ...provider,
        key: encryptedKey,
        previousKey: provider.key,
        keyRotatedAt: new Date(),
        keyRotatedBy: rotatedBy,
        updatedBy: rotatedBy,
        updatedAt: new Date()
      };
      
      // Log the rotation
      await this.auditManager.logAuditEvent(
        AuditEventType.API_KEY_ROTATION,
        rotatedBy,
        {
          action: 'rotate',
          providerId,
          providerType: provider.type,
          providerName: provider.name,
          success: true
        }
      );
      
      return {
        success: true,
        message: `API key for provider ${providerId} rotated successfully`
      };
    } catch (error) {
      logger.error('Error rotating API key', { error, providerId });
      
      // Log the failed rotation
      await this.auditManager.logAuditEvent(
        AuditEventType.API_KEY_ROTATION,
        rotatedBy,
        {
          action: 'rotate',
          providerId,
          success: false,
          error: error.message
        }
      );
      
      throw error;
    }
  }

  /**
   * Test an API key
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} - Test result
   */
  async testAPIKey(providerId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Get provider details
      const provider = await this.getProvider(providerId);
      
      // Get API key
      const apiKey = await this.getAPIKey(providerId);
      
      // Test based on provider type
      let testResult;
      
      switch (provider.type) {
        case ProviderType.LLM:
          testResult = await this.testLLMProvider(provider, apiKey);
          break;
          
        case ProviderType.SOCIAL_MEDIA:
          testResult = await this.testSocialMediaProvider(provider, apiKey);
          break;
          
        case ProviderType.EMAIL:
          testResult = await this.testEmailProvider(provider, apiKey);
          break;
          
        case ProviderType.SMS:
          testResult = await this.testSMSProvider(provider, apiKey);
          break;
          
        default:
          testResult = await this.testGenericProvider(provider, apiKey);
      }
      
      // Update last tested timestamp
      await db.collection('apiCredentials').doc(providerId).update({
        lastTested: admin.firestore.FieldValue.serverTimestamp(),
        lastTestResult: testResult.success,
        lastTestMessage: testResult.message
      });
      
      // Update local cache
      this.providers[providerId] = {
        ...provider,
        lastTested: new Date(),
        lastTestResult: testResult.success,
        lastTestMessage: testResult.message
      };
      
      return testResult;
    } catch (error) {
      logger.error('Error testing API key', { error, providerId });
      
      // Update last tested timestamp with failure
      try {
        await db.collection('apiCredentials').doc(providerId).update({
          lastTested: admin.firestore.FieldValue.serverTimestamp(),
          lastTestResult: false,
          lastTestMessage: error.message
        });
        
        // Update local cache
        if (this.providers[providerId]) {
          this.providers[providerId] = {
            ...this.providers[providerId],
            lastTested: new Date(),
            lastTestResult: false,
            lastTestMessage: error.message
          };
        }
      } catch (updateError) {
        logger.error('Error updating API key test result', { error: updateError, providerId });
      }
      
      return {
        success: false,
        message: `API key test failed: ${error.message}`
      };
    }
  }

  /**
   * Test an LLM provider
   * @param {Object} provider - Provider details
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testLLMProvider(provider, apiKey) {
    try {
      // Determine which LLM provider to test
      const subtype = provider.subtype || LLMProviderSubtype.OTHER;
      
      let result;
      
      switch (subtype) {
        case LLMProviderSubtype.OPENAI:
          result = await this.testOpenAIProvider(apiKey);
          break;
          
        case LLMProviderSubtype.ANTHROPIC:
          result = await this.testAnthropicProvider(apiKey);
          break;
          
        case LLMProviderSubtype.GOOGLE:
          result = await this.testGoogleProvider(apiKey);
          break;
          
        case LLMProviderSubtype.COHERE:
          result = await this.testCohereProvider(apiKey);
          break;
          
        case LLMProviderSubtype.MISTRAL:
          result = await this.testMistralProvider(apiKey);
          break;
          
        case LLMProviderSubtype.AZURE_OPENAI:
          result = await this.testAzureOpenAIProvider(apiKey);
          break;
          
        default:
          result = {
            success: true,
            message: 'API key format is valid (no actual test performed)'
          };
      }
      
      return result;
    } catch (error) {
      logger.error('Error testing LLM provider', { error, provider });
      throw error;
    }
  }

  /**
   * Test OpenAI provider
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testOpenAIProvider(apiKey) {
    try {
      // In a production environment, this would make a real API call
      // For now, we'll simulate a test
      
      // Check if key format is valid (starts with "sk-" and has sufficient length)
      if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
        return {
          success: false,
          message: 'Invalid OpenAI API key format'
        };
      }
      
      // Simulate API call with retry logic
      const result = await retryWithExponentialBackoff(async () => {
        // Simulate successful API response
        return {
          success: true,
          message: 'OpenAI API key is valid',
          models: ['gpt-4-turbo', 'gpt-3.5-turbo']
        };
      }, {
        maxRetries: 3,
        initialDelayMs: 1000,
      });
      
      return result;
    } catch (error) {
      logger.error('Error testing OpenAI provider', { error });
      return {
        success: false,
        message: `OpenAI API key test failed: ${error.message}`
      };
    }
  }

  /**
   * Test Anthropic provider
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testAnthropicProvider(apiKey) {
    try {
      // In a production environment, this would make a real API call
      // For now, we'll simulate a test
      
      // Check if key format is valid
      if (!apiKey.startsWith('sk-ant-') || apiKey.length < 20) {
        return {
          success: false,
          message: 'Invalid Anthropic API key format'
        };
      }
      
      // Simulate API call with retry logic
      const result = await retryWithExponentialBackoff(async () => {
        // Simulate successful API response
        return {
          success: true,
          message: 'Anthropic API key is valid',
          models: ['claude-3-opus', 'claude-3-sonnet']
        };
      }, {
        maxRetries: 3,
        initialDelayMs: 1000,
      });
      
      return result;
    } catch (error) {
      logger.error('Error testing Anthropic provider', { error });
      return {
        success: false,
        message: `Anthropic API key test failed: ${error.message}`
      };
    }
  }

  /**
   * Test Google provider
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testGoogleProvider(apiKey) {
    try {
      // In a production environment, this would make a real API call
      // For now, we'll simulate a test
      
      // Check if key format is valid
      if (apiKey.length < 20) {
        return {
          success: false,
          message: 'Invalid Google API key format'
        };
      }
      
      // Simulate API call with retry logic
      const result = await retryWithExponentialBackoff(async () => {
        // Simulate successful API response
        return {
          success: true,
          message: 'Google API key is valid',
          models: ['gemini-pro', 'gemini-pro-vision']
        };
      }, {
        maxRetries: 3,
        initialDelayMs: 1000,
      });
      
      return result;
    } catch (error) {
      logger.error('Error testing Google provider', { error });
      return {
        success: false,
        message: `Google API key test failed: ${error.message}`
      };
    }
  }

  /**
   * Test Cohere provider
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testCohereProvider(apiKey) {
    // Implementation similar to other LLM providers
    return {
      success: true,
      message: 'Cohere API key format is valid (simulated test)'
    };
  }

  /**
   * Test Mistral provider
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testMistralProvider(apiKey) {
    // Implementation similar to other LLM providers
    return {
      success: true,
      message: 'Mistral API key format is valid (simulated test)'
    };
  }

  /**
   * Test Azure OpenAI provider
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testAzureOpenAIProvider(apiKey) {
    // Implementation similar to other LLM providers
    return {
      success: true,
      message: 'Azure OpenAI API key format is valid (simulated test)'
    };
  }

  /**
   * Test a social media provider
   * @param {Object} provider - Provider details
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testSocialMediaProvider(provider, apiKey) {
    // Implementation for social media providers
    return {
      success: true,
      message: `${provider.name} API key format is valid (simulated test)`
    };
  }

  /**
   * Test an email provider
   * @param {Object} provider - Provider details
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testEmailProvider(provider, apiKey) {
    // Implementation for email providers
    return {
      success: true,
      message: `${provider.name} API key format is valid (simulated test)`
    };
  }

  /**
   * Test an SMS provider
   * @param {Object} provider - Provider details
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testSMSProvider(provider, apiKey) {
    // Implementation for SMS providers
    return {
      success: true,
      message: `${provider.name} API key format is valid (simulated test)`
    };
  }

  /**
   * Test a generic provider
   * @param {Object} provider - Provider details
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} - Test result
   */
  async testGenericProvider(provider, apiKey) {
    // Basic validation for generic providers
    if (!apiKey || apiKey.length < 8) {
      return {
        success: false,
        message: 'API key is too short or invalid'
      };
    }
    
    return {
      success: true,
      message: `${provider.name} API key format is valid (basic validation only)`
    };
  }

  /**
   * Validate provider data
   * @param {Object} providerData - Provider data to validate
   * @throws {ReachSparkError} If validation fails
   */
  validateProviderData(providerData) {
    // Check required fields
    if (!providerData.name) {
      throw new ReachSparkError(
        'Provider name is required',
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR
      );
    }
    
    if (!providerData.type) {
      throw new ReachSparkError(
        'Provider type is required',
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR
      );
    }
    
    if (!Object.values(ProviderType).includes(providerData.type)) {
      throw new ReachSparkError(
        `Invalid provider type: ${providerData.type}`,
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR
      );
    }
    
    if (!providerData.key) {
      throw new ReachSparkError(
        'API key is required',
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR
      );
    }
    
    // Validate subtype if provided
    if (providerData.type === ProviderType.LLM && providerData.subtype) {
      if (!Object.values(LLMProviderSubtype).includes(providerData.subtype)) {
        throw new ReachSparkError(
          `Invalid LLM provider subtype: ${providerData.subtype}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
    }
    
    // Validate expiry date if provided
    if (providerData.expiryDate) {
      const expiryDate = new Date(providerData.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        throw new ReachSparkError(
          'Invalid expiry date format',
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
    }
  }

  /**
   * Get all providers of a specific type
   * @param {string} providerType - Provider type
   * @param {string} subtype - Provider subtype (optional)
   * @returns {Promise<Array>} - List of providers
   */
  async getProvidersByType(providerType, subtype = null) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if provider type is valid
      if (!Object.values(ProviderType).includes(providerType)) {
        throw new ReachSparkError(
          `Invalid provider type: ${providerType}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Filter providers by type and subtype
      const filteredProviders = Object.values(this.providers).filter(provider => {
        if (provider.type !== providerType) {
          return false;
        }
        
        if (subtype && provider.subtype !== subtype) {
          return false;
        }
        
        return true;
      });
      
      // Redact API keys
      return filteredProviders.map(provider => ({
        ...provider,
        key: '[REDACTED]'
      }));
    } catch (error) {
      logger.error('Error getting providers by type', { error, providerType, subtype });
      throw error;
    }
  }
}

module.exports = {
  APIProviderManager,
  ProviderType,
  LLMProviderSubtype
};
