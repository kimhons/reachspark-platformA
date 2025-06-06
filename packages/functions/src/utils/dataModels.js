/**
 * Data Models and Storage for ReachSpark AMIA
 * 
 * This module provides comprehensive data model definitions and storage utilities for the
 * Autonomous Marketing Intelligence Agent, supporting both default mode
 * (ReachSpark lead generation) and client mode (client-specific lead generation).
 * 
 * The capabilities include:
 * - Lead data model with validation
 * - Client configuration schema
 * - Engagement tracking models
 * - Conversion and workflow data models
 * - Storage utilities for efficient data access
 * - Data migration and versioning support
 */

const admin = require("firebase-admin");
const { logger, ReachSparkError, ErrorTypes, SeverityLevels } = require("./errorLogging");
const { OperationMode } = require("./decisionFramework");
const { QualificationStatus } = require("./leadQualification");
const { ChannelType, ContactStatus, ConversionType } = require("./multiChannelWorkflows");

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Lead source types
 */
const LeadSourceType = {
  WEB_SCRAPING: "web_scraping",
  MANUAL_ENTRY: "manual_entry",
  FORM_SUBMISSION: "form_submission",
  IMPORT: "import",
  REFERRAL: "referral",
  EVENT: "event",
  SOCIAL_MEDIA: "social_media",
  PARTNER: "partner",
  ADVERTISEMENT: "advertisement",
  COLD_OUTREACH: "cold_outreach"
};

/**
 * Lead status types
 */
const LeadStatus = {
  NEW: "new",
  QUALIFYING: "qualifying",
  QUALIFIED: "qualified",
  NURTURING: "nurturing",
  SALES_READY: "sales_ready",
  OPPORTUNITY: "opportunity",
  CUSTOMER: "customer",
  DISQUALIFIED: "disqualified",
  INACTIVE: "inactive"
};

/**
 * Industry types
 */
const IndustryType = {
  TECHNOLOGY: "technology",
  HEALTHCARE: "healthcare",
  FINANCE: "finance",
  RETAIL: "retail",
  MANUFACTURING: "manufacturing",
  EDUCATION: "education",
  GOVERNMENT: "government",
  NONPROFIT: "nonprofit",
  REAL_ESTATE: "real_estate",
  HOSPITALITY: "hospitality",
  MEDIA: "media",
  TELECOMMUNICATIONS: "telecommunications",
  TRANSPORTATION: "transportation",
  ENERGY: "energy",
  AGRICULTURE: "agriculture",
  CONSTRUCTION: "construction",
  LEGAL: "legal",
  CONSULTING: "consulting",
  OTHER: "other"
};

/**
 * Company size ranges
 */
const CompanySizeRange = {
  SOLO: "solo",
  MICRO: "micro", // 2-10
  SMALL: "small", // 11-50
  MEDIUM: "medium", // 51-200
  LARGE: "large", // 201-1000
  ENTERPRISE: "enterprise", // 1001+
  UNKNOWN: "unknown"
};

/**
 * Data Models and Storage class for AMIA
 */
class DataModels {
  /**
   * Create a new Data Models instance
   * @param {string} contextId - Unique identifier for this data context
   * @param {string} mode - Operation mode (default or client)
   * @param {string} clientId - Client ID (required for client mode)
   */
  constructor(contextId, mode = OperationMode.DEFAULT, clientId = null) {
    this.contextId = contextId;
    this.mode = mode;
    this.clientId = clientId;

    // Validate mode and clientId combination
    if (mode === OperationMode.CLIENT && !clientId) {
      throw new ReachSparkError(
        "Client ID is required for client mode",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { contextId, mode }
      );
    }

    // Initialize schema versions
    this.schemaVersions = {
      lead: 1,
      client: 1,
      engagement: 1,
      conversion: 1,
      workflow: 1
    };
  }

