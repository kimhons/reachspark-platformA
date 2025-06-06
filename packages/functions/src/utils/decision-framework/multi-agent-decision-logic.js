/**
 * Enhanced Multi-Agent Decision Logic for ReachSpark AMIA
 * 
 * This module implements the multi-agent decision logic for the Enhanced Decision Framework,
 * enabling collaborative decision-making between specialized agents with different expertise areas.
 * 
 * Key Features:
 * - Microsoft AutoGen-inspired multi-agent orchestration
 * - Dynamic agent selection based on decision context
 * - Sophisticated agent communication protocols
 * - Conflict resolution mechanisms
 * - Consensus-building algorithms
 * - Fallback strategies for resilience
 */

const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const { logger, ReachSparkError, ErrorTypes, SeverityLevels } = require('./errorLogging');

// Lazy load dependencies to avoid circular references
let LLMEngine;

try {
  const llm = require('../llm');
  LLMEngine = llm.LLMEngine;
} catch (error) {
  logger.warn('Failed to import LLM module, using mock implementation');
  // Mock implementation for testing
  LLMEngine = class MockLLMEngine {
    constructor() {}
    async generateWithAgentRAG() {
      return JSON.stringify({
        hasIssues: false,
        issues: [],
        explanation: "No issues detected (mock response)"
      });
    }
    async generateWithAgentDirect() {
      return "positive";
    }
  };
}

// Initialize Firestore with fallback for testing environments
let db;
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  db = admin.firestore();
} catch (error) {
  console.warn('Failed to initialize Firestore, using mock implementation for testing');
  // Mock Firestore for testing environments
  db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          add: async () => ({}),
          get: async () => ({ docs: [], forEach: () => {} })
        }),
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async () => ({}),
        update: async () => ({}),
        delete: async () => ({})
      }),
      add: async () => ({}),
      where: () => ({ where: () => ({ get: async () => ({ docs: [], forEach: () => {} }) }) }),
      orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [], forEach: () => {} }) }) })
    }),
    runTransaction: async (fn) => fn({ get: async () => ({ exists: false, data: () => ({}) }), set: async () => ({}), update: async () => ({}) })
  };
}

/**
 * Agent types for specialized decision-making
 */
const AgentType = {
  STRATEGY_AGENT: 'strategy_agent',
  RESEARCH_AGENT: 'research_agent',
  QUALIFICATION_AGENT: 'qualification_agent',
  COMMUNICATION_AGENT: 'communication_agent',
  ETHICS_ADVISOR_AGENT: 'ethics_advisor_agent',
  RISK_ASSESSMENT_AGENT: 'risk_assessment_agent',
  MARKET_INTELLIGENCE_AGENT: 'market_intelligence_agent',
  CONTENT_STRATEGIST_AGENT: 'content_strategist_agent',
  CHANNEL_STRATEGIST_AGENT: 'channel_strategist_agent',
  TIMING_OPTIMIZATION_AGENT: 'timing_optimization_agent',
  PERSONALIZATION_AGENT: 'personalization_agent'
};

/**
 * Decision types mapped to relevant agent types
 */
const DecisionTypeToAgentMap = {
  LEAD_QUALIFICATION: [
    AgentType.QUALIFICATION_AGENT,
    AgentType.RESEARCH_AGENT,
    AgentType.ETHICS_ADVISOR_AGENT,
    AgentType.RISK_ASSESSMENT_AGENT
  ],
  ENGAGEMENT_STRATEGY: [
    AgentType.STRATEGY_AGENT,
    AgentType.COMMUNICATION_AGENT,
    AgentType.MARKET_INTELLIGENCE_AGENT,
    AgentType.PERSONALIZATION_AGENT
  ],
  CONTENT_SELECTION: [
    AgentType.CONTENT_STRATEGIST_AGENT,
    AgentType.PERSONALIZATION_AGENT,
    AgentType.COMMUNICATION_AGENT
  ],
  CHANNEL_SELECTION: [
    AgentType.CHANNEL_STRATEGIST_AGENT,
    AgentType.COMMUNICATION_AGENT,
    AgentType.MARKET_INTELLIGENCE_AGENT
  ],
  TIMING_OPTIMIZATION: [
    AgentType.TIMING_OPTIMIZATION_AGENT,
    AgentType.MARKET_INTELLIGENCE_AGENT,
    AgentType.PERSONALIZATION_AGENT
  ],
  MULTI_CHANNEL_ORCHESTRATION: [
    AgentType.STRATEGY_AGENT,
    AgentType.CHANNEL_STRATEGIST_AGENT,
    AgentType.TIMING_OPTIMIZATION_AGENT,
    AgentType.COMMUNICATION_AGENT
  ],
  PERSONALIZATION_STRATEGY: [
    AgentType.PERSONALIZATION_AGENT,
    AgentType.CONTENT_STRATEGIST_AGENT,
    AgentType.RESEARCH_AGENT
  ],
  FOLLOW_UP_STRATEGY: [
    AgentType.STRATEGY_AGENT,
    AgentType.TIMING_OPTIMIZATION_AGENT,
    AgentType.COMMUNICATION_AGENT
  ],
  CAMPAIGN_OPTIMIZATION: [
    AgentType.STRATEGY_AGENT,
    AgentType.MARKET_INTELLIGENCE_AGENT,
    AgentType.CONTENT_STRATEGIST_AGENT,
    AgentType.CHANNEL_STRATEGIST_AGENT
  ]
};

