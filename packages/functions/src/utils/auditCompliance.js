/**
 * Audit and Compliance Monitoring System for ReachSpark AMIA
 * 
 * This module implements comprehensive audit logging, compliance monitoring,
 * and reporting capabilities for the Autonomous Marketing Intelligence Agent.
 */

const admin = require('firebase-admin');
const { logger, ReachSparkError, ErrorTypes, SeverityLevels } = require('./errorLogging');
const { retryWithExponentialBackoff } = require('./retryLogic');

// Firestore reference
const db = admin.firestore();

/**
 * Audit event types
 */
const AuditEventType = {
  AGENT_STATE_CHANGE: 'agent_state_change',
  AGENT_CONFIG_CHANGE: 'agent_config_change',
  BOUNDARY_VIOLATION: 'boundary_violation',
  API_KEY_ROTATION: 'api_key_rotation',
  USER_ACCESS: 'user_access',
  LEAD_DISCOVERY: 'lead_discovery',
  LEAD_CONTACT: 'lead_contact',
  LEAD_CONVERSION: 'lead_conversion',
  AD_CAMPAIGN_CHANGE: 'ad_campaign_change',
  BUDGET_CHANGE: 'budget_change',
  CONTENT_GENERATION: 'content_generation',
  SYSTEM_INTEGRATION: 'system_integration',
  DATA_EXPORT: 'data_export',
  EMERGENCY_ACTION: 'emergency_action'
};

/**
 * Compliance frameworks
 */
const ComplianceFramework = {
  GDPR: 'gdpr',
  CCPA: 'ccpa',
  CASL: 'casl',
  CAN_SPAM: 'can_spam',
  HIPAA: 'hipaa',
  PCI_DSS: 'pci_dss',
  SOC2: 'soc2',
  INTERNAL: 'internal'
};

/**
 * Audit and Compliance Manager class
 */
class AuditComplianceManager {
  constructor() {
    this.initialized = false;
    this.activeComplianceFrameworks = [];
    this.auditRetentionDays = 365; // Default retention period
    this.complianceRules = {};
  }

  /**
   * Initialize the Audit and Compliance Manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load configuration
      await this.loadConfiguration();
      
      // Set up scheduled cleanup for old audit logs
      // In a production environment, this would be a scheduled Cloud Function
      
      this.initialized = true;
      logger.info('Audit and Compliance Manager initialized successfully', {
        activeFrameworks: this.activeComplianceFrameworks,
        retentionDays: this.auditRetentionDays
      });
    } catch (error) {
      logger.error('Failed to initialize Audit and Compliance Manager', { error });
      throw error;
    }
  }

  /**
   * Load configuration from Firestore
   * @returns {Promise<void>}
   */
  async loadConfiguration() {
    try {
      const configDoc = await db.collection('settings').doc('complianceConfiguration').get();
      
      if (!configDoc.exists) {
        // Use default configuration
        logger.info('No compliance configuration found, using defaults');
        this.activeComplianceFrameworks = [ComplianceFramework.INTERNAL];
        return;
      }
      
      const config = configDoc.data();
      
      // Apply configuration
      if (config.activeFrameworks && Array.isArray(config.activeFrameworks)) {
        this.activeComplianceFrameworks = config.activeFrameworks.filter(
          framework => Object.values(ComplianceFramework).includes(framework)
        );
      }
      
      if (config.auditRetentionDays && !isNaN(config.auditRetentionDays)) {
        this.auditRetentionDays = config.auditRetentionDays;
      }
      
      // Load compliance rules
      if (config.complianceRules) {
        this.complianceRules = config.complianceRules;
      }
      
      logger.info('Compliance configuration loaded', {
        activeFrameworks: this.activeComplianceFrameworks,
        retentionDays: this.auditRetentionDays
      });
    } catch (error) {
      logger.error('Error loading compliance configuration', { error });
      // Continue with default configuration
      this.activeComplianceFrameworks = [ComplianceFramework.INTERNAL];
    }
  }