  /**
   * Create a new lead
   * @param {Object} leadData - Lead data
   * @returns {Promise<Object>} Created lead
   */
  async createLead(leadData) {
    try {
      // Validate lead data
      this.validateLeadData(leadData);

      // Add metadata
      const now = admin.firestore.FieldValue.serverTimestamp();
      const enrichedLeadData = {
        ...leadData,
        status: leadData.status || LeadStatus.NEW,
        qualificationStatus: leadData.qualificationStatus || null,
        createdAt: now,
        updatedAt: now,
        mode: this.mode,
        clientId: this.clientId,
        schemaVersion: this.schemaVersions.lead,
        engagementCount: 0,
        conversionCount: 0,
        lastEngagement: null,
        lastConversion: null
      };

      // Create lead document
      const leadRef = await db.collection("leads").add(enrichedLeadData);

      // Log lead creation
      await this.logDataEvent("lead_created", {
        leadId: leadRef.id,
        source: leadData.source || "manual"
      });

      return {
        id: leadRef.id,
        ...enrichedLeadData
      };
    } catch (error) {
      logger.error("Error creating lead", {
        error,
        leadData,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error creating lead",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { leadData, contextId: this.contextId }
      );
    }
  }

  /**
   * Validate lead data
   * @param {Object} leadData - Lead data to validate
   * @throws {ReachSparkError} If validation fails
   */
  validateLeadData(leadData) {
    // Required fields
    const requiredFields = ["name", "company"];
    for (const field of requiredFields) {
      if (!leadData[field]) {
        throw new ReachSparkError(
          `Missing required field: ${field}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { leadData, contextId: this.contextId }
        );
      }
    }

    // At least one contact method is required
    if (!leadData.email && !leadData.phone && !leadData.linkedinUrl && !leadData.twitterHandle) {
      throw new ReachSparkError(
        "Lead must have at least one contact method (email, phone, linkedinUrl, or twitterHandle)",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { leadData, contextId: this.contextId }
      );
    }

    // Validate email format if provided
    if (leadData.email && !this.isValidEmail(leadData.email)) {
      throw new ReachSparkError(
        "Invalid email format",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { email: leadData.email, contextId: this.contextId }
      );
    }

    // Validate phone format if provided
    if (leadData.phone && !this.isValidPhone(leadData.phone)) {
      throw new ReachSparkError(
        "Invalid phone format",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { phone: leadData.phone, contextId: this.contextId }
      );
    }

    // Validate industry if provided
    if (leadData.industry && !Object.values(IndustryType).includes(leadData.industry)) {
      throw new ReachSparkError(
        "Invalid industry type",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { industry: leadData.industry, contextId: this.contextId }
      );
    }

    // Validate company size if provided
    if (leadData.companySize && !Object.values(CompanySizeRange).includes(leadData.companySize)) {
      throw new ReachSparkError(
        "Invalid company size range",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { companySize: leadData.companySize, contextId: this.contextId }
      );
    }

    // Validate lead source if provided
    if (leadData.source && !Object.values(LeadSourceType).includes(leadData.source)) {
      throw new ReachSparkError(
        "Invalid lead source type",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { source: leadData.source, contextId: this.contextId }
      );
    }

    // Validate lead status if provided
    if (leadData.status && !Object.values(LeadStatus).includes(leadData.status)) {
      throw new ReachSparkError(
        "Invalid lead status",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { status: leadData.status, contextId: this.contextId }
      );
    }

    // Validate qualification status if provided
    if (leadData.qualificationStatus && !Object.values(QualificationStatus).includes(leadData.qualificationStatus)) {
      throw new ReachSparkError(
        "Invalid qualification status",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { qualificationStatus: leadData.qualificationStatus, contextId: this.contextId }
      );
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   * @param {string} phone - Phone to validate
   * @returns {boolean} Whether phone is valid
   */
  isValidPhone(phone) {
    // Basic phone validation (allows various formats)
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Get a lead by ID
   * @param {string} leadId - ID of the lead
   * @returns {Promise<Object|null>} Lead data or null if not found
   */
  async getLead(leadId) {
    try {
      const leadDoc = await db.collection("leads").doc(leadId).get();
      if (!leadDoc.exists) {
        return null;
      }

      return {
        id: leadDoc.id,
        ...leadDoc.data()
      };
    } catch (error) {
      logger.error("Error getting lead", {
        error,
        leadId,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error getting lead",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { leadId, contextId: this.contextId }
      );
    }
  }

  /**
   * Update a lead
   * @param {string} leadId - ID of the lead to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated lead
   */
  async updateLead(leadId, updateData) {
    try {
      // Get current lead data
      const leadDoc = await db.collection("leads").doc(leadId).get();
      if (!leadDoc.exists) {
        throw new ReachSparkError(
          "Lead not found",
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR,
          null,
          { leadId, contextId: this.contextId }
        );
      }

      const currentLead = leadDoc.data();

      // Prevent updating certain fields
      const protectedFields = ["createdAt", "mode", "clientId", "schemaVersion"];
      for (const field of protectedFields) {
        if (updateData[field] !== undefined) {
          delete updateData[field];
        }
      }

      // Add updatedAt timestamp
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      // Update lead document
      await db.collection("leads").doc(leadId).update(updateData);

      // Log lead update
      await this.logDataEvent("lead_updated", {
        leadId,
        updatedFields: Object.keys(updateData)
      });

      // Return updated lead
      return {
        id: leadId,
        ...currentLead,
        ...updateData
      };
    } catch (error) {
      logger.error("Error updating lead", {
        error,
        leadId,
        updateData,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error updating lead",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { leadId, updateData, contextId: this.contextId }
      );
    }
  }

  /**
   * Find leads by query
   * @param {Object} query - Query parameters
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array<Object>>} Matching leads
   */
  async findLeads(query = {}, limit = 100) {
    try {
      let leadsQuery = db.collection("leads");

      // Apply mode filter
      leadsQuery = leadsQuery.where("mode", "==", this.mode);

      // Apply client filter for client mode
      if (this.mode === OperationMode.CLIENT) {
        leadsQuery = leadsQuery.where("clientId", "==", this.clientId);
      }

      // Apply query filters
      if (query.status) {
        leadsQuery = leadsQuery.where("status", "==", query.status);
      }

      if (query.qualificationStatus) {
        leadsQuery = leadsQuery.where("qualificationStatus", "==", query.qualificationStatus);
      }

      if (query.industry) {
        leadsQuery = leadsQuery.where("industry", "==", query.industry);
      }

      if (query.companySize) {
        leadsQuery = leadsQuery.where("companySize", "==", query.companySize);
      }

      if (query.source) {
        leadsQuery = leadsQuery.where("source", "==", query.source);
      }

      // Apply limit
      leadsQuery = leadsQuery.limit(limit);

      // Execute query
      const snapshot = await leadsQuery.get();

      // Process results
      const leads = [];
      snapshot.forEach(doc => {
        leads.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return leads;
    } catch (error) {
      logger.error("Error finding leads", {
        error,
        query,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error finding leads",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { query, contextId: this.contextId }
      );
    }
  }

  /**
   * Create a new client configuration
   * @param {Object} configData - Client configuration data
   * @returns {Promise<Object>} Created client configuration
   */
  async createClientConfiguration(configData) {
    try {
      // Validate client configuration data
      this.validateClientConfigurationData(configData);

      // Add metadata
      const now = admin.firestore.FieldValue.serverTimestamp();
      const enrichedConfigData = {
        ...configData,
        createdAt: now,
        updatedAt: now,
        schemaVersion: this.schemaVersions.client,
        status: configData.status || "active"
      };

      // Create client configuration document
      const configRef = await db.collection("client_configurations").add(enrichedConfigData);

      // Log client configuration creation
      await this.logDataEvent("client_configuration_created", {
        configId: configRef.id,
        clientId: configData.clientId
      });

      return {
        id: configRef.id,
        ...enrichedConfigData
      };
    } catch (error) {
      logger.error("Error creating client configuration", {
        error,
        configData,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error creating client configuration",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { configData, contextId: this.contextId }
      );
    }
  }

  /**
   * Validate client configuration data
   * @param {Object} configData - Client configuration data to validate
   * @throws {ReachSparkError} If validation fails
   */
  validateClientConfigurationData(configData) {
    // Required fields
    const requiredFields = ["clientId", "clientName", "targetIndustries", "targetCompanySizes"];
    for (const field of requiredFields) {
      if (!configData[field]) {
        throw new ReachSparkError(
          `Missing required field: ${field}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { configData, contextId: this.contextId }
        );
      }
    }

    // Validate target industries
    if (!Array.isArray(configData.targetIndustries) || configData.targetIndustries.length === 0) {
      throw new ReachSparkError(
        "targetIndustries must be a non-empty array",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { targetIndustries: configData.targetIndustries, contextId: this.contextId }
      );
    }

    for (const industry of configData.targetIndustries) {
      if (!Object.values(IndustryType).includes(industry)) {
        throw new ReachSparkError(
          "Invalid industry type in targetIndustries",
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { industry, contextId: this.contextId }
        );
      }
    }

    // Validate target company sizes
    if (!Array.isArray(configData.targetCompanySizes) || configData.targetCompanySizes.length === 0) {
      throw new ReachSparkError(
        "targetCompanySizes must be a non-empty array",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { targetCompanySizes: configData.targetCompanySizes, contextId: this.contextId }
      );
    }

    for (const companySize of configData.targetCompanySizes) {
      if (!Object.values(CompanySizeRange).includes(companySize)) {
        throw new ReachSparkError(
          "Invalid company size range in targetCompanySizes",
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { companySize, contextId: this.contextId }
        );
      }
    }

    // Validate target locations if provided
    if (configData.targetLocations && (!Array.isArray(configData.targetLocations) || configData.targetLocations.length === 0)) {
      throw new ReachSparkError(
        "targetLocations must be a non-empty array",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { targetLocations: configData.targetLocations, contextId: this.contextId }
      );
    }

    // Validate target roles if provided
    if (configData.targetRoles && (!Array.isArray(configData.targetRoles) || configData.targetRoles.length === 0)) {
      throw new ReachSparkError(
        "targetRoles must be a non-empty array",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { targetRoles: configData.targetRoles, contextId: this.contextId }
      );
    }

    // Validate channel preferences if provided
    if (configData.channelPreferences) {
      if (!Array.isArray(configData.channelPreferences.priorityOrder) || configData.channelPreferences.priorityOrder.length === 0) {
        throw new ReachSparkError(
          "channelPreferences.priorityOrder must be a non-empty array",
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { channelPreferences: configData.channelPreferences, contextId: this.contextId }
        );
      }

      for (const channel of configData.channelPreferences.priorityOrder) {
        if (!Object.values(ChannelType).includes(channel)) {
          throw new ReachSparkError(
            "Invalid channel type in channelPreferences.priorityOrder",
            ErrorTypes.VALIDATION_ERROR,
            SeverityLevels.ERROR,
            null,
            { channel, contextId: this.contextId }
          );
        }
      }
    }
  }

  /**
   * Get a client configuration by client ID
   * @param {string} clientId - ID of the client
   * @returns {Promise<Object|null>} Client configuration or null if not found
   */
  async getClientConfiguration(clientId) {
    try {
      const snapshot = await db.collection("client_configurations")
        .where("clientId", "==", clientId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      logger.error("Error getting client configuration", {
        error,
        clientId,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error getting client configuration",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { clientId, contextId: this.contextId }
      );
    }
  }

  /**
   * Update a client configuration
   * @param {string} configId - ID of the configuration to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated client configuration
   */
  async updateClientConfiguration(configId, updateData) {
    try {
      // Get current configuration data
      const configDoc = await db.collection("client_configurations").doc(configId).get();
      if (!configDoc.exists) {
        throw new ReachSparkError(
          "Client configuration not found",
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR,
          null,
          { configId, contextId: this.contextId }
        );
      }

      const currentConfig = configDoc.data();

      // Prevent updating certain fields
      const protectedFields = ["clientId", "createdAt", "schemaVersion"];
      for (const field of protectedFields) {
        if (updateData[field] !== undefined) {
          delete updateData[field];
        }
      }

      // Add updatedAt timestamp
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      // Update configuration document
      await db.collection("client_configurations").doc(configId).update(updateData);

      // Log configuration update
      await this.logDataEvent("client_configuration_updated", {
        configId,
        clientId: currentConfig.clientId,
        updatedFields: Object.keys(updateData)
      });

      // Return updated configuration
      return {
        id: configId,
        ...currentConfig,
        ...updateData
      };
    } catch (error) {
      logger.error("Error updating client configuration", {
        error,
        configId,
        updateData,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error updating client configuration",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { configId, updateData, contextId: this.contextId }
      );
    }
  }

  /**
   * Create a new engagement record
   * @param {Object} engagementData - Engagement data
   * @returns {Promise<Object>} Created engagement record
   */
  async createEngagement(engagementData) {
    try {
      // Validate engagement data
      this.validateEngagementData(engagementData);

      // Add metadata
      const now = admin.firestore.FieldValue.serverTimestamp();
      const enrichedEngagementData = {
        ...engagementData,
        createdAt: now,
        updatedAt: now,
        mode: this.mode,
        clientId: this.clientId,
        contextId: this.contextId,
        schemaVersion: this.schemaVersions.engagement
      };

      // Create engagement document
      const engagementRef = await db.collection("lead_engagements").add(enrichedEngagementData);

      // Update lead engagement count
      await db.collection("leads").doc(engagementData.leadId).update({
        engagementCount: admin.firestore.FieldValue.increment(1),
        lastEngagement: {
          type: engagementData.channelType,
          timestamp: now
        },
        updatedAt: now
      });

      // Log engagement creation
      await this.logDataEvent("engagement_created", {
        engagementId: engagementRef.id,
        leadId: engagementData.leadId,
        channelType: engagementData.channelType
      });

      return {
        id: engagementRef.id,
        ...enrichedEngagementData
      };
    } catch (error) {
      logger.error("Error creating engagement", {
        error,
        engagementData,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error creating engagement",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { engagementData, contextId: this.contextId }
      );
    }
  }

  /**
   * Validate engagement data
   * @param {Object} engagementData - Engagement data to validate
   * @throws {ReachSparkError} If validation fails
   */
  validateEngagementData(engagementData) {
    // Required fields
    const requiredFields = ["leadId", "channelType", "status"];
    for (const field of requiredFields) {
      if (!engagementData[field]) {
        throw new ReachSparkError(
          `Missing required field: ${field}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { engagementData, contextId: this.contextId }
        );
      }
    }

    // Validate channel type
    if (!Object.values(ChannelType).includes(engagementData.channelType)) {
      throw new ReachSparkError(
        "Invalid channel type",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { channelType: engagementData.channelType, contextId: this.contextId }
      );
    }

    // Validate status
    if (!Object.values(ContactStatus).includes(engagementData.status)) {
      throw new ReachSparkError(
        "Invalid contact status",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { status: engagementData.status, contextId: this.contextId }
      );
    }
  }

  /**
   * Update an engagement record
   * @param {string} engagementId - ID of the engagement to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated engagement record
   */
  async updateEngagement(engagementId, updateData) {
    try {
      // Get current engagement data
      const engagementDoc = await db.collection("lead_engagements").doc(engagementId).get();
      if (!engagementDoc.exists) {
        throw new ReachSparkError(
          "Engagement not found",
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR,
          null,
          { engagementId, contextId: this.contextId }
        );
      }

      const currentEngagement = engagementDoc.data();

      // Prevent updating certain fields
      const protectedFields = ["leadId", "createdAt", "mode", "clientId", "contextId", "schemaVersion"];
      for (const field of protectedFields) {
        if (updateData[field] !== undefined) {
          delete updateData[field];
        }
      }

      // Add updatedAt timestamp
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      // Update engagement document
      await db.collection("lead_engagements").doc(engagementId).update(updateData);

      // If status is updated to RESPONDED, update lead record
      if (updateData.status === ContactStatus.RESPONDED && currentEngagement.status !== ContactStatus.RESPONDED) {
        await db.collection("leads").doc(currentEngagement.leadId).update({
          lastResponse: {
            channelType: currentEngagement.channelType,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Log engagement update
      await this.logDataEvent("engagement_updated", {
        engagementId,
        leadId: currentEngagement.leadId,
        updatedFields: Object.keys(updateData)
      });

      // Return updated engagement
      return {
        id: engagementId,
        ...currentEngagement,
        ...updateData
      };
    } catch (error) {
      logger.error("Error updating engagement", {
        error,
        engagementId,
        updateData,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error updating engagement",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { engagementId, updateData, contextId: this.contextId }
      );
    }
  }

  /**
   * Get engagement history for a lead
   * @param {string} leadId - ID of the lead
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array<Object>>} Engagement history
   */
  async getEngagementHistory(leadId, limit = 50) {
    try {
      const snapshot = await db.collection("lead_engagements")
        .where("leadId", "==", leadId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const engagements = [];
      snapshot.forEach(doc => {
        engagements.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return engagements;
    } catch (error) {
      logger.error("Error getting engagement history", {
        error,
        leadId,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error getting engagement history",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { leadId, contextId: this.contextId }
      );
    }
  }

  /**
   * Create a new conversion record
   * @param {Object} conversionData - Conversion data
   * @returns {Promise<Object>} Created conversion record
   */
  async createConversion(conversionData) {
    try {
      // Validate conversion data
      this.validateConversionData(conversionData);

      // Add metadata
      const now = admin.firestore.FieldValue.serverTimestamp();
      const enrichedConversionData = {
        ...conversionData,
        createdAt: now,
        mode: this.mode,
        clientId: this.clientId,
        contextId: this.contextId,
        schemaVersion: this.schemaVersions.conversion
      };

      // Create conversion document
      const conversionRef = await db.collection("lead_conversions_events").add(enrichedConversionData);

      // Update lead conversion count
      await db.collection("leads").doc(conversionData.leadId).update({
        conversionCount: admin.firestore.FieldValue.increment(1),
        lastConversion: {
          type: conversionData.conversionType,
          timestamp: now
        },
        updatedAt: now
      });

      // Log conversion creation
      await this.logDataEvent("conversion_created", {
        conversionId: conversionRef.id,
        leadId: conversionData.leadId,
        conversionType: conversionData.conversionType
      });

      return {
        id: conversionRef.id,
        ...enrichedConversionData
      };
    } catch (error) {
      logger.error("Error creating conversion", {
        error,
        conversionData,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error creating conversion",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { conversionData, contextId: this.contextId }
      );
    }
  }

  /**
   * Validate conversion data
   * @param {Object} conversionData - Conversion data to validate
   * @throws {ReachSparkError} If validation fails
   */
  validateConversionData(conversionData) {
    // Required fields
    const requiredFields = ["leadId", "conversionType"];
    for (const field of requiredFields) {
      if (!conversionData[field]) {
        throw new ReachSparkError(
          `Missing required field: ${field}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { conversionData, contextId: this.contextId }
        );
      }
    }

    // Validate conversion type
    if (!Object.values(ConversionType).includes(conversionData.conversionType)) {
      throw new ReachSparkError(
        "Invalid conversion type",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { conversionType: conversionData.conversionType, contextId: this.contextId }
      );
    }
  }

  /**
   * Get conversion history for a lead
   * @param {string} leadId - ID of the lead
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array<Object>>} Conversion history
   */
  async getConversionHistory(leadId, limit = 50) {
    try {
      const snapshot = await db.collection("lead_conversions_events")
        .where("leadId", "==", leadId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const conversions = [];
      snapshot.forEach(doc => {
        conversions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return conversions;
    } catch (error) {
      logger.error("Error getting conversion history", {
        error,
        leadId,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error getting conversion history",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { leadId, contextId: this.contextId }
      );
    }
  }

  /**
   * Create a new workflow record
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Object>} Created workflow record
   */
  async createWorkflow(workflowData) {
    try {
      // Validate workflow data
      this.validateWorkflowData(workflowData);

      // Add metadata
      const now = admin.firestore.FieldValue.serverTimestamp();
      const enrichedWorkflowData = {
        ...workflowData,
        createdAt: now,
        updatedAt: now,
        mode: this.mode,
        clientId: this.clientId,
        contextId: this.contextId,
        schemaVersion: this.schemaVersions.workflow,
        history: []
      };

      // Create workflow document
      const workflowRef = await db.collection("lead_workflows").add(enrichedWorkflowData);

      // Log workflow creation
      await this.logDataEvent("workflow_created", {
        workflowId: workflowRef.id,
        leadId: workflowData.leadId,
        workflowType: workflowData.workflowType
      });

      return {
        id: workflowRef.id,
        ...enrichedWorkflowData
      };
    } catch (error) {
      logger.error("Error creating workflow", {
        error,
        workflowData,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error creating workflow",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { workflowData, contextId: this.contextId }
      );
    }
  }

  /**
   * Validate workflow data
   * @param {Object} workflowData - Workflow data to validate
   * @throws {ReachSparkError} If validation fails
   */
  validateWorkflowData(workflowData) {
    // Required fields
    const requiredFields = ["leadId", "workflowType", "status", "currentStepId"];
    for (const field of requiredFields) {
      if (!workflowData[field]) {
        throw new ReachSparkError(
          `Missing required field: ${field}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { workflowData, contextId: this.contextId }
        );
      }
    }

    // Validate status
    const validStatuses = ["active", "paused", "completed", "failed"];
    if (!validStatuses.includes(workflowData.status)) {
      throw new ReachSparkError(
        "Invalid workflow status",
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { status: workflowData.status, contextId: this.contextId }
      );
    }
  }

  /**
   * Update a workflow record
   * @param {string} workflowId - ID of the workflow to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated workflow record
   */
  async updateWorkflow(workflowId, updateData) {
    try {
      // Get current workflow data
      const workflowDoc = await db.collection("lead_workflows").doc(workflowId).get();
      if (!workflowDoc.exists) {
        throw new ReachSparkError(
          "Workflow not found",
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR,
          null,
          { workflowId, contextId: this.contextId }
        );
      }

      const currentWorkflow = workflowDoc.data();

      // Prevent updating certain fields
      const protectedFields = ["leadId", "createdAt", "mode", "clientId", "contextId", "schemaVersion"];
      for (const field of protectedFields) {
        if (updateData[field] !== undefined) {
          delete updateData[field];
        }
      }

      // Add updatedAt timestamp
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      // Update workflow document
      await db.collection("lead_workflows").doc(workflowId).update(updateData);

      // Log workflow update
      await this.logDataEvent("workflow_updated", {
        workflowId,
        leadId: currentWorkflow.leadId,
        updatedFields: Object.keys(updateData)
      });

      // Return updated workflow
      return {
        id: workflowId,
        ...currentWorkflow,
        ...updateData
      };
    } catch (error) {
      logger.error("Error updating workflow", {
        error,
        workflowId,
        updateData,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error updating workflow",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { workflowId, updateData, contextId: this.contextId }
      );
    }
  }

  /**
   * Get active workflows for a lead
   * @param {string} leadId - ID of the lead
   * @returns {Promise<Array<Object>>} Active workflows
   */
  async getActiveWorkflows(leadId) {
    try {
      const snapshot = await db.collection("lead_workflows")
        .where("leadId", "==", leadId)
        .where("status", "==", "active")
        .get();

      const workflows = [];
      snapshot.forEach(doc => {
        workflows.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return workflows;
    } catch (error) {
      logger.error("Error getting active workflows", {
        error,
        leadId,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error getting active workflows",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { leadId, contextId: this.contextId }
      );
    }
  }

  /**
   * Log a data event
   * @param {string} eventType - Type of event
   * @param {Object} details - Event details
   * @returns {Promise<void>}
   */
  async logDataEvent(eventType, details = {}) {
    try {
      await db.collection("data_events").add({
        eventType,
        details,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        mode: this.mode,
        clientId: this.clientId,
        contextId: this.contextId
      });
    } catch (error) {
      logger.warn("Failed to log data event", {
        error,
        eventType,
        contextId: this.contextId
      });
      // Non-critical error, don't throw
    }
  }

  /**
   * Migrate data to latest schema version
   * @param {string} collectionName - Name of the collection to migrate
   * @param {number} fromVersion - Current schema version
   * @param {number} toVersion - Target schema version
   * @returns {Promise<Object>} Migration results
   */
  async migrateData(collectionName, fromVersion, toVersion) {
    try {
      // Validate migration parameters
      if (!collectionName || !fromVersion || !toVersion) {
        throw new ReachSparkError(
          "Invalid migration parameters",
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { collectionName, fromVersion, toVersion, contextId: this.contextId }
        );
      }

      if (fromVersion >= toVersion) {
        return { migrated: 0, message: "No migration needed" };
      }

      // Get documents to migrate
      const snapshot = await db.collection(collectionName)
        .where("schemaVersion", "==", fromVersion)
        .get();

      if (snapshot.empty) {
        return { migrated: 0, message: "No documents to migrate" };
      }

      // Perform migration
      const batch = db.batch();
      let migratedCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        const migratedData = this.migrateDocument(collectionName, data, fromVersion, toVersion);
        batch.update(doc.ref, migratedData);
        migratedCount++;
      });

      await batch.commit();

      // Log migration
      await this.logDataEvent("data_migration", {
        collectionName,
        fromVersion,
        toVersion,
        migratedCount
      });

      return { migrated: migratedCount, message: "Migration successful" };
    } catch (error) {
      logger.error("Error migrating data", {
        error,
        collectionName,
        fromVersion,
        toVersion,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error migrating data",
        ErrorTypes.DATABASE_ERROR,
        SeverityLevels.ERROR,
        error,
        { collectionName, fromVersion, toVersion, contextId: this.contextId }
      );
    }
  }

  /**
   * Migrate a document to a new schema version
   * @param {string} collectionName - Name of the collection
   * @param {Object} data - Document data
   * @param {number} fromVersion - Current schema version
   * @param {number} toVersion - Target schema version
   * @returns {Object} Migrated document data
   */
  migrateDocument(collectionName, data, fromVersion, toVersion) {
    // Clone the data to avoid modifying the original
    const migratedData = { ...data };

    // Update schema version
    migratedData.schemaVersion = toVersion;

    // Add migration timestamp
    migratedData.migratedAt = admin.firestore.FieldValue.serverTimestamp();

    // Collection-specific migrations
    switch (collectionName) {
      case "leads":
        // Example: Add new required fields in version 2
        if (fromVersion === 1 && toVersion >= 2) {
          if (!migratedData.engagementCount) migratedData.engagementCount = 0;
          if (!migratedData.conversionCount) migratedData.conversionCount = 0;
        }
        break;

      case "client_configurations":
        // Example: Add new required fields in version 2
        if (fromVersion === 1 && toVersion >= 2) {
          if (!migratedData.status) migratedData.status = "active";
        }
        break;

      case "lead_engagements":
        // Example: Rename fields in version 2
        if (fromVersion === 1 && toVersion >= 2) {
          if (migratedData.type) {
            migratedData.channelType = migratedData.type;
            delete migratedData.type;
          }
        }
        break;

      case "lead_conversions_events":
        // Example: Add new required fields in version 2
        if (fromVersion === 1 && toVersion >= 2) {
          if (!migratedData.details) migratedData.details = {};
        }
        break;

      case "lead_workflows":
        // Example: Add new required fields in version 2
        if (fromVersion === 1 && toVersion >= 2) {
          if (!migratedData.history) migratedData.history = [];
        }
        break;

      default:
        // No specific migrations for other collections
        break;
    }

    return migratedData;
  }

  /**
   * Export data to BigQuery for analytics
   * @param {string} collectionName - Name of the collection to export
   * @param {Date} startDate - Start date for export
   * @param {Date} endDate - End date for export
   * @returns {Promise<Object>} Export results
   */
  async exportToBigQuery(collectionName, startDate, endDate) {
    try {
      // Validate export parameters
      if (!collectionName || !startDate || !endDate) {
        throw new ReachSparkError(
          "Invalid export parameters",
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR,
          null,
          { collectionName, startDate, endDate, contextId: this.contextId }
        );
      }

      // Convert dates to Firestore timestamps
      const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = admin.firestore.Timestamp.fromDate(endDate);

      // Get documents to export
      const snapshot = await db.collection(collectionName)
        .where("createdAt", ">=", startTimestamp)
        .where("createdAt", "<=", endTimestamp)
        .get();

      if (snapshot.empty) {
        return { exported: 0, message: "No documents to export" };
      }

      // Prepare data for export
      const exportData = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Add document ID to data
        data.id = doc.id;
        // Convert timestamps to ISO strings
        Object.keys(data).forEach(key => {
          if (data[key] instanceof admin.firestore.Timestamp) {
            data[key] = data[key].toDate().toISOString();
          }
        });
        exportData.push(data);
      });

      // Placeholder for BigQuery export logic
      // In a real implementation, this would use the BigQuery API to export the data
      logger.info(`Simulated exporting ${exportData.length} documents from ${collectionName} to BigQuery`, {
        collectionName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        contextId: this.contextId
      });

      // Log export
      await this.logDataEvent("data_export", {
        collectionName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        exportedCount: exportData.length
      });

      return { exported: exportData.length, message: "Export successful" };
    } catch (error) {
      logger.error("Error exporting data to BigQuery", {
        error,
        collectionName,
        startDate,
        endDate,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error exporting data to BigQuery",
        ErrorTypes.UNKNOWN_ERROR,
        SeverityLevels.ERROR,
        error,
        { collectionName, startDate, endDate, contextId: this.contextId }
      );
    }
  }

  /**
   * Create database indexes required for efficient queries
   * @returns {Promise<Object>} Index creation results
   */
  async createRequiredIndexes() {
    try {
      // Placeholder for index creation logic
      // In a real implementation, this would use the Firebase Admin SDK to create indexes
      logger.info("Simulated creating required indexes for AMIA data models", {
        contextId: this.contextId
      });

      // Log index creation
      await this.logDataEvent("indexes_created", {
        collections: ["leads", "client_configurations", "lead_engagements", "lead_conversions_events", "lead_workflows"]
      });

      return { created: true, message: "Indexes created successfully" };
    } catch (error) {
      logger.error("Error creating required indexes", {
        error,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error creating required indexes",
        ErrorTypes.UNKNOWN_ERROR,
        SeverityLevels.ERROR,
        error,
        { contextId: this.contextId }
      );
    }
  }

  /**
   * Validate database schema and create missing collections/fields
   * @returns {Promise<Object>} Validation results
   */
  async validateDatabaseSchema() {
    try {
      // Placeholder for schema validation logic
      // In a real implementation, this would check for required collections and fields
      logger.info("Simulated validating database schema for AMIA data models", {
        contextId: this.contextId
      });

      // Log schema validation
      await this.logDataEvent("schema_validated", {
        collections: ["leads", "client_configurations", "lead_engagements", "lead_conversions_events", "lead_workflows"]
      });

      return { valid: true, message: "Database schema is valid" };
    } catch (error) {
      logger.error("Error validating database schema", {
        error,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error validating database schema",
        ErrorTypes.UNKNOWN_ERROR,
        SeverityLevels.ERROR,
        error,
        { contextId: this.contextId }
      );
    }
  }
}

module.exports = {
  DataModels,
  LeadSourceType,
  LeadStatus,
  IndustryType,
  CompanySizeRange
};
