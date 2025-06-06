/**
 * Enhanced Decision Framework for ReachSpark AMIA
 * 
 * This is the main entry point for the Enhanced Decision Framework,
 * which integrates multi-agent decision logic, reinforcement learning,
 * and explainable AI capabilities.
 */

const { MultiAgentEnsemble, AgentType, CollaborationMode } = require('./multi-agent-decision-logic');
const { ReinforcementLearningEngine, LearningAlgorithm, RewardType } = require('./reinforcement-learning-engine');
const { ExplainabilityEngine, AudienceType, ExplanationFormat, DetailLevel } = require('./explainability-engine');

/**
 * Enhanced Decision Framework that combines multi-agent collaboration,
 * reinforcement learning, and explainability.
 */
class EnhancedDecisionFramework {
  /**
   * Create a new Enhanced Decision Framework
   * @param {string} contextId - Unique identifier for this framework instance
   * @param {Object} options - Configuration options
   * @param {boolean} options.testMode - Whether to run in test mode
   */
  constructor(contextId, options = {}) {
    this.contextId = contextId;
    this.testMode = options.testMode || process.env.NODE_ENV === 'test';
    
    // Initialize component engines
    this.agentEnsemble = new MultiAgentEnsemble(contextId, this.testMode);
    this.rlEngine = new ReinforcementLearningEngine(contextId, {
      algorithm: options.rlAlgorithm || LearningAlgorithm.PPO,
      rewardType: options.rewardType || RewardType.BALANCED,
      testMode: this.testMode
    });
    this.explainEngine = new ExplainabilityEngine(contextId, this.testMode);
  }
  
  /**
   * Generate a decision with full autonomy
   * @param {Object} params - Decision parameters
   * @param {string} params.decisionType - Type of decision to make
   * @param {Object} params.context - Decision context
   * @param {Array<Object>} params.actions - Available actions
   * @param {Object} [params.constraints] - Decision constraints
   * @param {boolean} [params.explainable=true] - Whether to generate explanation
   * @param {string} [params.audienceType=AudienceType.BUSINESS] - Type of audience for explanation
   * @param {boolean} [params.includeCounterfactuals=false] - Whether to include counterfactual analysis
   * @returns {Promise<Object>} Decision result with explanation
   */
  async generateDecision(params) {
    const {
      decisionType,
      context,
      actions,
      constraints = {},
      explainable = true,
      audienceType = AudienceType.BUSINESS,
      includeCounterfactuals = false
    } = params;
    
    try {
      // Step 1: Generate collaborative decision using multi-agent ensemble
      const collaborativeDecision = await this.agentEnsemble.generateCollaborativeDecision({
        decisionType,
        context,
        constraints
      });
      
      // Step 2: Refine with reinforcement learning
      const rlDecision = await this.rlEngine.getActionRecommendation({
        state: context,
        actions,
        context: {
          decisionType,
          collaborativeDecision,
          constraints
        }
      });
      
      // Step 3: Combine decisions (prioritize RL if confidence is high enough)
      const finalDecision = this.combineDecisions(collaborativeDecision, rlDecision);
      
      // Step 4: Generate explanation if requested
      let explanation = null;
      if (explainable) {
        explanation = await this.explainEngine.generateDecisionExplanation({
          decisionId: finalDecision.id,
          audienceType,
          includeCounterfactuals,
          detailLevel: DetailLevel.STANDARD
        });
      }
      
      return {
        ...finalDecision,
        explanation
      };
    } catch (error) {
      console.error('Error generating decision:', error);
      
      // Return fallback decision
      return {
        id: `fallback-${Date.now()}`,
        action: actions[0].action || actions[0],
        confidence: 0.5,
        reasoning: 'Fallback decision due to error',
        isErrorResponse: true,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Combine decisions from different sources
   * @param {Object} collaborativeDecision - Decision from multi-agent ensemble
   * @param {Object} rlDecision - Decision from reinforcement learning
   * @returns {Object} Combined decision
   * @private
   */
  combineDecisions(collaborativeDecision, rlDecision) {
    // Use RL decision if confidence is high enough
    if (rlDecision.confidence >= 0.8) {
      return {
        id: `decision-${Date.now()}`,
        action: rlDecision.action,
        confidence: rlDecision.confidence,
        reasoning: `${rlDecision.reasoning} (Reinforcement learning decision with high confidence)`,
        alternativeActions: rlDecision.alternativeActions,
        sources: {
          reinforcementLearning: rlDecision,
          multiAgentEnsemble: collaborativeDecision
        },
        timestamp: new Date().toISOString()
      };
    }
    
    // Use collaborative decision if RL confidence is not high enough
    return {
      id: `decision-${Date.now()}`,
      action: collaborativeDecision.action,
      confidence: collaborativeDecision.confidence,
      reasoning: `${collaborativeDecision.reasoning} (Multi-agent ensemble decision)`,
      alternativeActions: collaborativeDecision.alternativeActions,
      sources: {
        reinforcementLearning: rlDecision,
        multiAgentEnsemble: collaborativeDecision
      },
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Update policy based on decision outcome
   * @param {Object} params - Update parameters
   * @param {string} params.decisionId - ID of the decision to update
   * @param {Object} params.outcome - Observed outcome
   * @returns {Promise<Object>} Update result
   */
  async updatePolicyFromOutcome(params) {
    const { decisionId, outcome } = params;
    
    try {
      // Calculate reward based on outcome
      const reward = await this.rlEngine.calculateReward({
        outcome
      });
      
      // Update policy
      const updateResult = await this.rlEngine.updatePolicyFromOutcome({
        actionId: decisionId,
        outcome,
        reward
      });
      
      return {
        success: updateResult.success,
        message: updateResult.message,
        reward
      };
    } catch (error) {
      console.error('Error updating policy:', error);
      
      return {
        success: false,
        message: `Failed to update policy: ${error.message}`
      };
    }
  }
  
  /**
   * Generate trace for a decision process
   * @param {Object} params - Trace parameters
   * @param {string} params.decisionId - ID of the decision to trace
   * @param {boolean} [params.includeIntermediateSteps=false] - Whether to include intermediate steps
   * @returns {Promise<Object>} Decision trace
   */
  async generateDecisionTrace(params) {
    return this.explainEngine.generateDecisionTrace(params);
  }
}

module.exports = {
  EnhancedDecisionFramework,
  MultiAgentEnsemble,
  AgentType,
  CollaborationMode,
  ReinforcementLearningEngine,
  LearningAlgorithm,
  RewardType,
  ExplainabilityEngine,
  AudienceType,
  ExplanationFormat,
  DetailLevel
};