  /**
   * Log an audit event
   * @param {string} eventType - Type of audit event
   * @param {string} actorId - ID of the actor (user or system)
   * @param {Object} details - Event details
   * @param {Array} frameworks - Compliance frameworks this event relates to
   * @returns {Promise<string>} - Audit event ID
   */
  async logAuditEvent(eventType, actorId, details = {}, frameworks = []) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Validate event type
      if (!Object.values(AuditEventType).includes(eventType)) {
        logger.warn(`Unknown audit event type: ${eventType}`);
      }
      
      // Sanitize details to remove sensitive information
      const sanitizedDetails = this.sanitizeAuditDetails(details);
      
      // Create audit event
      const auditEvent = {
        eventType,
        actorId,
        details: sanitizedDetails,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        frameworks: frameworks.length > 0 ? frameworks : this.activeComplianceFrameworks,
        ipAddress: details.ipAddress || null,
        userAgent: details.userAgent || null,
        resourceId: details.resourceId || null,
        resourceType: details.resourceType || null,
        success: details.success !== false,
        eventId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
      };
      
      // Save to Firestore
      await db.collection('auditLogs').doc(auditEvent.eventId).set(auditEvent);
      
      // Check for compliance violations
      await this.checkComplianceViolations(auditEvent);
      
      return auditEvent.eventId;
    } catch (error) {
      logger.error('Error logging audit event', { error, eventType, actorId });
      
      // Try to log a simplified version in case of error
      try {
        await db.collection('auditLogs').add({
          eventType,
          actorId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          error: error.message,
          isErrorRecord: true
        });
      } catch (fallbackError) {
        logger.error('Failed to log fallback audit event', { error: fallbackError });
      }
      
      throw error;
    }
  }

  /**
   * Sanitize audit details to remove sensitive information
   * @param {Object} details - Audit details
   * @returns {Object} - Sanitized details
   */
  sanitizeAuditDetails(details) {
    // Create a copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(details));
    
    // Fields to redact
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'apiKey', 'credential',
      'ssn', 'socialSecurity', 'creditCard', 'cardNumber', 'cvv',
      'accessToken', 'refreshToken', 'privateKey'
    ];
    
    // Recursive function to sanitize nested objects
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        // Check if this is a sensitive field
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } 
        // Recursively sanitize nested objects
        else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Check for compliance violations in an audit event
   * @param {Object} auditEvent - Audit event
   * @returns {Promise<void>}
   */
  async checkComplianceViolations(auditEvent) {
    try {
      const violations = [];
      
      // Check each applicable compliance framework
      for (const framework of auditEvent.frameworks) {
        if (!this.complianceRules[framework]) continue;
        
        const rules = this.complianceRules[framework];
        
        // Check event type rules
        if (rules.eventTypes && rules.eventTypes[auditEvent.eventType]) {
          const eventRules = rules.eventTypes[auditEvent.eventType];
          
          // Check required fields
          if (eventRules.requiredFields) {
            for (const field of eventRules.requiredFields) {
              if (!this.hasNestedProperty(auditEvent.details, field)) {
                violations.push({
                  framework,
                  rule: 'requiredField',
                  field,
                  message: `Missing required field: ${field}`
                });
              }
            }
          }
          
          // Check field constraints
          if (eventRules.fieldConstraints) {
            for (const [field, constraint] of Object.entries(eventRules.fieldConstraints)) {
              const value = this.getNestedProperty(auditEvent.details, field);
              
              if (value !== undefined) {
                if (constraint.type === 'boolean' && typeof value !== 'boolean') {
                  violations.push({
                    framework,
                    rule: 'fieldType',
                    field,
                    message: `Field ${field} must be a boolean`
                  });
                } else if (constraint.type === 'number' && typeof value !== 'number') {
                  violations.push({
                    framework,
                    rule: 'fieldType',
                    field,
                    message: `Field ${field} must be a number`
                  });
                } else if (constraint.type === 'string' && typeof value !== 'string') {
                  violations.push({
                    framework,
                    rule: 'fieldType',
                    field,
                    message: `Field ${field} must be a string`
                  });
                }
                
                if (constraint.minLength && typeof value === 'string' && value.length < constraint.minLength) {
                  violations.push({
                    framework,
                    rule: 'minLength',
                    field,
                    message: `Field ${field} must be at least ${constraint.minLength} characters`
                  });
                }
                
                if (constraint.maxLength && typeof value === 'string' && value.length > constraint.maxLength) {
                  violations.push({
                    framework,
                    rule: 'maxLength',
                    field,
                    message: `Field ${field} must be at most ${constraint.maxLength} characters`
                  });
                }
                
                if (constraint.min && typeof value === 'number' && value < constraint.min) {
                  violations.push({
                    framework,
                    rule: 'min',
                    field,
                    message: `Field ${field} must be at least ${constraint.min}`
                  });
                }
                
                if (constraint.max && typeof value === 'number' && value > constraint.max) {
                  violations.push({
                    framework,
                    rule: 'max',
                    field,
                    message: `Field ${field} must be at most ${constraint.max}`
                  });
                }
                
                if (constraint.pattern && typeof value === 'string' && !new RegExp(constraint.pattern).test(value)) {
                  violations.push({
                    framework,
                    rule: 'pattern',
                    field,
                    message: `Field ${field} does not match required pattern`
                  });
                }
                
                if (constraint.allowedValues && !constraint.allowedValues.includes(value)) {
                  violations.push({
                    framework,
                    rule: 'allowedValues',
                    field,
                    message: `Field ${field} must be one of: ${constraint.allowedValues.join(', ')}`
                  });
                }
              }
            }
          }
        }
      }
      
      // If violations found, log them
      if (violations.length > 0) {
        await db.collection('complianceViolations').add({
          auditEventId: auditEvent.eventId,
          eventType: auditEvent.eventType,
          violations,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        logger.warn('Compliance violations detected', { 
          auditEventId: auditEvent.eventId, 
          violations 
        });
      }
    } catch (error) {
      logger.error('Error checking compliance violations', { error, auditEventId: auditEvent.eventId });
    }
  }

  /**
   * Check if an object has a nested property
   * @param {Object} obj - Object to check
   * @param {string} path - Property path (e.g., 'user.profile.name')
   * @returns {boolean} - Whether the property exists
   */
  hasNestedProperty(obj, path) {
    return this.getNestedProperty(obj, path) !== undefined;
  }

  /**
   * Get a nested property from an object
   * @param {Object} obj - Object to get property from
   * @param {string} path - Property path (e.g., 'user.profile.name')
   * @returns {any} - Property value or undefined if not found
   */
  getNestedProperty(obj, path) {
    if (!obj || !path) return undefined;
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Get audit logs for a specific resource
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Audit logs
   */
  async getAuditLogs(options = {}) {
    try {
      const {
        resourceId,
        resourceType,
        actorId,
        eventType,
        startDate,
        endDate,
        limit = 100,
        frameworks = []
      } = options;
      
      let query = db.collection('auditLogs');
      
      // Apply filters
      if (resourceId) {
        query = query.where('resourceId', '==', resourceId);
      }
      
      if (resourceType) {
        query = query.where('resourceType', '==', resourceType);
      }
      
      if (actorId) {
        query = query.where('actorId', '==', actorId);
      }
      
      if (eventType) {
        query = query.where('eventType', '==', eventType);
      }
      
      if (frameworks.length > 0) {
        // This requires a composite index in Firestore
        query = query.where('frameworks', 'array-contains-any', frameworks);
      }
      
      // Apply date range
      if (startDate) {
        const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(startDate));
        query = query.where('timestamp', '>=', startTimestamp);
      }
      
      if (endDate) {
        const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(endDate));
        query = query.where('timestamp', '<=', endTimestamp);
      }
      
      // Order and limit
      query = query.orderBy('timestamp', 'desc').limit(limit);
      
      // Execute query
      const snapshot = await query.get();
      
      const logs = [];
      snapshot.forEach(doc => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return logs;
    } catch (error) {
      logger.error('Error getting audit logs', { error, options });
      throw error;
    }
  }

  /**
   * Get compliance violations
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Compliance violations
   */
  async getComplianceViolations(options = {}) {
    try {
      const {
        auditEventId,
        eventType,
        framework,
        startDate,
        endDate,
        limit = 100
      } = options;
      
      let query = db.collection('complianceViolations');
      
      // Apply filters
      if (auditEventId) {
        query = query.where('auditEventId', '==', auditEventId);
      }
      
      if (eventType) {
        query = query.where('eventType', '==', eventType);
      }
      
      // Apply date range
      if (startDate) {
        const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(startDate));
        query = query.where('timestamp', '>=', startTimestamp);
      }
      
      if (endDate) {
        const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(endDate));
        query = query.where('timestamp', '<=', endTimestamp);
      }
      
      // Order and limit
      query = query.orderBy('timestamp', 'desc').limit(limit);
      
      // Execute query
      const snapshot = await query.get();
      
      const violations = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Filter by framework if specified
        if (framework) {
          data.violations = data.violations.filter(v => v.framework === framework);
          
          // Skip if no violations for this framework
          if (data.violations.length === 0) {
            return;
          }
        }
        
        violations.push({
          id: doc.id,
          ...data
        });
      });
      
      return violations;
    } catch (error) {
      logger.error('Error getting compliance violations', { error, options });
      throw error;
    }
  }

  /**
   * Generate a compliance report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} - Compliance report
   */
  async generateComplianceReport(options = {}) {
    try {
      const {
        framework,
        startDate,
        endDate = new Date(),
        includeViolations = true,
        includeAuditLogs = true
      } = options;
      
      // Validate framework
      if (!framework || !Object.values(ComplianceFramework).includes(framework)) {
        throw new ReachSparkError(
          `Invalid compliance framework: ${framework}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Default start date to 30 days ago if not specified
      const reportStartDate = startDate ? new Date(startDate) : new Date(endDate);
      if (!startDate) {
        reportStartDate.setDate(reportStartDate.getDate() - 30);
      }
      
      const reportEndDate = new Date(endDate);
      
      // Get violations if requested
      let violations = [];
      if (includeViolations) {
        violations = await this.getComplianceViolations({
          framework,
          startDate: reportStartDate,
          endDate: reportEndDate,
          limit: 1000
        });
      }
      
      // Get audit logs if requested
      let auditLogs = [];
      if (includeAuditLogs) {
        auditLogs = await this.getAuditLogs({
          frameworks: [framework],
          startDate: reportStartDate,
          endDate: reportEndDate,
          limit: 1000
        });
      }
      
      // Calculate compliance metrics
      const totalEvents = auditLogs.length;
      const totalViolations = violations.length;
      const complianceRate = totalEvents > 0 ? ((totalEvents - totalViolations) / totalEvents) * 100 : 100;
      
      // Group violations by type
      const violationsByType = {};
      violations.forEach(violation => {
        violation.violations.forEach(v => {
          const type = v.rule;
          violationsByType[type] = (violationsByType[type] || 0) + 1;
        });
      });
      
      // Group events by type
      const eventsByType = {};
      auditLogs.forEach(log => {
        const type = log.eventType;
        eventsByType[type] = (eventsByType[type] || 0) + 1;
      });
      
      // Create report
      const report = {
        framework,
        startDate: reportStartDate,
        endDate: reportEndDate,
        generatedAt: new Date(),
        metrics: {
          totalEvents,
          totalViolations,
          complianceRate: complianceRate.toFixed(2),
          violationsByType,
          eventsByType
        },
        summary: `Compliance rate for ${framework} from ${reportStartDate.toISOString().split('T')[0]} to ${reportEndDate.toISOString().split('T')[0]}: ${complianceRate.toFixed(2)}%`,
        violations: includeViolations ? violations : [],
        auditLogs: includeAuditLogs ? auditLogs : []
      };
      
      // Save report to Firestore
      const reportRef = await db.collection('complianceReports').add({
        ...report,
        metrics: report.metrics,
        violations: [], // Don't store full violations in report metadata
        auditLogs: [],  // Don't store full audit logs in report metadata
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // If including full data, store in subcollections
      if (includeViolations && violations.length > 0) {
        const violationsBatch = db.batch();
        violations.forEach((violation, index) => {
          const violationRef = reportRef.collection('violations').doc(index.toString());
          violationsBatch.set(violationRef, violation);
        });
        await violationsBatch.commit();
      }
      
      if (includeAuditLogs && auditLogs.length > 0) {
        // Store in chunks to avoid batch size limits
        const chunkSize = 500;
        for (let i = 0; i < auditLogs.length; i += chunkSize) {
          const chunk = auditLogs.slice(i, i + chunkSize);
          const logsBatch = db.batch();
          
          chunk.forEach((log, index) => {
            const logRef = reportRef.collection('auditLogs').doc((i + index).toString());
            logsBatch.set(logRef, log);
          });
          
          await logsBatch.commit();
        }
      }
      
      return {
        ...report,
        id: reportRef.id
      };
    } catch (error) {
      logger.error('Error generating compliance report', { error, options });
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupOldAuditLogs() {
    try {
      // Calculate cutoff date
      const now = new Date();
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - this.auditRetentionDays);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);
      
      // Get old audit logs
      const oldLogsQuery = db.collection('auditLogs')
        .where('timestamp', '<', cutoffTimestamp)
        .limit(500); // Process in batches
      
      const snapshot = await oldLogsQuery.get();
      
      if (snapshot.empty) {
        return { success: true, deletedCount: 0, message: 'No old audit logs to delete' };
      }
      
      // Delete old logs
      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Log the cleanup
      logger.info('Cleaned up old audit logs', {
        deletedCount: snapshot.size,
        cutoffDate: cutoffDate.toISOString()
      });
      
      // If we hit the batch limit, there might be more to delete
      const moreToDelete = snapshot.size === 500;
      
      return {
        success: true,
        deletedCount: snapshot.size,
        moreToDelete,
        message: `Deleted ${snapshot.size} old audit logs`
      };
    } catch (error) {
      logger.error('Error cleaning up old audit logs', { error });
      return {
        success: false,
        error: error.message,
        message: 'Failed to clean up old audit logs'
      };
    }
  }

  /**
   * Update compliance configuration
   * @param {Object} config - New configuration
   * @param {string} updatedBy - User ID who updated the configuration
   * @returns {Promise<Object>} - Update result
   */
  async updateComplianceConfiguration(config, updatedBy) {
    try {
      // Validate configuration
      if (config.activeFrameworks) {
        config.activeFrameworks = config.activeFrameworks.filter(
          framework => Object.values(ComplianceFramework).includes(framework)
        );
      }
      
      if (config.auditRetentionDays && (isNaN(config.auditRetentionDays) || config.auditRetentionDays < 1)) {
        throw new ReachSparkError(
          'Audit retention days must be a positive number',
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Update configuration in Firestore
      await db.collection('settings').doc('complianceConfiguration').set({
        ...config,
        updatedBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Update local configuration
      if (config.activeFrameworks) {
        this.activeComplianceFrameworks = config.activeFrameworks;
      }
      
      if (config.auditRetentionDays) {
        this.auditRetentionDays = config.auditRetentionDays;
      }
      
      if (config.complianceRules) {
        this.complianceRules = config.complianceRules;
      }
      
      // Log the update
      await this.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        updatedBy,
        {
          component: 'compliance',
          changes: config,
          success: true
        }
      );
      
      return {
        success: true,
        message: 'Compliance configuration updated successfully'
      };
    } catch (error) {
      logger.error('Error updating compliance configuration', { error, config });
      
      // Log the failed update
      await this.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        updatedBy,
        {
          component: 'compliance',
          changes: config,
          success: false,
          error: error.message
        }
      );
      
      throw error;
    }
  }
}

module.exports = {
  AuditComplianceManager,
  AuditEventType,
  ComplianceFramework
};
