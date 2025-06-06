/**
 * Trial Period Management System for ReachSpark AMIA
 * 
 * This module implements the trial period management system with the specific
 * requirements of full access for three days followed by graceful degradation
 * to the chosen tier for the remaining four days of the trial.
 */

const admin = require('firebase-admin');
const { logger, ReachSparkError, ErrorTypes, SeverityLevels } = require('./errorLogging');
const { AuditComplianceManager, AuditEventType } = require('./auditCompliance');

// Firestore reference
const db = admin.firestore();

/**
 * Trial status types
 */
const TrialStatus = {
  NOT_STARTED: 'not_started',
  ACTIVE_FULL: 'active_full',     // First 3 days with full access
  ACTIVE_TIER: 'active_tier',     // Remaining 4 days with tier-based access
  COMPLETED: 'completed',
  CONVERTED: 'converted',         // Converted to paid subscription
  CANCELLED: 'cancelled'
};

/**
 * Subscription tier levels
 */
const SubscriptionTier = {
  BASIC: 'basic',           // Level 1: $149.99/month, 7,000 credits
  PROFESSIONAL: 'professional', // Level 2: $299.99/month, 15,000 credits
  BUSINESS: 'business',     // Level 3: $999.99/month, 20,000 credits
  ENTERPRISE: 'enterprise', // Level 4: $2,999.99/month, 50,000 credits
  ULTIMATE: 'ultimate'      // Level 5: $14,999.99/month, 100,000 credits
};

/**
 * Tier credit allocations
 */
const TierCredits = {
  [SubscriptionTier.BASIC]: 7000,
  [SubscriptionTier.PROFESSIONAL]: 15000,
  [SubscriptionTier.BUSINESS]: 20000,
  [SubscriptionTier.ENTERPRISE]: 50000,
  [SubscriptionTier.ULTIMATE]: 100000
};

/**
 * Tier pricing (monthly)
 */
const TierPricing = {
  [SubscriptionTier.BASIC]: 149.99,
  [SubscriptionTier.PROFESSIONAL]: 299.99,
  [SubscriptionTier.BUSINESS]: 999.99,
  [SubscriptionTier.ENTERPRISE]: 2999.99,
  [SubscriptionTier.ULTIMATE]: 14999.99
};

/**
 * Trial Period Manager class
 */
class TrialPeriodManager {
  constructor() {
    this.initialized = false;
    this.auditManager = new AuditComplianceManager();
    this.TRIAL_DURATION_DAYS = 7;
    this.FULL_ACCESS_DAYS = 3;
    this.TIER_ACCESS_DAYS = 4;
  }