/**
 * Agent collaboration modes
 */
const CollaborationMode = {
  SEQUENTIAL: 'sequential',
  PARALLEL: 'parallel',
  HIERARCHICAL: 'hierarchical',
  CONSENSUS: 'consensus'
};

/**
 * Enhanced Multi-Agent Ensemble for collaborative decision-making
 */
class MultiAgentEnsemble {
  /**
   * Create a new Multi-Agent Ensemble
   * @param {string} contextId - Unique identifier for this decision context
   * @param {boolean} testMode - Whether to run in test mode with mock data
   */
  constructor(contextId, testMode = false) {
    this.contextId = contextId;
    this.testMode = testMode || process.env.NODE_ENV === 'test' || contextId.includes('test');
    
    // Initialize LLM engine for agent communication
    this.llmEngine = new LLMEngine(contextId);
    
    // Initialize agent memory
    this.agentMemory = {};
    
    // Initialize collaboration history
    this.collaborationHistory = [];
    
    // Log initialization
    logger.info(`MultiAgentEnsemble initialized with contextId=${contextId}, testMode=${this.testMode}`);
  }
  
  /**
   * Generate a collaborative decision using multiple specialized agents
   * @param {Object} params - Collaboration parameters
   * @param {string} params.decisionType - Type of decision to make
   * @param {Object} params.context - Shared context for all agents
   * @param {Array<string>} [params.agentTypes] - Types of agents to involve (optional, will use default mapping if not provided)
   * @param {string} [params.collaborationMode] - Mode of collaboration (optional, defaults to CONSENSUS)
   * @param {Object} [params.constraints] - Constraints on the collaboration
   * @returns {Promise<Object>} Collaborative decision result
   */
  async generateCollaborativeDecision(params) {
    const { decisionType, context, agentTypes, collaborationMode = CollaborationMode.CONSENSUS, constraints = {} } = params;
    
    try {
      // Check test mode
      if (this.testMode) {
        return this.getMockCollaborativeDecision(decisionType);
      }
      
      // Validate parameters
      this.validateCollaborationParameters({ decisionType, context });
      
      // Determine which agents to involve
      const selectedAgentTypes = agentTypes || this.getDefaultAgentsForDecisionType(decisionType);
      
      // Generate unique collaboration ID
      const collaborationId = uuidv4();
      
      // Initialize collaboration context
      const collaborationContext = {
        id: collaborationId,
        decisionType,
        context,
        agentTypes: selectedAgentTypes,
        collaborationMode,
        constraints,
        startTime: new Date().toISOString(),
        status: 'in_progress',
        agentContributions: {},
        conflicts: [],
        resolutions: []
      };
      
      // Execute collaboration based on mode
      let result;
      switch (collaborationMode) {
        case CollaborationMode.SEQUENTIAL:
          result = await this.executeSequentialCollaboration(collaborationContext);
          break;
        case CollaborationMode.PARALLEL:
          result = await this.executeParallelCollaboration(collaborationContext);
          break;
        case CollaborationMode.HIERARCHICAL:
          result = await this.executeHierarchicalCollaboration(collaborationContext);
          break;
        case CollaborationMode.CONSENSUS:
        default:
          result = await this.executeConsensusCollaboration(collaborationContext);
          break;
      }
      
      // Update collaboration status
      collaborationContext.status = 'completed';
      collaborationContext.endTime = new Date().toISOString();
      collaborationContext.result = result;
      
      // Store collaboration history
      await this.storeCollaborationHistory(collaborationContext);
      
      // Update agent memory
      await this.updateAgentMemory(collaborationContext);
      
      return result;
    } catch (error) {
      logger.error('Failed to generate collaborative decision', {
        error: error.message,
        decisionType,
        contextId: this.contextId
      });
      
      throw new ReachSparkError(
        'Failed to generate collaborative decision',
        ErrorTypes.PROCESSING_ERROR,
        SeverityLevels.ERROR,
        error,
        { decisionType, contextId: this.contextId }
      );
    }
  }
  
  /**
   * Validate collaboration parameters
   * @param {Object} params - Collaboration parameters
   * @throws {ReachSparkError} If parameters are invalid
   * @private
   */
  validateCollaborationParameters({ decisionType, context }) {
    if (!decisionType) {
      throw new ReachSparkError(
        'Decision type is required',
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { contextId: this.contextId }
      );
    }
    
    if (!context || typeof context !== 'object') {
      throw new ReachSparkError(
        'Decision context is required and must be an object',
        ErrorTypes.VALIDATION_ERROR,
        SeverityLevels.ERROR,
        null,
        { decisionType, contextId: this.contextId }
      );
    }
  }
  
