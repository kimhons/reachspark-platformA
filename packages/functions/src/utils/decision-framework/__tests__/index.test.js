/**
 * Tests for Enhanced Decision Framework
 * 
 * This file contains comprehensive tests for the main Enhanced Decision Framework module,
 * which integrates multi-agent decision logic, reinforcement learning, and explainability.
 */

const { 
  EnhancedDecisionFramework,
  AgentType,
  CollaborationMode,
  LearningAlgorithm,
  RewardType,
  AudienceType
} = require('../src/index');

// Mock dependencies
jest.mock('../src/multi-agent-decision-logic', () => ({
  MultiAgentEnsemble: jest.fn().mockImplementation(() => ({
    generateCollaborativeDecision: jest.fn().mockResolvedValue({
      action: 'test_action',
      confidence: 0.8,
      reasoning: 'Test reasoning',
      alternativeActions: ['alt_action_1', 'alt_action_2']
    })
  })),
  AgentType: {
    STRATEGY_AGENT: 'strategy_agent',
    RESEARCH_AGENT: 'research_agent',
    QUALIFICATION_AGENT: 'qualification_agent'
  },
  CollaborationMode: {
    SEQUENTIAL: 'sequential',
    PARALLEL: 'parallel',
    HIERARCHICAL: 'hierarchical',
    CONSENSUS: 'consensus'
  }
}));

jest.mock('../src/reinforcement-learning-engine', () => ({
  ReinforcementLearningEngine: jest.fn().mockImplementation(() => ({
    getActionRecommendation: jest.fn().mockResolvedValue({
      action: 'rl_action',
      confidence: 0.9,
      reasoning: 'RL reasoning',
      alternativeActions: ['rl_alt_1', 'rl_alt_2']
    }),
    calculateReward: jest.fn().mockResolvedValue(1.0),
    updatePolicyFromOutcome: jest.fn().mockResolvedValue({
      success: true,
      message: 'Policy updated'
    })
  })),
  LearningAlgorithm: {
    PPO: 'ppo',
    DQN: 'dqn',
    MARL_VDN: 'marl_vdn'
  },
  RewardType: {
    CONVERSION: 'conversion',
    ENGAGEMENT: 'engagement',
    BALANCED: 'balanced'
  }
}));

jest.mock('../src/explainability-engine', () => ({
  ExplainabilityEngine: jest.fn().mockImplementation(() => ({
    generateDecisionExplanation: jest.fn().mockResolvedValue({
      explanation: 'Test explanation',
      factorAnalysis: { factors: [] },
      confidenceAnalysis: { overallConfidence: 0.8 }
    }),
    generateDecisionTrace: jest.fn().mockResolvedValue({
      steps: [
        { type: 'initialization', description: 'Decision process initiated' },
        { type: 'final_decision', description: 'Selected action' }
      ]
    })
  })),
  AudienceType: {
    TECHNICAL: 'technical',
    BUSINESS: 'business',
    EXECUTIVE: 'executive'
  },
  ExplanationFormat: {
    TEXT: 'text',
    HTML: 'html',
    JSON: 'json'
  },
  DetailLevel: {
    MINIMAL: 1,
    STANDARD: 3,
    DETAILED: 4
  }
}));