  /**
   * Initialize the Trial Period Manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize audit manager
      await this.auditManager.initialize();
      
      this.initialized = true;
      logger.info('Trial Period Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Trial Period Manager', { error });
      throw error;
    }
  }

  /**
   * Start a trial for a user
   * @param {string} userId - User ID
   * @param {string} selectedTier - Selected subscription tier
   * @param {Object} userInfo - Additional user information
   * @returns {Promise<Object>} - Trial details
   */
  async startTrial(userId, selectedTier, userInfo = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Validate tier
      if (!Object.values(SubscriptionTier).includes(selectedTier)) {
        throw new ReachSparkError(
          `Invalid subscription tier: ${selectedTier}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Check if user already has an active trial
      const existingTrialDoc = await db.collection('trials')
        .where('userId', '==', userId)
        .where('status', 'in', [TrialStatus.ACTIVE_FULL, TrialStatus.ACTIVE_TIER])
        .limit(1)
        .get();
      
      if (!existingTrialDoc.empty) {
        throw new ReachSparkError(
          'User already has an active trial',
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Check if user has completed a trial before
      const completedTrialDoc = await db.collection('trials')
        .where('userId', '==', userId)
        .where('status', 'in', [TrialStatus.COMPLETED, TrialStatus.CONVERTED, TrialStatus.CANCELLED])
        .limit(1)
        .get();
      
      if (!completedTrialDoc.empty) {
        throw new ReachSparkError(
          'User has already used their trial period',
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Calculate trial dates
      const now = new Date();
      const trialStartDate = now;
      
      const fullAccessEndDate = new Date(now);
      fullAccessEndDate.setDate(fullAccessEndDate.getDate() + this.FULL_ACCESS_DAYS);
      
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + this.TRIAL_DURATION_DAYS);
      
      // Create trial record
      const trialData = {
        userId,
        selectedTier,
        status: TrialStatus.ACTIVE_FULL,
        startDate: admin.firestore.Timestamp.fromDate(trialStartDate),
        fullAccessEndDate: admin.firestore.Timestamp.fromDate(fullAccessEndDate),
        endDate: admin.firestore.Timestamp.fromDate(trialEndDate),
        userInfo: {
          email: userInfo.email || null,
          name: userInfo.name || null,
          company: userInfo.company || null,
          ...userInfo
        },
        creditsUsed: 0,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Save to Firestore
      const trialRef = await db.collection('trials').add(trialData);
      
      // Create user subscription record
      await db.collection('subscriptions').doc(userId).set({
        userId,
        status: 'trial',
        tier: selectedTier,
        trialId: trialRef.id,
        isActive: true,
        currentPeriodStart: admin.firestore.Timestamp.fromDate(trialStartDate),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(trialEndDate),
        credits: {
          total: TierCredits[SubscriptionTier.ULTIMATE], // Full access during first 3 days
          used: 0,
          remaining: TierCredits[SubscriptionTier.ULTIMATE]
        },
        features: {
          fullAccess: true
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Log the trial start
      await this.auditManager.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        userId,
        {
          component: 'trial',
          action: 'start',
          selectedTier,
          trialId: trialRef.id,
          success: true
        }
      );
      
      // Schedule transition to tier-based access
      // In a production environment, this would be handled by a scheduled Cloud Function
      // For now, we'll rely on checking the status during usage
      
      return {
        trialId: trialRef.id,
        status: TrialStatus.ACTIVE_FULL,
        selectedTier,
        startDate: trialStartDate,
        fullAccessEndDate,
        endDate: trialEndDate,
        credits: TierCredits[SubscriptionTier.ULTIMATE],
        features: {
          fullAccess: true
        }
      };
    } catch (error) {
      logger.error('Error starting trial', { error, userId, selectedTier });
      
      // Log the failed trial start
      await this.auditManager.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        userId,
        {
          component: 'trial',
          action: 'start',
          selectedTier,
          success: false,
          error: error.message
        }
      );
      
      throw error;
    }
  }

  /**
   * Check and update trial status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated trial status
   */
  async checkAndUpdateTrialStatus(userId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Get user's trial
      const trialQuery = await db.collection('trials')
        .where('userId', '==', userId)
        .where('status', 'in', [TrialStatus.ACTIVE_FULL, TrialStatus.ACTIVE_TIER])
        .limit(1)
        .get();
      
      if (trialQuery.empty) {
        return {
          hasTrial: false,
          message: 'No active trial found'
        };
      }
      
      const trialDoc = trialQuery.docs[0];
      const trial = trialDoc.data();
      const trialId = trialDoc.id;
      
      const now = new Date();
      const fullAccessEndDate = trial.fullAccessEndDate.toDate();
      const trialEndDate = trial.endDate.toDate();
      
      let statusChanged = false;
      let newStatus = trial.status;
      
      // Check if trial has ended
      if (now >= trialEndDate) {
        newStatus = TrialStatus.COMPLETED;
        statusChanged = true;
      }
      // Check if full access period has ended
      else if (trial.status === TrialStatus.ACTIVE_FULL && now >= fullAccessEndDate) {
        newStatus = TrialStatus.ACTIVE_TIER;
        statusChanged = true;
      }
      
      // Update trial status if changed
      if (statusChanged) {
        await trialDoc.ref.update({
          status: newStatus,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update user subscription
        if (newStatus === TrialStatus.ACTIVE_TIER) {
          // Transition to tier-based access
          await db.collection('subscriptions').doc(userId).update({
            status: 'trial',
            credits: {
              total: TierCredits[trial.selectedTier],
              used: 0,
              remaining: TierCredits[trial.selectedTier]
            },
            features: {
              fullAccess: false
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Log the transition
          await this.auditManager.logAuditEvent(
            AuditEventType.AGENT_CONFIG_CHANGE,
            userId,
            {
              component: 'trial',
              action: 'transition_to_tier',
              trialId,
              selectedTier: trial.selectedTier,
              success: true
            }
          );
        } else if (newStatus === TrialStatus.COMPLETED) {
          // End trial
          await db.collection('subscriptions').doc(userId).update({
            status: 'inactive',
            isActive: false,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Log the completion
          await this.auditManager.logAuditEvent(
            AuditEventType.AGENT_CONFIG_CHANGE,
            userId,
            {
              component: 'trial',
              action: 'complete',
              trialId,
              success: true
            }
          );
        }
      }
      
      // Return current trial status
      return {
        hasTrial: true,
        trialId,
        status: newStatus,
        selectedTier: trial.selectedTier,
        startDate: trial.startDate.toDate(),
        fullAccessEndDate,
        endDate: trialEndDate,
        daysRemaining: Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24))),
        isFullAccess: newStatus === TrialStatus.ACTIVE_FULL,
        credits: newStatus === TrialStatus.ACTIVE_FULL 
          ? TierCredits[SubscriptionTier.ULTIMATE] 
          : TierCredits[trial.selectedTier],
        creditsUsed: trial.creditsUsed || 0
      };
    } catch (error) {
      logger.error('Error checking trial status', { error, userId });
      throw error;
    }
  }

  /**
   * Record credit usage during trial
   * @param {string} userId - User ID
   * @param {number} credits - Number of credits used
   * @returns {Promise<Object>} - Updated credit usage
   */
  async recordCreditUsage(userId, credits) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check and update trial status first
      const trialStatus = await this.checkAndUpdateTrialStatus(userId);
      
      if (!trialStatus.hasTrial) {
        throw new ReachSparkError(
          'No active trial found',
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Get user's trial
      const trialDoc = await db.collection('trials').doc(trialStatus.trialId).get();
      
      if (!trialDoc.exists) {
        throw new ReachSparkError(
          'Trial record not found',
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      const trial = trialDoc.data();
      
      // Update credit usage
      const currentCreditsUsed = trial.creditsUsed || 0;
      const newCreditsUsed = currentCreditsUsed + credits;
      
      await trialDoc.ref.update({
        creditsUsed: newCreditsUsed,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update subscription credits
      const subscriptionDoc = await db.collection('subscriptions').doc(userId).get();
      
      if (subscriptionDoc.exists) {
        const subscription = subscriptionDoc.data();
        const currentUsed = subscription.credits?.used || 0;
        const newUsed = currentUsed + credits;
        const remaining = subscription.credits?.total - newUsed;
        
        await subscriptionDoc.ref.update({
          'credits.used': newUsed,
          'credits.remaining': remaining,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Log credit usage
      await this.auditManager.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        userId,
        {
          component: 'trial',
          action: 'credit_usage',
          trialId: trialStatus.trialId,
          credits,
          totalUsed: newCreditsUsed,
          success: true
        }
      );
      
      return {
        trialId: trialStatus.trialId,
        status: trialStatus.status,
        creditsUsed: newCreditsUsed,
        creditsRemaining: trialStatus.credits - newCreditsUsed
      };
    } catch (error) {
      logger.error('Error recording credit usage', { error, userId, credits });
      throw error;
    }
  }

  /**
   * Convert trial to paid subscription
   * @param {string} userId - User ID
   * @param {string} selectedTier - Selected subscription tier
   * @param {Object} paymentDetails - Payment details
   * @returns {Promise<Object>} - Conversion result
   */
  async convertTrialToPaid(userId, selectedTier, paymentDetails = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Validate tier
      if (!Object.values(SubscriptionTier).includes(selectedTier)) {
        throw new ReachSparkError(
          `Invalid subscription tier: ${selectedTier}`,
          ErrorTypes.VALIDATION_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Check and update trial status first
      const trialStatus = await this.checkAndUpdateTrialStatus(userId);
      
      if (!trialStatus.hasTrial) {
        throw new ReachSparkError(
          'No active trial found',
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Get user's trial
      const trialDoc = await db.collection('trials').doc(trialStatus.trialId).get();
      
      if (!trialDoc.exists) {
        throw new ReachSparkError(
          'Trial record not found',
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Update trial status to converted
      await trialDoc.ref.update({
        status: TrialStatus.CONVERTED,
        conversionDate: admin.firestore.FieldValue.serverTimestamp(),
        convertedTier: selectedTier,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Calculate subscription dates
      const now = new Date();
      const periodStart = now;
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      
      // Create or update subscription
      await db.collection('subscriptions').doc(userId).set({
        userId,
        status: 'active',
        tier: selectedTier,
        isActive: true,
        currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
        credits: {
          total: TierCredits[selectedTier],
          used: 0,
          remaining: TierCredits[selectedTier]
        },
        features: {
          fullAccess: selectedTier === SubscriptionTier.ULTIMATE
        },
        payment: {
          amount: TierPricing[selectedTier],
          currency: 'USD',
          interval: 'month',
          ...paymentDetails
        },
        convertedFromTrial: trialStatus.trialId,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Log the conversion
      await this.auditManager.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        userId,
        {
          component: 'trial',
          action: 'convert_to_paid',
          trialId: trialStatus.trialId,
          selectedTier,
          success: true
        }
      );
      
      return {
        success: true,
        subscriptionTier: selectedTier,
        periodStart,
        periodEnd,
        credits: TierCredits[selectedTier],
        amount: TierPricing[selectedTier],
        message: 'Trial successfully converted to paid subscription'
      };
    } catch (error) {
      logger.error('Error converting trial to paid', { error, userId, selectedTier });
      
      // Log the failed conversion
      await this.auditManager.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        userId,
        {
          component: 'trial',
          action: 'convert_to_paid',
          selectedTier,
          success: false,
          error: error.message
        }
      );
      
      throw error;
    }
  }

  /**
   * Cancel a trial
   * @param {string} userId - User ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelTrial(userId, reason = '') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check and update trial status first
      const trialStatus = await this.checkAndUpdateTrialStatus(userId);
      
      if (!trialStatus.hasTrial) {
        throw new ReachSparkError(
          'No active trial found',
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Get user's trial
      const trialDoc = await db.collection('trials').doc(trialStatus.trialId).get();
      
      if (!trialDoc.exists) {
        throw new ReachSparkError(
          'Trial record not found',
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR
        );
      }
      
      // Update trial status to cancelled
      await trialDoc.ref.update({
        status: TrialStatus.CANCELLED,
        cancellationDate: admin.firestore.FieldValue.serverTimestamp(),
        cancellationReason: reason,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update subscription
      await db.collection('subscriptions').doc(userId).update({
        status: 'cancelled',
        isActive: false,
        cancellationReason: reason,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Log the cancellation
      await this.auditManager.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        userId,
        {
          component: 'trial',
          action: 'cancel',
          trialId: trialStatus.trialId,
          reason,
          success: true
        }
      );
      
      return {
        success: true,
        message: 'Trial successfully cancelled'
      };
    } catch (error) {
      logger.error('Error cancelling trial', { error, userId });
      
      // Log the failed cancellation
      await this.auditManager.logAuditEvent(
        AuditEventType.AGENT_CONFIG_CHANGE,
        userId,
        {
          component: 'trial',
          action: 'cancel',
          success: false,
          error: error.message
        }
      );
      
      throw error;
    }
  }

  /**
   * Get trial statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Trial statistics
   */
  async getTrialStatistics(options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const { startDate, endDate = new Date() } = options;
      
      // Default start date to 30 days ago if not specified
      const queryStartDate = startDate ? new Date(startDate) : new Date(endDate);
      if (!startDate) {
        queryStartDate.setDate(queryStartDate.getDate() - 30);
      }
      
      const queryEndDate = new Date(endDate);
      
      // Query trials in date range
      const trialsQuery = db.collection('trials')
        .where('startDate', '>=', admin.firestore.Timestamp.fromDate(queryStartDate))
        .where('startDate', '<=', admin.firestore.Timestamp.fromDate(queryEndDate));
      
      const trialsSnapshot = await trialsQuery.get();
      
      // Calculate statistics
      const stats = {
        totalTrials: trialsSnapshot.size,
        activeTrials: 0,
        completedTrials: 0,
        convertedTrials: 0,
        cancelledTrials: 0,
        conversionRate: 0,
        byTier: {},
        startDate: queryStartDate,
        endDate: queryEndDate
      };
      
      // Initialize tier counts
      Object.values(SubscriptionTier).forEach(tier => {
        stats.byTier[tier] = {
          total: 0,
          active: 0,
          completed: 0,
          converted: 0,
          cancelled: 0,
          conversionRate: 0
        };
      });
      
      // Process trials
      trialsSnapshot.forEach(doc => {
        const trial = doc.data();
        const tier = trial.selectedTier;
        
        // Increment total for tier
        if (stats.byTier[tier]) {
          stats.byTier[tier].total++;
        }
        
        // Count by status
        switch (trial.status) {
          case TrialStatus.ACTIVE_FULL:
          case TrialStatus.ACTIVE_TIER:
            stats.activeTrials++;
            if (stats.byTier[tier]) {
              stats.byTier[tier].active++;
            }
            break;
            
          case TrialStatus.COMPLETED:
            stats.completedTrials++;
            if (stats.byTier[tier]) {
              stats.byTier[tier].completed++;
            }
            break;
            
          case TrialStatus.CONVERTED:
            stats.convertedTrials++;
            if (stats.byTier[tier]) {
              stats.byTier[tier].converted++;
            }
            break;
            
          case TrialStatus.CANCELLED:
            stats.cancelledTrials++;
            if (stats.byTier[tier]) {
              stats.byTier[tier].cancelled++;
            }
            break;
        }
      });
      
      // Calculate conversion rates
      const eligibleForConversion = stats.convertedTrials + stats.completedTrials + stats.cancelledTrials;
      stats.conversionRate = eligibleForConversion > 0 
        ? (stats.convertedTrials / eligibleForConversion) * 100 
        : 0;
      
      // Calculate tier conversion rates
      Object.keys(stats.byTier).forEach(tier => {
        const tierStats = stats.byTier[tier];
        const tierEligible = tierStats.converted + tierStats.completed + tierStats.cancelled;
        tierStats.conversionRate = tierEligible > 0 
          ? (tierStats.converted / tierEligible) * 100 
          : 0;
      });
      
      return stats;
    } catch (error) {
      logger.error('Error getting trial statistics', { error, options });
      throw error;
    }
  }
}

module.exports = {
  TrialPeriodManager,
  TrialStatus,
  SubscriptionTier,
  TierCredits,
  TierPricing
};