  /**
   * Get default agent types for a decision type
   * @param {string} decisionType - Type of decision
   * @returns {Array<string>} Array of agent types
   * @private
   */
  getDefaultAgentsForDecisionType(decisionType) {
    const agentTypes = DecisionTypeToAgentMap[decisionType];
    
    if (!agentTypes || agentTypes.length === 0) {
      // If no specific mapping exists, use a default set of agents
      return [
        AgentType.STRATEGY_AGENT,
        AgentType.ETHICS_ADVISOR_AGENT,
        AgentType.RISK_ASSESSMENT_AGENT
      ];
    }
    
    return agentTypes;
  }
  
  /**
   * Execute sequential collaboration where agents contribute one after another
   * @param {Object} collaborationContext - Collaboration context
   * @returns {Promise<Object>} Collaboration result
   * @private
   */
  async executeSequentialCollaboration(collaborationContext) {
    const { agentTypes, decisionType, context, constraints } = collaborationContext;
    
    // Initialize result with empty values
    let currentResult = {
      action: null,
      confidence: 0,
      reasoning: '',
      alternativeActions: [],
      agentContributions: {}
    };
    
    // Process agents in sequence
    for (const agentType of agentTypes) {
      // Get agent contribution
      const agentContribution = await this.getAgentContribution({
        agentType,
        decisionType,
        context,
        constraints,
        currentResult
      });
      
      // Store agent contribution
      collaborationContext.agentContributions[agentType] = agentContribution;
      
      // Update current result with agent contribution
      currentResult = this.integrateAgentContribution(currentResult, agentContribution);
    }
    
    return currentResult;
  }
  
  /**
   * Execute parallel collaboration where agents contribute simultaneously
   * @param {Object} collaborationContext - Collaboration context
   * @returns {Promise<Object>} Collaboration result
   * @private
   */
  async executeParallelCollaboration(collaborationContext) {
    const { agentTypes, decisionType, context, constraints } = collaborationContext;
    
    // Get contributions from all agents in parallel
    const contributionPromises = agentTypes.map(agentType => 
      this.getAgentContribution({
        agentType,
        decisionType,
        context,
        constraints
      })
    );
    
    const agentContributions = await Promise.all(contributionPromises);
    
    // Store agent contributions
    agentTypes.forEach((agentType, index) => {
      collaborationContext.agentContributions[agentType] = agentContributions[index];
    });
    
    // Integrate all contributions
    const result = this.integrateMultipleContributions(agentContributions);
    
    return result;
  }
  
  /**
   * Execute hierarchical collaboration where a lead agent coordinates others
   * @param {Object} collaborationContext - Collaboration context
   * @returns {Promise<Object>} Collaboration result
   * @private
   */
  async executeHierarchicalCollaboration(collaborationContext) {
    const { agentTypes, decisionType, context, constraints } = collaborationContext;
    
    // Determine lead agent based on decision type
    const leadAgentType = this.determineLeadAgent(decisionType, agentTypes);
    const supportingAgentTypes = agentTypes.filter(type => type !== leadAgentType);
    
    // Get contributions from supporting agents in parallel
    const supportingContributionPromises = supportingAgentTypes.map(agentType => 
      this.getAgentContribution({
        agentType,
        decisionType,
        context,
        constraints
      })
    );
    
    const supportingContributions = await Promise.all(supportingContributionPromises);
    
    // Store supporting agent contributions
    supportingAgentTypes.forEach((agentType, index) => {
      collaborationContext.agentContributions[agentType] = supportingContributions[index];
    });
    
    // Get lead agent contribution with supporting contributions as input
    const leadAgentContribution = await this.getAgentContribution({
      agentType: leadAgentType,
      decisionType,
      context,
      constraints,
      supportingContributions
    });
    
    // Store lead agent contribution
    collaborationContext.agentContributions[leadAgentType] = leadAgentContribution;
    
    // Lead agent's contribution is the final result
    return leadAgentContribution;
  }
  
  /**
   * Execute consensus collaboration where agents debate and reach agreement
   * @param {Object} collaborationContext - Collaboration context
   * @returns {Promise<Object>} Collaboration result
   * @private
   */
  async executeConsensusCollaboration(collaborationContext) {
    const { agentTypes, decisionType, context, constraints } = collaborationContext;
    
    // Get initial contributions from all agents in parallel
    const contributionPromises = agentTypes.map(agentType => 
      this.getAgentContribution({
        agentType,
        decisionType,
        context,
        constraints
      })
    );
    
    const initialContributions = await Promise.all(contributionPromises);
    
    // Store initial agent contributions
    agentTypes.forEach((agentType, index) => {
      collaborationContext.agentContributions[agentType] = initialContributions[index];
    });
    
    // Check for conflicts
    const conflicts = this.identifyConflicts(initialContributions);
    collaborationContext.conflicts = conflicts;
    
    // If no conflicts, integrate contributions and return
    if (conflicts.length === 0) {
      return this.integrateMultipleContributions(initialContributions);
    }
    
    // Resolve conflicts through debate
    const resolutions = await this.resolveConflictsThroughDebate(conflicts, collaborationContext);
    collaborationContext.resolutions = resolutions;
    
    // Get final contributions after debate
    const finalContributions = await Promise.all(agentTypes.map(agentType => 
      this.getAgentContribution({
        agentType,
        decisionType,
        context,
        constraints,
        conflicts,
        resolutions
      })
    ));
    
    // Update agent contributions with final versions
    agentTypes.forEach((agentType, index) => {
      collaborationContext.agentContributions[agentType] = finalContributions[index];
    });
    
    // Integrate final contributions
    return this.integrateMultipleContributions(finalContributions);
  }
  
