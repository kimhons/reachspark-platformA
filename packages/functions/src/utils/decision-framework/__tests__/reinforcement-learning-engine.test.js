/**
 * Tests for Enhanced Reinforcement Learning Engine
 * 
 * This file contains comprehensive tests for the Reinforcement Learning Engine module,
 * including tests for policy learning, action recommendation, and reward calculation.
 */

// Mock dependencies before importing the module
jest.mock('firebase-admin');
jest.mock('firebase-functions');
jest.mock('../src/errorLogging');
jest.mock('../src/retryLogic');

const { ReinforcementLearningEngine, LearningAlgorithm, RewardType } = require('../src/reinforcement-learning-engine');

describe('Enhanced ReinforcementLearningEngine', () => {
  let rlEngine;
  
  beforeEach(() => {
    // Create a new instance for each test with test mode enabled
    rlEngine = new ReinforcementLearningEngine('test-context', {
      algorithm: LearningAlgorithm.PPO,
      rewardType: RewardType.BALANCED,
      testMode: true
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Constructor', () => {
    it('should initialize with default parameters', () => {
      const defaultEngine = new ReinforcementLearningEngine('default-context');
      
      expect(defaultEngine.contextId).toBe('default-context');
      expect(defaultEngine.algorithm).toBe(LearningAlgorithm.PPO);
      expect(defaultEngine.rewardType).toBe(RewardType.BALANCED);
      expect(defaultEngine.testMode).toBe(false);
    });
    
    it('should initialize with custom parameters', () => {
      expect(rlEngine.contextId).toBe('test-context');
      expect(rlEngine.algorithm).toBe(LearningAlgorithm.PPO);
      expect(rlEngine.rewardType).toBe(RewardType.BALANCED);
      expect(rlEngine.testMode).toBe(true);
    });
  });
  
  describe('getActionRecommendation', () => {
    it('should return mock recommendation in test mode', async () => {
      const result = await rlEngine.getActionRecommendation({
        state: { leadId: 'test-lead' },
        actions: [
          { action: 'qualify_lead', description: 'Qualify the lead' },
          { action: 'disqualify_lead', description: 'Disqualify the lead' }
        ]
      });
      
      expect(result).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
    });
    
    it('should validate required parameters', async () => {
      await expect(rlEngine.getActionRecommendation({
        state: { leadId: 'test-lead' }
      })).rejects.toThrow('actions');
      
      await expect(rlEngine.getActionRecommendation({
        actions: [{ action: 'test' }]
      })).rejects.toThrow('state');
    });
  });
  
  describe('updatePolicyFromOutcome', () => {
    it('should update policy based on outcome', async () => {
      const result = await rlEngine.updatePolicyFromOutcome({
        actionId: 'test-action',
        outcome: { converted: true },
        reward: 1.0
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });
    
    it('should validate required parameters', async () => {
      await expect(rlEngine.updatePolicyFromOutcome({
        outcome: { converted: true },
        reward: 1.0
      })).rejects.toThrow('actionId');
      
      await expect(rlEngine.updatePolicyFromOutcome({
        actionId: 'test-action',
        reward: 1.0
      })).rejects.toThrow('outcome');
    });
  });
  
  describe('calculateReward', () => {
    it('should calculate reward based on outcome', async () => {
      const reward = await rlEngine.calculateReward({
        outcome: { converted: true, revenue: 1000 }
      });
      
      expect(reward).toBeGreaterThan(0);
    });
    
    it('should handle different reward types', async () => {
      // Create engines with different reward types
      const conversionEngine = new ReinforcementLearningEngine('conversion', {
        rewardType: RewardType.CONVERSION,
        testMode: true
      });
      
      const engagementEngine = new ReinforcementLearningEngine('engagement', {
        rewardType: RewardType.ENGAGEMENT,
        testMode: true
      });
      
      const conversionReward = await conversionEngine.calculateReward({
        outcome: { converted: true }
      });
      
      const engagementReward = await engagementEngine.calculateReward({
        outcome: { engagement: 0.8 }
      });
      
      expect(conversionReward).toBeGreaterThan(0);
      expect(engagementReward).toBeGreaterThan(0);
    });
  });
  
  describe('saveModel', () => {
    it('should save model state', async () => {
      const result = await rlEngine.saveModel();
      
      expect(result.success).toBe(true);
      expect(result.modelId).toBeDefined();
    });
  });
  
  describe('loadModel', () => {
    it('should load model state', async () => {
      const result = await rlEngine.loadModel('test-model');
      
      expect(result.success).toBe(true);
      expect(result.modelId).toBe('test-model');
    });
  });
});