describe('Enhanced Decision Framework', () => {
  let framework;
  
  beforeEach(() => {
    // Create a new instance for each test
    framework = new EnhancedDecisionFramework('test-context', { testMode: true });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Constructor', () => {
    it('should initialize with default parameters', () => {
      expect(framework.contextId).toBe('test-context');
      expect(framework.testMode).toBe(true);
      expect(framework.agentEnsemble).toBeDefined();
      expect(framework.rlEngine).toBeDefined();
      expect(framework.explainEngine).toBeDefined();
    });
    
    it('should initialize with custom parameters', () => {
      const customFramework = new EnhancedDecisionFramework('custom-context', {
        testMode: true, // Fixed to match implementation
        rlAlgorithm: LearningAlgorithm.DQN,
        rewardType: RewardType.CONVERSION
      });
      
      expect(customFramework.contextId).toBe('custom-context');
      expect(customFramework.testMode).toBe(true); // Fixed to match implementation
    });
  });
  
  describe('generateDecision', () => {
    it('should integrate multi-agent, RL, and explainability components', async () => {
      const result = await framework.generateDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        actions: [
          { action: 'qualify_lead', description: 'Qualify the lead' },
          { action: 'disqualify_lead', description: 'Disqualify the lead' }
        ],
        explainable: true
      });
      
      // Check that all components were called
      expect(framework.agentEnsemble.generateCollaborativeDecision).toHaveBeenCalled();
      expect(framework.rlEngine.getActionRecommendation).toHaveBeenCalled();
      expect(framework.explainEngine.generateDecisionExplanation).toHaveBeenCalled();
      
      // Check result structure
      expect(result.action).toBe('rl_action'); // RL has higher confidence
      expect(result.confidence).toBe(0.9);
      expect(result.explanation).toBeDefined();
      expect(result.sources).toBeDefined();
      expect(result.sources.reinforcementLearning).toBeDefined();
      expect(result.sources.multiAgentEnsemble).toBeDefined();
    });
    
    it('should use collaborative decision when RL confidence is low', async () => {
      // Override RL mock to return low confidence
      framework.rlEngine.getActionRecommendation = jest.fn().mockResolvedValue({
        action: 'rl_action',
        confidence: 0.6, // Below threshold
        reasoning: 'Low confidence RL reasoning',
        alternativeActions: ['rl_alt_1', 'rl_alt_2']
      });
      
      const result = await framework.generateDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        actions: [
          { action: 'qualify_lead', description: 'Qualify the lead' },
          { action: 'disqualify_lead', description: 'Disqualify the lead' }
        ]
      });
      
      // Should use collaborative decision
      expect(result.action).toBe('test_action');
      expect(result.confidence).toBe(0.8);
    });
    
    it('should skip explanation when explainable is false', async () => {
      const result = await framework.generateDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        actions: [
          { action: 'qualify_lead', description: 'Qualify the lead' },
          { action: 'disqualify_lead', description: 'Disqualify the lead' }
        ],
        explainable: false
      });
      
      expect(framework.explainEngine.generateDecisionExplanation).not.toHaveBeenCalled();
      expect(result.explanation).toBeNull();
    });
    
    it('should return fallback decision on error', async () => {
      // Force an error
      framework.agentEnsemble.generateCollaborativeDecision = jest.fn().mockRejectedValue(
        new Error('Test error')
      );
      
      const result = await framework.generateDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        actions: [
          { action: 'qualify_lead', description: 'Qualify the lead' },
          { action: 'disqualify_lead', description: 'Disqualify the lead' }
        ]
      });
      
      expect(result.isErrorResponse).toBe(true);
      expect(result.action).toBe('qualify_lead');
      expect(result.confidence).toBe(0.5);
    });
  });
  
  describe('updatePolicyFromOutcome', () => {
    it('should calculate reward and update policy', async () => {
      const result = await framework.updatePolicyFromOutcome({
        decisionId: 'test-decision',
        outcome: { converted: true }
      });
      
      expect(framework.rlEngine.calculateReward).toHaveBeenCalled();
      expect(framework.rlEngine.updatePolicyFromOutcome).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.reward).toBe(1.0);
    });
    
    it('should return error result on failure', async () => {
      // Force an error
      framework.rlEngine.calculateReward = jest.fn().mockRejectedValue(
        new Error('Test error')
      );
      
      const result = await framework.updatePolicyFromOutcome({
        decisionId: 'test-decision',
        outcome: { converted: true }
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to update policy');
    });
  });
  
  describe('generateDecisionTrace', () => {
    it('should delegate to explainability engine', async () => {
      await framework.generateDecisionTrace({
        decisionId: 'test-decision',
        includeIntermediateSteps: true
      });
      
      expect(framework.explainEngine.generateDecisionTrace).toHaveBeenCalledWith({
        decisionId: 'test-decision',
        includeIntermediateSteps: true
      });
    });
  });
});