  /**
   * Get contribution from a specific agent
   * @param {Object} params - Agent contribution parameters
   * @param {string} params.agentType - Type of agent
   * @param {string} params.decisionType - Type of decision
   * @param {Object} params.context - Decision context
   * @param {Object} params.constraints - Decision constraints
   * @param {Object} [params.currentResult] - Current result (for sequential collaboration)
   * @param {Array<Object>} [params.supportingContributions] - Contributions from supporting agents (for hierarchical collaboration)
   * @param {Array<Object>} [params.conflicts] - Identified conflicts (for consensus collaboration)
   * @param {Array<Object>} [params.resolutions] - Conflict resolutions (for consensus collaboration)
   * @returns {Promise<Object>} Agent contribution
   * @private
   */
  async getAgentContribution(params) {
    const { 
      agentType, 
      decisionType, 
      context, 
      constraints, 
      currentResult, 
      supportingContributions,
      conflicts,
      resolutions
    } = params;
    
    // Prepare agent prompt based on agent type and decision type
    const prompt = this.prepareAgentPrompt({
      agentType,
      decisionType,
      context,
      constraints,
      currentResult,
      supportingContributions,
      conflicts,
      resolutions
    });
    
    // Get agent memory for context
    const memory = this.getAgentMemory(agentType);
    
    // Generate agent response using LLM
    const response = await this.llmEngine.generateWithAgentRAG({
      prompt,
      agentType,
      memory,
      maxTokens: 1000
    });
    
    // Parse and validate agent response
    const contribution = this.parseAgentResponse(response, agentType);
    
    return contribution;
  }
  
  /**
   * Prepare prompt for agent based on agent type and decision context
   * @param {Object} params - Prompt parameters
   * @returns {string} Agent prompt
   * @private
   */
  prepareAgentPrompt(params) {
    const { 
      agentType, 
      decisionType, 
      context, 
      constraints, 
      currentResult, 
      supportingContributions,
      conflicts,
      resolutions
    } = params;
    
    // Base prompt with agent role and decision context
    let prompt = `You are the ${this.getAgentRoleDescription(agentType)} for the ReachSpark AMIA system.
    
You need to make a decision of type: ${decisionType}.

Context information:
${JSON.stringify(context, null, 2)}

Constraints:
${JSON.stringify(constraints, null, 2)}
`;
    
    // Add current result for sequential collaboration
    if (currentResult) {
      prompt += `\nCurrent decision state:
${JSON.stringify(currentResult, null, 2)}
      
Please review the current decision state and provide your contribution to improve or refine it.
`;
    }
    
    // Add supporting contributions for hierarchical collaboration
    if (supportingContributions) {
      prompt += `\nContributions from supporting agents:
${JSON.stringify(supportingContributions, null, 2)}
      
As the lead agent, please consider these contributions and make the final decision.
`;
    }
    
    // Add conflicts and resolutions for consensus collaboration
    if (conflicts && conflicts.length > 0) {
      prompt += `\nIdentified conflicts:
${JSON.stringify(conflicts, null, 2)}
`;
      
      if (resolutions && resolutions.length > 0) {
        prompt += `\nResolutions from debate:
${JSON.stringify(resolutions, null, 2)}
        
Please reconsider your contribution in light of these resolutions.
`;
      } else {
        prompt += `\nPlease reconsider your contribution to help resolve these conflicts.
`;
      }
    }
    
    // Add response format instructions
    prompt += `\nPlease provide your response in the following JSON format:
{
  "action": "recommended_action",
  "confidence": 0.85, // A number between 0 and 1
  "reasoning": "Detailed explanation of your reasoning",
  "alternativeActions": ["alternative_1", "alternative_2"],
  "considerations": {
    "key1": "value1",
    "key2": "value2"
  }
}
`;
    
    return prompt;
  }
  
