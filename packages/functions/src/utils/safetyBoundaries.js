/**
 * Safety Boundaries and Operational Controls for ReachSpark AMIA
 * 
 * This module implements safety boundaries, operational controls, and compliance
 * mechanisms for the Autonomous Marketing Intelligence Agent (AMIA).
 */

const admin = require('firebase-admin');
const { logger, ReachSparkError, ErrorTypes, SeverityLevels } = require('./errorLogging');
const { retryWithExponentialBackoff } = require('./retryLogic');

// Firestore reference
const db = admin.firestore();

/**
 * Boundary types for agent operations
 */
const BoundaryType = {
  BUDGET: 'budget',           // Financial spending limits
  RATE: 'rate',               // Rate of operations (e.g., messages per hour)
  SCOPE: 'scope',             // Allowed operation types and domains
  TIME: 'time',               // Time-based restrictions
  CONTENT: 'content',         // Content-based restrictions
  COMPLIANCE: 'compliance',   // Regulatory and legal compliance
  ETHICS: 'ethics'            // Ethical guidelines
};

/**
 * Boundary violation severity levels
 */
const ViolationSeverity = {
  INFO: 'info',               // Informational, no action needed
  WARNING: 'warning',         // Warning, may need attention
  MODERATE: 'moderate',       // Moderate violation, requires attention
  SEVERE: 'severe',           // Severe violation, requires immediate action
  CRITICAL: 'critical'        // Critical violation, triggers emergency protocols
};

/**
 * Boundary enforcement actions
 */
const EnforcementAction = {
  LOG: 'log',                 // Log the violation only
  NOTIFY: 'notify',           // Notify owner/admin
  THROTTLE: 'throttle',       // Slow down operations
  PAUSE: 'pause',             // Pause the specific operation
  BLOCK: 'block',             // Block the operation
  ESCALATE: 'escalate',       // Escalate to human review
  SHUTDOWN: 'shutdown'        // Emergency shutdown of agent
};

/**
 * Safety Boundaries Manager class
 */
class SafetyBoundariesManager {
  constructor() {
    this.boundaries = {};
    this.violationHistory = [];
    this.MAX_VIOLATION_HISTORY = 100;
    this.initialized = false;
  }

  /**
   * Initialize the Safety Boundaries Manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load boundaries from Firestore
      await this.loadBoundaries();
      
      // Set up real-time listener for boundary updates
      this.boundariesListener = db.collection('safetyBoundaries')
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
              const boundary = change.doc.data();
              this.boundaries[change.doc.id] = boundary;
              logger.info(`Boundary updated: ${change.doc.id}`);
            }
            if (change.type === 'removed') {
              delete this.boundaries[change.doc.id];
              logger.info(`Boundary removed: ${change.doc.id}`);
            }
          });
        }, error => {
          logger.error('Error in boundaries listener', { error });
        });
      
      this.initialized = true;
      logger.info('Safety Boundaries Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Safety Boundaries Manager', { error });
      throw error;
    }
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      // Remove Firestore listener
      if (this.boundariesListener) {
        this.boundariesListener();
        this.boundariesListener = null;
      }
      
      logger.info('Safety Boundaries Manager resources cleaned up');
    } catch (error) {
      logger.error('Error cleaning up Safety Boundaries Manager resources', { error });
    }
  }

  /**
   * Load boundaries from Firestore
   * @returns {Promise<void>}
   */
  async loadBoundaries() {
    try {
      const snapshot = await db.collection('safetyBoundaries').get();
      
      this.boundaries = {};
      snapshot.forEach(doc => {
        this.boundaries[doc.id] = doc.data();
      });
      
      logger.info('Boundaries loaded successfully', { boundaryCount: snapshot.size });
    } catch (error) {
      logger.error('Error loading boundaries', { error });
      throw error;
    }
  }