  /**
   * Get role description for agent type
   * @param {string} agentType - Type of agent
   * @returns {string} Role description
   * @private
   */
  getAgentRoleDescription(agentType) {
    const roleDescriptions = {
      [AgentType.STRATEGY_AGENT]: 'Strategy Agent responsible for developing high-level strategies for lead generation and nurturing',
      [AgentType.RESEARCH_AGENT]: 'Research Agent responsible for gathering and analyzing information about prospects and markets',
      [AgentType.QUALIFICATION_AGENT]: 'Qualification Agent responsible for evaluating lead quality and potential',
      [AgentType.COMMUNICATION_AGENT]: 'Communication Agent responsible for optimizing messaging and channel selection',
      [AgentType.ETHICS_ADVISOR_AGENT]: 'Ethics Advisor Agent responsible for providing ethical guidance and compliance checks',
      [AgentType.RISK_ASSESSMENT_AGENT]: 'Risk Assessment Agent responsible for identifying and quantifying potential risks',
      [AgentType.MARKET_INTELLIGENCE_AGENT]: 'Market Intelligence Agent responsible for analyzing market trends and competitive landscape',
      [AgentType.CONTENT_STRATEGIST_AGENT]: 'Content Strategist Agent responsible for developing content strategies and recommendations',
      [AgentType.CHANNEL_STRATEGIST_AGENT]: 'Channel Strategist Agent responsible for optimizing channel selection and coordination',
      [AgentType.TIMING_OPTIMIZATION_AGENT]: 'Timing Optimization Agent responsible for determining optimal timing for actions',
      [AgentType.PERSONALIZATION_AGENT]: 'Personalization Agent responsible for tailoring approaches to individual prospects'
    };
    
    return roleDescriptions[agentType] || `${agentType} specialist`;
  }
  
  /**
   * Parse and validate agent response
   * @param {string} response - Raw response from LLM
   * @param {string} agentType - Type of agent
   * @returns {Object} Parsed and validated agent contribution
   * @private
   */
  parseAgentResponse(response, agentType) {
    try {
      // Extract JSON from response (in case LLM includes additional text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      // Parse JSON
      const parsedResponse = JSON.parse(jsonString);
      
      // Validate required fields
      if (!parsedResponse.action) {
        throw new Error('Missing required field: action');
      }
      
      if (typeof parsedResponse.confidence !== 'number' || parsedResponse.confidence < 0 || parsedResponse.confidence > 1) {
        throw new Error('Invalid confidence value: must be a number between 0 and 1');
      }
      
      if (!parsedResponse.reasoning) {
        throw new Error('Missing required field: reasoning');
      }
      
      if (!Array.isArray(parsedResponse.alternativeActions)) {
        throw new Error('Invalid alternativeActions: must be an array');
      }
      
      // Add agent type to response
      parsedResponse.agentType = agentType;
      
      return parsedResponse;
    } catch (error) {
      logger.warn(`Failed to parse agent response from ${agentType}`, {
        error: error.message,
        response,
        contextId: this.contextId
      });
      
      // Return fallback response
      return {
        action: 'fallback_action',
        confidence: 0.5,
        reasoning: `Failed to parse response: ${error.message}. Original response: ${response}`,
        alternativeActions: ['review_manually'],
        agentType,
        isErrorResponse: true
      };
    }
  }
  
  /**
   * Integrate agent contribution into current result
   * @param {Object} currentResult - Current result
   * @param {Object} agentContribution - Agent contribution
   * @returns {Object} Updated result
   * @private
   */
  integrateAgentContribution(currentResult, agentContribution) {
    // If this is the first contribution, use it as the base
    if (!currentResult.action) {
      return {
        ...agentContribution,
        agentContributions: {
          [agentContribution.agentType]: agentContribution
        }
      };
    }
    
    // Combine reasoning
    const combinedReasoning = `${currentResult.reasoning}\n\n${agentContribution.agentType}: ${agentContribution.reasoning}`;
    
    // Combine alternative actions (remove duplicates)
    const allAlternativeActions = [
      ...currentResult.alternativeActions,
      ...agentContribution.alternativeActions
    ];
    const uniqueAlternativeActions = [...new Set(allAlternativeActions)];
    
    // Determine whether to update the action based on confidence
    let action = currentResult.action;
    let confidence = currentResult.confidence;
    
    if (agentContribution.confidence > currentResult.confidence) {
      action = agentContribution.action;
      confidence = agentContribution.confidence;
    }
    
    // Update agent contributions
    const agentContributions = {
      ...currentResult.agentContributions,
      [agentContribution.agentType]: agentContribution
    };
    
    return {
      action,
      confidence,
      reasoning: combinedReasoning,
      alternativeActions: uniqueAlternativeActions,
      agentContributions
    };
  }
  
  /**
   * Integrate multiple agent contributions
   * @param {Array<Object>} contributions - Agent contributions
   * @returns {Object} Integrated result
   * @private
   */
  integrateMultipleContributions(contributions) {
    // Start with empty result
    let result = {
      action: null,
      confidence: 0,
      reasoning: '',
      alternativeActions: [],
      agentContributions: {}
    };
    
    // Integrate each contribution
    for (const contribution of contributions) {
      result = this.integrateAgentContribution(result, contribution);
    }
    
    return result;
  }
  
  /**
   * Identify conflicts between agent contributions
   * @param {Array<Object>} contributions - Agent contributions
   * @returns {Array<Object>} Identified conflicts
   * @private
   */
  identifyConflicts(contributions) {
    const conflicts = [];
    
    // Group contributions by action
    const actionGroups = {};
    for (const contribution of contributions) {
      const { action, agentType } = contribution;
      if (!actionGroups[action]) {
        actionGroups[action] = [];
      }
      actionGroups[action].push(agentType);
    }
    
    // If all agents agree on the same action, no conflicts
    if (Object.keys(actionGroups).length <= 1) {
      return conflicts;
    }
    
    // Create conflict objects for disagreements
    const actions = Object.keys(actionGroups);
    for (let i = 0; i < actions.length; i++) {
      for (let j = i + 1; j < actions.length; j++) {
        conflicts.push({
          id: uuidv4(),
          type: 'action_disagreement',
          description: `Disagreement on recommended action`,
          agents: {
            [actions[i]]: actionGroups[actions[i]],
            [actions[j]]: actionGroups[actions[j]]
          }
        });
      }
    }
    
    // Check for confidence disagreements (agents agree on action but have significantly different confidence)
    for (const action of actions) {
      const agentsForAction = actionGroups[action];
      if (agentsForAction.length > 1) {
        const contributionsForAction = contributions.filter(c => c.action === action);
        const confidences = contributionsForAction.map(c => c.confidence);
        const minConfidence = Math.min(...confidences);
        const maxConfidence = Math.max(...confidences);
        
        // If confidence difference is significant (>0.3), create conflict
        if (maxConfidence - minConfidence > 0.3) {
          conflicts.push({
            id: uuidv4(),
            type: 'confidence_disagreement',
            description: `Significant confidence difference for action "${action}"`,
            action,
            confidenceRange: {
              min: minConfidence,
              max: maxConfidence
            },
            agents: contributionsForAction.map(c => ({
              agentType: c.agentType,
              confidence: c.confidence
            }))
          });
        }
      }
    }
    
    return conflicts;
  }
  
  /**
   * Resolve conflicts through agent debate
   * @param {Array<Object>} conflicts - Identified conflicts
   * @param {Object} collaborationContext - Collaboration context
   * @returns {Promise<Array<Object>>} Conflict resolutions
   * @private
   */
  async resolveConflictsThroughDebate(conflicts, collaborationContext) {
    const { agentTypes, decisionType, context, constraints, agentContributions } = collaborationContext;
    
    const resolutions = [];
    
    // Process each conflict
    for (const conflict of conflicts) {
      // Prepare debate prompt
      const debatePrompt = this.prepareDebatePrompt({
        conflict,
        decisionType,
        context,
        constraints,
        agentContributions
      });
      
      // Generate resolution using LLM
      const resolutionResponse = await this.llmEngine.generateWithAgentRAG({
        prompt: debatePrompt,
        agentType: 'debate_moderator',
        maxTokens: 1500
      });
      
      // Parse resolution
      const resolution = this.parseResolutionResponse(resolutionResponse, conflict);
      
      resolutions.push(resolution);
    }
    
    return resolutions;
  }
  
  /**
   * Prepare prompt for conflict debate
   * @param {Object} params - Debate parameters
   * @returns {string} Debate prompt
   * @private
   */
  prepareDebatePrompt(params) {
    const { conflict, decisionType, context, constraints, agentContributions } = params;
    
    let prompt = `You are the Debate Moderator for the ReachSpark AMIA system.
    
There is a conflict between agents regarding a decision of type: ${decisionType}.

Context information:
${JSON.stringify(context, null, 2)}

Constraints:
${JSON.stringify(constraints, null, 2)}

Conflict details:
${JSON.stringify(conflict, null, 2)}

Agent contributions:
${JSON.stringify(agentContributions, null, 2)}

Please moderate a debate between the agents and provide a resolution that considers all perspectives.

Your response should be in the following JSON format:
{
  "conflictId": "${conflict.id}",
  "resolution": "detailed_resolution_decision",
  "reasoning": "Detailed explanation of the resolution reasoning",
  "recommendedAction": "action_to_take",
  "confidence": 0.85, // A number between 0 and 1
  "agentFeedback": {
    "agentType1": "Feedback for this agent",
    "agentType2": "Feedback for this agent"
  }
}
`;
    
    return prompt;
  }
  
  /**
   * Parse resolution response
   * @param {string} response - Raw response from LLM
   * @param {Object} conflict - Original conflict
   * @returns {Object} Parsed resolution
   * @private
   */
  parseResolutionResponse(response, conflict) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      // Parse JSON
      const parsedResponse = JSON.parse(jsonString);
      
      // Validate required fields
      if (!parsedResponse.resolution) {
        throw new Error('Missing required field: resolution');
      }
      
      if (!parsedResponse.recommendedAction) {
        throw new Error('Missing required field: recommendedAction');
      }
      
      // Add timestamp and original conflict
      parsedResponse.timestamp = new Date().toISOString();
      parsedResponse.originalConflict = conflict;
      