  /**
   * Check if an operation is within boundaries
   * @param {string} operationType - Type of operation
   * @param {Object} context - Operation context
   * @returns {Promise<Object>} - Check result
   */
  async checkBoundaries(operationType, context = {}) {
    try {
      if (!this.initialized) {
        throw new ReachSparkError(
          'Safety Boundaries Manager not initialized',
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      const result = {
        allowed: true,
        violations: [],
        enforcementActions: []
      };
      
      // Find applicable boundaries for this operation type
      const applicableBoundaries = Object.values(this.boundaries).filter(boundary => 
        boundary.operationTypes.includes(operationType) && boundary.isActive
      );
      
      // Check each applicable boundary
      for (const boundary of applicableBoundaries) {
        const checkResult = await this.checkSingleBoundary(boundary, operationType, context);
        
        if (!checkResult.compliant) {
          result.allowed = result.allowed && !checkResult.blocking;
          result.violations.push(checkResult.violation);
          
          // Add enforcement actions if not already included
          checkResult.enforcementActions.forEach(action => {
            if (!result.enforcementActions.includes(action)) {
              result.enforcementActions.push(action);
            }
          });
        }
      }
      
      // If violations found, log them
      if (result.violations.length > 0) {
        await this.logViolations(result.violations, operationType, context);
      }
      
      return result;
    } catch (error) {
      logger.error('Error checking boundaries', { error, operationType });
      
      // Default to blocking on error for safety
      return {
        allowed: false,
        violations: [{
          boundaryId: 'error',
          boundaryType: 'system',
          severity: ViolationSeverity.SEVERE,
          message: `Error checking boundaries: ${error.message}`
        }],
        enforcementActions: [EnforcementAction.BLOCK, EnforcementAction.NOTIFY]
      };
    }
  }

  /**
   * Check a single boundary
   * @param {Object} boundary - Boundary definition
   * @param {string} operationType - Type of operation
   * @param {Object} context - Operation context
   * @returns {Promise<Object>} - Check result
   */
  async checkSingleBoundary(boundary, operationType, context) {
    try {
      let compliant = true;
      let message = '';
      
      // Check based on boundary type
      switch (boundary.boundaryType) {
        case BoundaryType.BUDGET:
          compliant = await this.checkBudgetBoundary(boundary, context);
          message = compliant ? '' : `Budget limit exceeded: ${boundary.limit} ${boundary.unit}`;
          break;
          
        case BoundaryType.RATE:
          compliant = await this.checkRateBoundary(boundary, context);
          message = compliant ? '' : `Rate limit exceeded: ${boundary.limit} ${boundary.unit}`;
          break;
          
        case BoundaryType.SCOPE:
          compliant = this.checkScopeBoundary(boundary, context);
          message = compliant ? '' : `Operation outside allowed scope`;
          break;
          
        case BoundaryType.TIME:
          compliant = this.checkTimeBoundary(boundary, context);
          message = compliant ? '' : `Operation outside allowed time window`;
          break;
          
        case BoundaryType.CONTENT:
          compliant = await this.checkContentBoundary(boundary, context);
          message = compliant ? '' : `Content violates guidelines`;
          break;
          
        case BoundaryType.COMPLIANCE:
          compliant = this.checkComplianceBoundary(boundary, context);
          message = compliant ? '' : `Operation violates compliance requirements`;
          break;
          
        case BoundaryType.ETHICS:
          compliant = await this.checkEthicsBoundary(boundary, context);
          message = compliant ? '' : `Operation violates ethical guidelines`;
          break;
          
        default:
          logger.warn(`Unknown boundary type: ${boundary.boundaryType}`);
          compliant = true;
      }
      
      // If not compliant, determine enforcement actions
      const enforcementActions = [];
      let blocking = false;
      
      if (!compliant) {
        // Get enforcement actions based on violation severity
        const severity = boundary.severity || ViolationSeverity.WARNING;
        
        // Always log violations
        enforcementActions.push(EnforcementAction.LOG);
        
        // Add additional enforcement actions based on severity
        switch (severity) {
          case ViolationSeverity.INFO:
            // Just log, no additional actions
            break;
            
          case ViolationSeverity.WARNING:
            enforcementActions.push(EnforcementAction.NOTIFY);
            break;
            
          case ViolationSeverity.MODERATE:
            enforcementActions.push(EnforcementAction.NOTIFY);
            enforcementActions.push(EnforcementAction.THROTTLE);
            break;
            
          case ViolationSeverity.SEVERE:
            enforcementActions.push(EnforcementAction.NOTIFY);
            enforcementActions.push(EnforcementAction.BLOCK);
            blocking = true;
            break;
            
          case ViolationSeverity.CRITICAL:
            enforcementActions.push(EnforcementAction.NOTIFY);
            enforcementActions.push(EnforcementAction.BLOCK);
            enforcementActions.push(EnforcementAction.SHUTDOWN);
            blocking = true;
            break;
            
          default:
            enforcementActions.push(EnforcementAction.NOTIFY);
            enforcementActions.push(EnforcementAction.BLOCK);
            blocking = true;
        }
      }
      
      return {
        compliant,
        blocking,
        enforcementActions,
        violation: compliant ? null : {
          boundaryId: boundary.id,
          boundaryType: boundary.boundaryType,
          severity: boundary.severity || ViolationSeverity.WARNING,
          message: message || 'Boundary violation detected',
          details: {
            boundary,
            context
          }
        }
      };
    } catch (error) {
      logger.error('Error checking single boundary', { error, boundaryId: boundary.id });
      
      // Default to non-compliant on error for safety
      return {
        compliant: false,
        blocking: true,
        enforcementActions: [EnforcementAction.LOG, EnforcementAction.NOTIFY, EnforcementAction.BLOCK],
        violation: {
          boundaryId: boundary.id,
          boundaryType: boundary.boundaryType,
          severity: ViolationSeverity.SEVERE,
          message: `Error checking boundary: ${error.message}`,
          details: {
            boundary,
            error: error.message
          }
        }
      };
    }
  }

  /**
   * Check budget boundary
   * @param {Object} boundary - Budget boundary definition
   * @param {Object} context - Operation context
   * @returns {Promise<boolean>} - Whether operation is within budget boundary
   */
  async checkBudgetBoundary(boundary, context) {
    try {
      const { budgetId, timeframe, limit } = boundary;
      
      if (!budgetId || !context.cost) {
        // If no budget ID or cost provided, default to compliant
        return true;
      }
      
      // Get current spending for this budget
      const budgetDoc = await db.collection('budgets').doc(budgetId).get();
      
      if (!budgetDoc.exists) {
        logger.warn(`Budget not found: ${budgetId}`);
        return false; // Fail closed if budget doesn't exist
      }
      
      const budget = budgetDoc.data();
      const currentSpend = budget.currentSpend || 0;
      const budgetLimit = budget.limit || 0;
      
      // Check if operation would exceed budget
      const newSpend = currentSpend + context.cost;
      return newSpend <= budgetLimit;
    } catch (error) {
      logger.error('Error checking budget boundary', { error, boundary });
      return false; // Fail closed on error
    }
  }

  /**
   * Check rate boundary
   * @param {Object} boundary - Rate boundary definition
   * @param {Object} context - Operation context
   * @returns {Promise<boolean>} - Whether operation is within rate boundary
   */
  async checkRateBoundary(boundary, context) {
    try {
      const { limit, unit, timeWindowMinutes } = boundary;
      
      if (!limit || !unit || !timeWindowMinutes) {
        // If missing parameters, default to compliant
        return true;
      }
      
      // Calculate time window
      const now = admin.firestore.Timestamp.now();
      const windowStart = new admin.firestore.Timestamp(
        now.seconds - (timeWindowMinutes * 60),
        now.nanoseconds
      );
      
      // Query operations in the time window
      const operationsQuery = await db.collection('operationLogs')
        .where('type', '==', context.operationType)
        .where('timestamp', '>=', windowStart)
        .count()
        .get();
      
      const operationCount = operationsQuery.data().count;
      
      // Check if new operation would exceed rate limit
      return operationCount < limit;
    } catch (error) {
      logger.error('Error checking rate boundary', { error, boundary });
      return false; // Fail closed on error
    }
  }

  /**
   * Check scope boundary
   * @param {Object} boundary - Scope boundary definition
   * @param {Object} context - Operation context
   * @returns {boolean} - Whether operation is within scope boundary
   */
  checkScopeBoundary(boundary, context) {
    try {
      const { allowedDomains, allowedActions } = boundary;
      
      // Check domain if specified
      if (allowedDomains && allowedDomains.length > 0 && context.domain) {
        if (!allowedDomains.includes(context.domain)) {
          return false;
        }
      }
      
      // Check action if specified
      if (allowedActions && allowedActions.length > 0 && context.action) {
        if (!allowedActions.includes(context.action)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking scope boundary', { error, boundary });
      return false; // Fail closed on error
    }
  }

  /**
   * Check time boundary
   * @param {Object} boundary - Time boundary definition
   * @param {Object} context - Operation context
   * @returns {boolean} - Whether operation is within time boundary
   */
  checkTimeBoundary(boundary, context) {
    try {
      const { allowedDays, allowedHoursStart, allowedHoursEnd, timezone } = boundary;
      
      const now = new Date();
      
      // Adjust for timezone if specified
      let localNow = now;
      if (timezone) {
        localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      }
      
      // Check day of week if specified
      if (allowedDays && allowedDays.length > 0) {
        const dayOfWeek = localNow.getDay(); // 0 = Sunday, 6 = Saturday
        if (!allowedDays.includes(dayOfWeek)) {
          return false;
        }
      }
      
      // Check time of day if specified
      if (allowedHoursStart !== undefined && allowedHoursEnd !== undefined) {
        const hour = localNow.getHours();
        
        // Handle time ranges that span midnight
        if (allowedHoursStart <= allowedHoursEnd) {
          // Normal time range (e.g., 9-17)
          if (hour < allowedHoursStart || hour >= allowedHoursEnd) {
            return false;
          }
        } else {
          // Time range spans midnight (e.g., 22-6)
          if (hour < allowedHoursStart && hour >= allowedHoursEnd) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking time boundary', { error, boundary });
      return false; // Fail closed on error
    }
  }

  /**
   * Check content boundary
   * @param {Object} boundary - Content boundary definition
   * @param {Object} context - Operation context
   * @returns {Promise<boolean>} - Whether content is within boundary
   */
  async checkContentBoundary(boundary, context) {
    try {
      const { prohibitedTerms, contentField, contentModeration } = boundary;
      
      // Get content to check
      const content = context[contentField];
      if (!content) {
        return true; // No content to check
      }
      
      // Check for prohibited terms
      if (prohibitedTerms && prohibitedTerms.length > 0) {
        const contentLower = content.toLowerCase();
        for (const term of prohibitedTerms) {
          if (contentLower.includes(term.toLowerCase())) {
            return false;
          }
        }
      }
      
      // Use content moderation API if enabled
      if (contentModeration && context.performModeration) {
        const moderationResult = await this.performContentModeration(content);
        return moderationResult.approved;
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking content boundary', { error, boundary });
      return false; // Fail closed on error
    }
  }

  /**
   * Perform content moderation
   * @param {string} content - Content to moderate
   * @returns {Promise<Object>} - Moderation result
   */
  async performContentModeration(content) {
    try {
      // Get API key from secure storage
      const apiKeyDoc = await db.collection('apiCredentials')
        .where('provider', '==', 'content_moderation')
        .where('isActive', '==', true)
        .limit(1)
        .get();
      
      if (apiKeyDoc.empty) {
        logger.error('No active content moderation API key found');
        return { approved: false, reason: 'No moderation API available' };
      }
      
      const apiKey = apiKeyDoc.docs[0].data().key;
      
      // Call moderation API with retry logic
      const moderationResult = await retryWithExponentialBackoff(async () => {
        // This would be an actual API call in production
        // For now, we'll simulate a moderation check
        
        // Check for obvious problematic content
        const problematicTerms = [
          'illegal', 'fraud', 'scam', 'hack', 'crack', 'steal', 'porn',
          'gambling', 'betting', 'drugs', 'weapon', 'violence'
        ];
        
        const contentLower = content.toLowerCase();
        for (const term of problematicTerms) {
          if (contentLower.includes(term)) {
            return {
              approved: false,
              reason: `Content contains prohibited term: ${term}`,
              confidence: 0.95
            };
          }
        }
        
        return {
          approved: true,
          confidence: 0.9
        };
      }, {
        maxRetries: 3,
        initialDelayMs: 1000,
      });
      
      return moderationResult;
    } catch (error) {
      logger.error('Error performing content moderation', { error });
      return { approved: false, reason: `Moderation error: ${error.message}` };
    }
  }

  /**
   * Check compliance boundary
   * @param {Object} boundary - Compliance boundary definition
   * @param {Object} context - Operation context
   * @returns {boolean} - Whether operation is compliant
   */
  checkComplianceBoundary(boundary, context) {
    try {
      const { regulations, requiredFields, requiredConsent } = boundary;
      
      // Check required fields
      if (requiredFields && requiredFields.length > 0) {
        for (const field of requiredFields) {
          if (!context[field]) {
            return false;
          }
        }
      }
      
      // Check consent
      if (requiredConsent && !context.hasConsent) {
        return false;
      }
      
      // Additional compliance checks would go here
      
      return true;
    } catch (error) {
      logger.error('Error checking compliance boundary', { error, boundary });
      return false; // Fail closed on error
    }
  }

  /**
   * Check ethics boundary
   * @param {Object} boundary - Ethics boundary definition
   * @param {Object} context - Operation context
   * @returns {Promise<boolean>} - Whether operation is ethical
   */
  async checkEthicsBoundary(boundary, context) {
    try {
      const { ethicalGuidelines, performEthicsCheck } = boundary;
      
      // Simple check for ethical guidelines
      if (ethicalGuidelines && ethicalGuidelines.length > 0 && context.description) {
        // Check if operation description violates any guidelines
        for (const guideline of ethicalGuidelines) {
          if (context.description.toLowerCase().includes(guideline.trigger.toLowerCase())) {
            return false;
          }
        }
      }
      
      // Perform deeper ethics check if enabled
      if (performEthicsCheck && context.performEthicsCheck) {
        const ethicsResult = await this.performEthicsCheck(context);
        return ethicsResult.ethical;
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking ethics boundary', { error, boundary });
      return false; // Fail closed on error
    }
  }

  /**
   * Perform ethics check
   * @param {Object} context - Operation context
   * @returns {Promise<Object>} - Ethics check result
   */
  async performEthicsCheck(context) {
    try {
      // In a production environment, this would use an LLM or specialized ethics API
      // For now, we'll implement a simple check
      
      const ethicalConcerns = [
        'manipulation', 'deception', 'exploitation', 'discrimination',
        'privacy violation', 'harassment', 'unfair', 'misleading'
      ];
      
      // Check operation description for ethical concerns
      if (context.description) {
        const descriptionLower = context.description.toLowerCase();
        for (const concern of ethicalConcerns) {
          if (descriptionLower.includes(concern)) {
            return {
              ethical: false,
              reason: `Operation may involve ${concern}`,
              confidence: 0.8
            };
          }
        }
      }
      
      // Check operation target for vulnerable groups
      if (context.targetAudience) {
        const vulnerableGroups = ['children', 'elderly', 'disabled', 'disadvantaged'];
        const audienceLower = context.targetAudience.toLowerCase();
        
        for (const group of vulnerableGroups) {
          if (audienceLower.includes(group)) {
            return {
              ethical: false,
              reason: `Operation targets potentially vulnerable group: ${group}`,
              confidence: 0.7
            };
          }
        }
      }
      
      return {
        ethical: true,
        confidence: 0.9
      };
    } catch (error) {
      logger.error('Error performing ethics check', { error });
      return { ethical: false, reason: `Ethics check error: ${error.message}` };
    }
  }

  /**
   * Log boundary violations
   * @param {Array} violations - List of violations
   * @param {string} operationType - Type of operation
   * @param {Object} context - Operation context
   * @returns {Promise<void>}
   */
  async logViolations(violations, operationType, context) {
    try {
      // Add to in-memory history
      violations.forEach(violation => {
        this.violationHistory.push({
          ...violation,
          operationType,
          timestamp: new Date()
        });
      });
      
      // Trim history if needed
      if (this.violationHistory.length > this.MAX_VIOLATION_HISTORY) {
        this.violationHistory = this.violationHistory.slice(-this.MAX_VIOLATION_HISTORY);
      }
      
      // Log to Firestore
      const batch = db.batch();
      
      violations.forEach(violation => {
        const violationRef = db.collection('boundaryViolations').doc();
        batch.set(violationRef, {
          ...violation,
          operationType,
          context: this.sanitizeContext(context),
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      // Log critical violations to error logs
      const criticalViolations = violations.filter(v => 
        v.severity === ViolationSeverity.SEVERE || v.severity === ViolationSeverity.CRITICAL
      );
      
      if (criticalViolations.length > 0) {
        criticalViolations.forEach(violation => {
          logger.error('Critical boundary violation', {
            violation,
            operationType,
            context: this.sanitizeContext(context)
          });
        });
      }
    } catch (error) {
      logger.error('Error logging boundary violations', { error, violations });
    }
  }

  /**
   * Sanitize context for logging (remove sensitive data)
   * @param {Object} context - Operation context
   * @returns {Object} - Sanitized context
   */
  sanitizeContext(context) {
    // Create a copy to avoid modifying the original
    const sanitized = { ...context };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'credential',
      'ssn', 'socialSecurity', 'creditCard', 'cardNumber'
    ];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Get recent boundary violations
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Recent violations
   */
  async getRecentViolations(options = {}) {
    try {
      const { limit = 50, boundaryType, severity, operationType } = options;
      
      let query = db.collection('boundaryViolations')
        .orderBy('timestamp', 'desc')
        .limit(limit);
      
      if (boundaryType) {
        query = query.where('boundaryType', '==', boundaryType);
      }
      
      if (severity) {
        query = query.where('severity', '==', severity);
      }
      
      if (operationType) {
        query = query.where('operationType', '==', operationType);
      }
      
      const snapshot = await query.get();
      
      const violations = [];
      snapshot.forEach(doc => {
        violations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return violations;
    } catch (error) {
      logger.error('Error getting recent violations', { error, options });
      throw error;
    }
  }

  /**
   * Create a new boundary
   * @param {Object} boundary - Boundary definition
   * @param {string} createdBy - User ID who created the boundary
   * @returns {Promise<string>} - Boundary ID
   */
  async createBoundary(boundary, createdBy) {
    try {
      // Validate boundary
      this.validateBoundary(boundary);
      
      // Add metadata
      const boundaryWithMeta = {
        ...boundary,
        createdBy,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: createdBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: boundary.isActive !== false
      };
      
      // Save to Firestore
      const docRef = db.collection('safetyBoundaries').doc();
      await docRef.set(boundaryWithMeta);
      
      // Add to local cache
      this.boundaries[docRef.id] = {
        ...boundaryWithMeta,
        id: docRef.id
      };
      
      logger.info('Boundary created', { boundaryId: docRef.id, boundaryType: boundary.boundaryType });
      
      return docRef.id;
    } catch (error) {
      logger.error('Error creating boundary', { error, boundary });
      throw error;
    }
  }

  /**
   * Update an existing boundary
   * @param {string} boundaryId - Boundary ID
   * @param {Object} updates - Boundary updates
   * @param {string} updatedBy - User ID who updated the boundary
   * @returns {Promise<void>}
   */
  async updateBoundary(boundaryId, updates, updatedBy) {
    try {
      // Check if boundary exists
      const docRef = db.collection('safetyBoundaries').doc(boundaryId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new ReachSparkError(
          `Boundary not found: ${boundaryId}`,
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Add metadata
      const updatesWithMeta = {
        ...updates,
        updatedBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Update in Firestore
      await docRef.update(updatesWithMeta);
      
      // Update local cache
      this.boundaries[boundaryId] = {
        ...this.boundaries[boundaryId],
        ...updatesWithMeta,
        id: boundaryId
      };
      
      logger.info('Boundary updated', { boundaryId, updates });
    } catch (error) {
      logger.error('Error updating boundary', { error, boundaryId, updates });
      throw error;
    }
  }

  /**
   * Delete a boundary
   * @param {string} boundaryId - Boundary ID
   * @param {string} deletedBy - User ID who deleted the boundary
   * @returns {Promise<void>}
   */
  async deleteBoundary(boundaryId, deletedBy) {
    try {
      // Check if boundary exists
      const docRef = db.collection('safetyBoundaries').doc(boundaryId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new ReachSparkError(
          `Boundary not found: ${boundaryId}`,
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Delete from Firestore
      await docRef.delete();
      
      // Remove from local cache
      delete this.boundaries[boundaryId];
      
      // Log deletion
      await db.collection('boundaryAuditLog').add({
        action: 'delete',
        boundaryId,
        boundaryType: doc.data().boundaryType,
        performedBy: deletedBy,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      logger.info('Boundary deleted', { boundaryId, deletedBy });
    } catch (error) {
      logger.error('Error deleting boundary', { error, boundaryId });
      throw error;
    }
  }

  /**
   * Validate boundary definition
   * @param {Object} boundary - Boundary definition
   * @throws {ReachSparkError} If validation fails
   */
  validateBoundary(boundary) {
    // Check required fields
    if (!boundary.name) {
      throw new ReachSparkError(
        'Boundary name is required',
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR
      );
    }
    
    if (!boundary.boundaryType) {
      throw new ReachSparkError(
        'Boundary type is required',
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR
      );
    }
    
    if (!Object.values(BoundaryType).includes(boundary.boundaryType)) {
      throw new ReachSparkError(
        `Invalid boundary type: ${boundary.boundaryType}`,
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR
      );
    }
    
    if (!boundary.operationTypes || !Array.isArray(boundary.operationTypes) || boundary.operationTypes.length === 0) {
      throw new ReachSparkError(
        'At least one operation type is required',
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR
      );
    }
    
    // Validate severity if provided
    if (boundary.severity && !Object.values(ViolationSeverity).includes(boundary.severity)) {
      throw new ReachSparkError(
        `Invalid violation severity: ${boundary.severity}`,
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR
      );
    }
    
    // Type-specific validation
    switch (boundary.boundaryType) {
      case BoundaryType.BUDGET:
        if (boundary.limit === undefined || isNaN(boundary.limit) || boundary.limit < 0) {
          throw new ReachSparkError(
            'Budget boundary requires a valid numeric limit',
            ErrorTypes.VALIDATION_ERROR,
            SeverityLevels.ERROR
          );
        }
        break;
        
      case BoundaryType.RATE:
        if (boundary.limit === undefined || isNaN(boundary.limit) || boundary.limit < 0) {
          throw new ReachSparkError(
            'Rate boundary requires a valid numeric limit',
            ErrorTypes.VALIDATION_ERROR,
            SeverityLevels.ERROR
          );
        }
        
        if (boundary.timeWindowMinutes === undefined || isNaN(boundary.timeWindowMinutes) || boundary.timeWindowMinutes <= 0) {
          throw new ReachSparkError(
            'Rate boundary requires a valid time window in minutes',
            ErrorTypes.VALIDATION_ERROR,
            SeverityLevels.ERROR
          );
        }
        break;
        
      case BoundaryType.TIME:
        if (boundary.allowedHoursStart !== undefined && (isNaN(boundary.allowedHoursStart) || boundary.allowedHoursStart < 0 || boundary.allowedHoursStart > 23)) {
          throw new ReachSparkError(
            'Time boundary requires a valid start hour (0-23)',
            ErrorTypes.VALIDATION_ERROR,
            SeverityLevels.ERROR
          );
        }
        
        if (boundary.allowedHoursEnd !== undefined && (isNaN(boundary.allowedHoursEnd) || boundary.allowedHoursEnd < 0 || boundary.allowedHoursEnd > 23)) {
          throw new ReachSparkError(
            'Time boundary requires a valid end hour (0-23)',
            ErrorTypes.VALIDATION_ERROR,
            SeverityLevels.ERROR
          );
        }
        break;
        
      case BoundaryType.CONTENT:
        if (boundary.contentModeration && !boundary.contentField) {
          throw new ReachSparkError(
            'Content boundary with moderation requires a content field',
            ErrorTypes.VALIDATION_ERROR,
            SeverityLevels.ERROR
          );
        }
        break;
    }
  }
}

module.exports = {
  SafetyBoundariesManager,
  BoundaryType,
  ViolationSeverity,
  EnforcementAction
};