      return parsedResponse;
    } catch (error) {
      logger.warn(`Failed to parse resolution response`, {
        error: error.message,
        response,
        conflictId: conflict.id,
        contextId: this.contextId
      });
      
      // Return fallback resolution
      return {
        conflictId: conflict.id,
        resolution: 'Failed to parse resolution response',
        reasoning: `Error: ${error.message}. Original response: ${response}`,
        recommendedAction: 'review_manually',
        confidence: 0.5,
        timestamp: new Date().toISOString(),
        originalConflict: conflict,
        isErrorResponse: true
      };
    }
  }
  
  /**
   * Determine lead agent for hierarchical collaboration
   * @param {string} decisionType - Type of decision
   * @param {Array<string>} agentTypes - Available agent types
   * @returns {string} Lead agent type
   * @private
   */
  determineLeadAgent(decisionType, agentTypes) {
    // Decision type specific lead agents
    const decisionTypeLeadMap = {
      LEAD_QUALIFICATION: AgentType.QUALIFICATION_AGENT,
      ENGAGEMENT_STRATEGY: AgentType.STRATEGY_AGENT,
      CONTENT_SELECTION: AgentType.CONTENT_STRATEGIST_AGENT,
      CHANNEL_SELECTION: AgentType.CHANNEL_STRATEGIST_AGENT,
      TIMING_OPTIMIZATION: AgentType.TIMING_OPTIMIZATION_AGENT,
      MULTI_CHANNEL_ORCHESTRATION: AgentType.STRATEGY_AGENT,
      PERSONALIZATION_STRATEGY: AgentType.PERSONALIZATION_AGENT,
      FOLLOW_UP_STRATEGY: AgentType.STRATEGY_AGENT,
      CAMPAIGN_OPTIMIZATION: AgentType.STRATEGY_AGENT
    };
    
    // Get preferred lead agent for this decision type
    const preferredLeadAgent = decisionTypeLeadMap[decisionType];
    
    // If preferred lead agent is available, use it
    if (preferredLeadAgent && agentTypes.includes(preferredLeadAgent)) {
      return preferredLeadAgent;
    }
    
    // Otherwise, use strategy agent if available
    if (agentTypes.includes(AgentType.STRATEGY_AGENT)) {
      return AgentType.STRATEGY_AGENT;
    }
    
    // If strategy agent not available, use first agent in list
    return agentTypes[0];
  }
  
  /**
   * Get agent memory for context
   * @param {string} agentType - Type of agent
   * @returns {Object} Agent memory
   * @private
   */
  getAgentMemory(agentType) {
    if (!this.agentMemory[agentType]) {
      this.agentMemory[agentType] = {
        recentDecisions: [],
        insights: [],
        lastUpdated: null
      };
    }
    
    return this.agentMemory[agentType];
  }
  
  /**
   * Update agent memory with new collaboration context
   * @param {Object} collaborationContext - Collaboration context
   * @returns {Promise<void>}
   * @private
   */
  async updateAgentMemory(collaborationContext) {
    const { agentTypes, result, decisionType, context } = collaborationContext;
    
    // Skip for test mode
    if (this.testMode) {
      return;
    }
    
    // Update memory for each agent
    for (const agentType of agentTypes) {
      if (!this.agentMemory[agentType]) {
        this.agentMemory[agentType] = {
          recentDecisions: [],
          insights: [],
          lastUpdated: null
        };
      }
      
      const memory = this.agentMemory[agentType];
      
      // Add recent decision
      memory.recentDecisions.unshift({
        decisionType,
        contextSummary: this.summarizeContext(context),
        result: {
          action: result.action,
          confidence: result.confidence
        },
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 10 decisions
      if (memory.recentDecisions.length > 10) {
        memory.recentDecisions.pop();
      }
      
      // Update timestamp
      memory.lastUpdated = new Date().toISOString();
      
      // Generate insight if enough decisions
      if (memory.recentDecisions.length >= 5) {
        try {
          const insight = await this.generateAgentInsight(agentType, memory.recentDecisions);
          memory.insights.unshift(insight);
          
          // Keep only last 5 insights
          if (memory.insights.length > 5) {
            memory.insights.pop();
          }
        } catch (error) {
          logger.warn(`Failed to generate insight for ${agentType}`, {
            error: error.message,
            contextId: this.contextId
          });
        }
      }
    }
  }
  
  /**
   * Summarize context for memory storage
   * @param {Object} context - Full context
   * @returns {Object} Summarized context
   * @private
   */
  summarizeContext(context) {
    // Create a simplified version of context for memory
    const summary = {};
    
    // Include only key fields
    const keyFields = ['leadId', 'companyName', 'industry', 'stage', 'score', 'channel'];
    
    for (const field of keyFields) {
      if (context[field] !== undefined) {
        summary[field] = context[field];
      }
    }
    
    return summary;
  }
  
  /**
   * Generate insight from recent decisions
   * @param {string} agentType - Type of agent
   * @param {Array<Object>} recentDecisions - Recent decisions
   * @returns {Promise<Object>} Generated insight
   * @private
   */
  async generateAgentInsight(agentType, recentDecisions) {
    const prompt = `You are the ${this.getAgentRoleDescription(agentType)} for the ReachSpark AMIA system.
    
Review these recent decisions you've been involved in:
${JSON.stringify(recentDecisions, null, 2)}

Please analyze these decisions and identify an insight or pattern that could improve future decision-making.

Your response should be in the following JSON format:
{
  "insight": "Brief description of the insight",
  "pattern": "Pattern identified in the decisions",
  "recommendation": "Recommendation for future decisions",
  "confidence": 0.85 // A number between 0 and 1
}
`;
    
    const response = await this.llmEngine.generateWithAgentRAG({
      prompt,
      agentType,
      maxTokens: 800
    });
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      // Parse JSON
      const parsedResponse = JSON.parse(jsonString);
      
      // Add timestamp
      parsedResponse.timestamp = new Date().toISOString();
      
      return parsedResponse;
    } catch (error) {
      logger.warn(`Failed to parse insight response for ${agentType}`, {
        error: error.message,
        response,
        contextId: this.contextId
      });
      
      // Return fallback insight
      return {
        insight: 'Failed to generate insight',
        pattern: 'Error in pattern analysis',
        recommendation: 'Continue with current approach',
        confidence: 0.5,
        timestamp: new Date().toISOString(),
        isErrorResponse: true
      };
    }
  }
  
  /**
   * Store collaboration history in Firestore
   * @param {Object} collaborationContext - Collaboration context
   * @returns {Promise<void>}
   * @private
   */
  async storeCollaborationHistory(collaborationContext) {
    // Skip for test mode
    if (this.testMode) {
      return;
    }
    
    try {
      // Create a clean version for storage (remove circular references)
      const storageVersion = JSON.parse(JSON.stringify(collaborationContext));
      
      // Store in Firestore
      await db.collection('agent_collaborations').doc(collaborationContext.id).set(storageVersion);
      
      // Add to collaboration history
      this.collaborationHistory.unshift({
        id: collaborationContext.id,
        decisionType: collaborationContext.decisionType,
        startTime: collaborationContext.startTime,
        endTime: collaborationContext.endTime,
        result: {
          action: collaborationContext.result.action,
          confidence: collaborationContext.result.confidence
        }
      });
      
      // Keep history at reasonable size
      if (this.collaborationHistory.length > 20) {
        this.collaborationHistory.pop();
      }
    } catch (error) {
      logger.warn('Failed to store collaboration history', {
        error: error.message,
        collaborationId: collaborationContext.id,
        contextId: this.contextId
      });
    }
  }
  
  /**
   * Get mock collaborative decision for testing
   * @param {string} decisionType - Type of decision
   * @returns {Object} Mock decision
   * @private
   */
  getMockCollaborativeDecision(decisionType) {
    // Mock decisions for different types
    const mockDecisions = {
      LEAD_QUALIFICATION: {
        action: 'qualify_lead',
        confidence: 0.85,
        reasoning: 'Mock reasoning for lead qualification',
        alternativeActions: ['request_more_information', 'disqualify_lead'],
        agentContributions: {
          [AgentType.QUALIFICATION_AGENT]: {
            action: 'qualify_lead',
            confidence: 0.9,
            reasoning: 'Lead meets all qualification criteria',
            alternativeActions: ['request_more_information']
          },
          [AgentType.RESEARCH_AGENT]: {
            action: 'qualify_lead',
            confidence: 0.8,
            reasoning: 'Company profile indicates good fit',
            alternativeActions: ['request_more_information']
          }
        }
      },
      CHANNEL_SELECTION: {
        action: 'email',
        confidence: 0.75,
        reasoning: 'Mock reasoning for channel selection',
        alternativeActions: ['linkedin', 'phone'],
        agentContributions: {
          [AgentType.CHANNEL_STRATEGIST_AGENT]: {
            action: 'email',
            confidence: 0.8,
            reasoning: 'Email is most appropriate for initial contact',
            alternativeActions: ['linkedin']
          },
          [AgentType.COMMUNICATION_AGENT]: {
            action: 'linkedin',
            confidence: 0.7,
            reasoning: 'LinkedIn might provide better visibility',
            alternativeActions: ['email', 'phone']
          }
        }
      }
    };
    
    // Return specific mock decision or default
    return mockDecisions[decisionType] || {
      action: 'default_action',
      confidence: 0.7,
      reasoning: `Mock reasoning for ${decisionType}`,
      alternativeActions: ['alternative_1', 'alternative_2'],
      agentContributions: {
        [AgentType.STRATEGY_AGENT]: {
          action: 'default_action',
          confidence: 0.7,
          reasoning: 'Default mock reasoning',
          alternativeActions: ['alternative_1']
        }
      }
    };
  }
}

module.exports = {
  MultiAgentEnsemble,
  AgentType,
  CollaborationMode
};
