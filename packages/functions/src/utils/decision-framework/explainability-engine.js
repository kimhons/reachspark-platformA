/**
 * Enhanced Explainability Engine for ReachSpark AMIA
 * 
 * This module implements advanced explainability features for the Enhanced Decision Framework,
 * ensuring all decisions are transparent, auditable, and understandable to stakeholders.
 * 
 * Key Features:
 * - Decision tracing with detailed factor analysis
 * - Counterfactual explanations for "what-if" scenarios
 * - Confidence metrics with uncertainty quantification
 * - Natural language explanations tailored to different audiences
 * - Visual explanation generation for complex decisions
 * - Audit trail for compliance and governance
 */

const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const { logger, ReachSparkError, ErrorTypes, SeverityLevels } = require('./errorLogging');
const { retryWithExponentialBackoff } = require('./retryLogic');

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
        explanation: "This is a mock explanation for testing purposes."
      });
    }
    async generateWithAgentDirect() {
      return "This is a mock direct explanation for testing purposes.";
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
 * Audience types for tailored explanations
 */
const AudienceType = {
  TECHNICAL: 'technical',
  BUSINESS: 'business',
  EXECUTIVE: 'executive',
  REGULATORY: 'regulatory',
  CUSTOMER: 'customer'
};

/**
 * Explanation formats for different use cases
 */
const ExplanationFormat = {
  TEXT: 'text',
  HTML: 'html',
  JSON: 'json',
  MARKDOWN: 'markdown'
};

/**
 * Detail levels for explanations
 */
const DetailLevel = {
  MINIMAL: 1,
  BRIEF: 2,
  STANDARD: 3,
  DETAILED: 4,
  COMPREHENSIVE: 5
};

/**
 * Enhanced Explainability Engine for AMIA
 */
class ExplainabilityEngine {
  /**
   * Create a new Explainability Engine
   * @param {string} contextId - Unique identifier for this explanation context
   * @param {boolean} testMode - Whether to run in test mode with mock data
   */
  constructor(contextId, testMode = false) {
    this.contextId = contextId;
    this.testMode = testMode || process.env.NODE_ENV === 'test' || contextId.includes('test');
    
    // Initialize LLM engine for natural language explanations
    this.llmEngine = new LLMEngine(contextId);
    
    // Initialize explanation cache
    this.explanationCache = new Map();
    
    // Log initialization
    logger.info(`ExplainabilityEngine initialized with contextId=${contextId}, testMode=${this.testMode}`);
  }
  
  /**
   * Generate explanation for a decision
   * @param {Object} params - Explanation parameters
   * @param {string} params.decisionId - ID of the decision to explain
   * @param {string} [params.audienceType=AudienceType.BUSINESS] - Type of audience
   * @param {boolean} [params.includeCounterfactuals=false] - Whether to include counterfactual analysis
   * @param {number} [params.detailLevel=DetailLevel.STANDARD] - Level of detail (1-5)
   * @param {string} [params.format=ExplanationFormat.TEXT] - Format of the explanation
   * @returns {Promise<Object>} Explanation with multiple formats and detail levels
   */
  async generateDecisionExplanation(params) {
    const { 
      decisionId, 
      audienceType = AudienceType.BUSINESS, 
      includeCounterfactuals = false, 
      detailLevel = DetailLevel.STANDARD,
      format = ExplanationFormat.TEXT
    } = params;
    
    try {
      // Check test mode
      if (this.testMode) {
        return this.getMockExplanation(decisionId, audienceType, includeCounterfactuals, detailLevel);
      }
      
      // Check cache first
      const cacheKey = `${decisionId}:${audienceType}:${includeCounterfactuals}:${detailLevel}:${format}`;
      if (this.explanationCache.has(cacheKey)) {
        return this.explanationCache.get(cacheKey);
      }
      
      // Load decision data
      const decision = await this.loadDecisionData(decisionId);
      
      if (!decision) {
        throw new ReachSparkError(
          'Decision not found',
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR,
          null,
          { decisionId, contextId: this.contextId }
        );
      }
      
      // Generate explanation components
      const factorAnalysis = await this.generateFactorAnalysis(decision, detailLevel);
      const confidenceAnalysis = await this.generateConfidenceAnalysis(decision, detailLevel);
      const naturalLanguageExplanation = await this.generateNaturalLanguageExplanation(
        decision, audienceType, detailLevel, factorAnalysis, confidenceAnalysis
      );
      
      // Generate counterfactuals if requested
      let counterfactualAnalysis = null;
      if (includeCounterfactuals) {
        counterfactualAnalysis = await this.generateCounterfactualAnalysis(decision, detailLevel);
      }
      
      // Assemble complete explanation
      const explanation = {
        decisionId,
        timestamp: new Date().toISOString(),
        audienceType,
        detailLevel,
        format,
        decision: {
          type: decision.type,
          action: decision.action,
          confidence: decision.confidence,
          timestamp: decision.timestamp
        },
        factorAnalysis,
        confidenceAnalysis,
        explanation: this.formatExplanation(naturalLanguageExplanation, format),
        counterfactualAnalysis: counterfactualAnalysis ? 
          this.formatExplanation(counterfactualAnalysis, format) : null,
        visualElements: this.generateVisualElements(decision, factorAnalysis, confidenceAnalysis, counterfactualAnalysis)
      };
      
      // Cache explanation
      this.explanationCache.set(cacheKey, explanation);
      
      // Store explanation in database
      await this.storeExplanation(explanation);
      
      return explanation;
    } catch (error) {
      logger.error('Failed to generate decision explanation', {
        error: error.message,
        decisionId,
        contextId: this.contextId
      });
      
      throw new ReachSparkError(
        'Failed to generate decision explanation',
        ErrorTypes.PROCESSING_ERROR,
        SeverityLevels.ERROR,
        error,
        { decisionId, contextId: this.contextId }
      );
    }
  }
  
  /**
   * Load decision data from database
   * @param {string} decisionId - ID of the decision
   * @returns {Promise<Object|null>} Decision data or null if not found
   * @private
   */
  async loadDecisionData(decisionId) {
    try {
      // Try to load from decision logs
      const decisionDoc = await db.collection('decision_logs').doc(decisionId).get();
      
      if (decisionDoc.exists) {
        return decisionDoc.data();
      }
      
      // If not found in decision logs, try agent collaborations
      const collaborationDoc = await db.collection('agent_collaborations').doc(decisionId).get();
      
      if (collaborationDoc.exists) {
        const collaboration = collaborationDoc.data();
        return {
          id: collaboration.id,
          type: collaboration.decisionType,
          context: collaboration.context,
          action: collaboration.result?.action,
          confidence: collaboration.result?.confidence,
          reasoning: collaboration.result?.reasoning,
          alternativeActions: collaboration.result?.alternativeActions,
          agentContributions: collaboration.agentContributions,
          timestamp: collaboration.endTime
        };
      }
      
      return null;
    } catch (error) {
      logger.warn('Failed to load decision data', {
        error: error.message,
        decisionId,
        contextId: this.contextId
      });
      
      return null;
    }
  }
  
  /**
   * Generate factor analysis for a decision
   * @param {Object} decision - Decision data
   * @param {number} detailLevel - Level of detail
   * @returns {Promise<Object>} Factor analysis
   * @private
   */
  async generateFactorAnalysis(decision, detailLevel) {
    try {
      // Extract factors from decision data
      const factors = [];
      
      // Extract from agent contributions if available
      if (decision.agentContributions) {
        for (const [agentType, contribution] of Object.entries(decision.agentContributions)) {
          // Skip if no reasoning
          if (!contribution.reasoning) continue;
          
          // Extract factors from reasoning
          const agentFactors = await this.extractFactorsFromReasoning(
            contribution.reasoning,
            agentType,
            detailLevel
          );
          
          factors.push(...agentFactors);
        }
      }
      
      // Extract from main reasoning if available
      if (decision.reasoning) {
        const mainFactors = await this.extractFactorsFromReasoning(
          decision.reasoning,
          'main',
          detailLevel
        );
        
        factors.push(...mainFactors);
      }
      
      // If no factors extracted, generate synthetic ones
      if (factors.length === 0) {
        const syntheticFactors = await this.generateSyntheticFactors(decision, detailLevel);
        factors.push(...syntheticFactors);
      }
      
      // Calculate factor importance
      const factorsWithImportance = this.calculateFactorImportance(factors);
      
      // Sort by importance
      factorsWithImportance.sort((a, b) => b.importance - a.importance);
      
      // Limit factors based on detail level
      const maxFactors = Math.min(factorsWithImportance.length, detailLevel * 3);
      const limitedFactors = factorsWithImportance.slice(0, maxFactors);
      
      return {
        factors: limitedFactors,
        primaryFactor: limitedFactors[0],
        factorCount: factors.length,
        includedFactorCount: limitedFactors.length
      };
    } catch (error) {
      logger.warn('Failed to generate factor analysis, using fallback', {
        error: error.message,
        decisionId: decision.id,
        contextId: this.contextId
      });
      
      // Return fallback analysis
      return {
        factors: [
          {
            id: 'fallback_factor_1',
            description: 'Primary decision factor (fallback)',
            importance: 0.8,
            source: 'fallback',
            direction: 'positive'
          }
        ],
        primaryFactor: {
          id: 'fallback_factor_1',
          description: 'Primary decision factor (fallback)',
          importance: 0.8,
          source: 'fallback',
          direction: 'positive'
        },
        factorCount: 1,
        includedFactorCount: 1
      };
    }
  }
  
  /**
   * Extract factors from reasoning text
   * @param {string} reasoning - Reasoning text
   * @param {string} source - Source of the reasoning
   * @param {number} detailLevel - Level of detail
   * @returns {Promise<Array<Object>>} Extracted factors
   * @private
   */
  async extractFactorsFromReasoning(reasoning, source, detailLevel) {
    try {
      // Use LLM to extract factors
      const prompt = `
Extract the key factors that influenced the following decision reasoning:

"${reasoning}"

Please identify the main factors that led to this decision, their relative importance, and whether each factor had a positive or negative influence on the decision.

Return your analysis as a JSON array of factors, where each factor has:
- A brief description (1-2 sentences)
- An importance score between 0 and 1
- A direction ("positive" or "negative")

Example format:
[
  {
    "description": "The lead has shown high engagement with previous content",
    "importance": 0.8,
    "direction": "positive"
  },
  {
    "description": "The lead's company is in an industry with low conversion rates",
    "importance": 0.4,
    "direction": "negative"
  }
]

Extract ${Math.min(5, detailLevel * 2)} most important factors.
`;

      const response = await this.llmEngine.generateWithAgentRAG({
        prompt,
        agentType: 'explainer',
        maxTokens: 1000
      });
      
      // Parse response
      const factorsMatch = response.match(/\[[\s\S]*\]/);
      if (!factorsMatch) {
        return [];
      }
      
      const factorsJson = factorsMatch[0];
      const factors = JSON.parse(factorsJson);
      
      // Add IDs and source
      return factors.map(factor => ({
        id: `factor_${uuidv4().substring(0, 8)}`,
        description: factor.description,
        importance: factor.importance,
        direction: factor.direction,
        source
      }));
    } catch (error) {
      logger.warn('Failed to extract factors from reasoning', {
        error: error.message,
        contextId: this.contextId
      });
      
      return [];
    }
  }
  
  /**
   * Generate synthetic factors when extraction fails
   * @param {Object} decision - Decision data
   * @param {number} detailLevel - Level of detail
   * @returns {Promise<Array<Object>>} Synthetic factors
   * @private
   */
  async generateSyntheticFactors(decision, detailLevel) {
    try {
      // Use LLM to generate synthetic factors
      const prompt = `
Based on the following decision information, generate plausible factors that likely influenced this decision:

Decision Type: ${decision.type}
Selected Action: ${decision.action}
Confidence: ${decision.confidence}
Alternative Actions: ${decision.alternativeActions?.join(', ') || 'None'}

Context: ${JSON.stringify(decision.context || {})}

Please generate ${Math.min(5, detailLevel * 2)} plausible factors that would reasonably explain this decision.

Return your analysis as a JSON array of factors, where each factor has:
- A brief description (1-2 sentences)
- An importance score between 0 and 1
- A direction ("positive" or "negative")

Example format:
[
  {
    "description": "The lead has shown high engagement with previous content",
    "importance": 0.8,
    "direction": "positive"
  },
  {
    "description": "The lead's company is in an industry with low conversion rates",
    "importance": 0.4,
    "direction": "negative"
  }
]
`;

      const response = await this.llmEngine.generateWithAgentRAG({
        prompt,
        agentType: 'explainer',
        maxTokens: 1000
      });
      
      // Parse response
      const factorsMatch = response.match(/\[[\s\S]*\]/);
      if (!factorsMatch) {
        return [];
      }
      
      const factorsJson = factorsMatch[0];
      const factors = JSON.parse(factorsJson);
      
      // Add IDs and source
      return factors.map(factor => ({
        id: `synthetic_${uuidv4().substring(0, 8)}`,
        description: factor.description,
        importance: factor.importance,
        direction: factor.direction,
        source: 'synthetic'
      }));
    } catch (error) {
      logger.warn('Failed to generate synthetic factors', {
        error: error.message,
        contextId: this.contextId
      });
      
      return [
        {
          id: `synthetic_${uuidv4().substring(0, 8)}`,
          description: 'Decision based on available information and system policy',
          importance: 0.8,
          direction: 'positive',
          source: 'synthetic'
        }
      ];
    }
  }
  
  /**
   * Calculate factor importance
   * @param {Array<Object>} factors - Extracted factors
   * @returns {Array<Object>} Factors with calculated importance
   * @private
   */
  calculateFactorImportance(factors) {
    // If factors already have importance, just normalize
    if (factors.every(f => typeof f.importance === 'number')) {
      // Find max importance
      const maxImportance = Math.max(...factors.map(f => f.importance));
      
      // Normalize if max is not 1
      if (maxImportance !== 1 && maxImportance !== 0) {
        return factors.map(f => ({
          ...f,
          importance: f.importance / maxImportance
        }));
      }
      
      return factors;
    }
    
    // Otherwise, assign default importance
    return factors.map((f, index) => ({
      ...f,
      importance: 1 - (index * 0.15) // Decreasing importance
    }));
  }
  
  /**
   * Generate confidence analysis for a decision
   * @param {Object} decision - Decision data
   * @param {number} detailLevel - Level of detail
   * @returns {Promise<Object>} Confidence analysis
   * @private
   */
  async generateConfidenceAnalysis(decision, detailLevel) {
    try {
      // Extract base confidence
      const baseConfidence = decision.confidence || 0.7;
      
      // Extract agent confidences if available
      const agentConfidences = {};
      if (decision.agentContributions) {
        for (const [agentType, contribution] of Object.entries(decision.agentContributions)) {
          if (typeof contribution.confidence === 'number') {
            agentConfidences[agentType] = contribution.confidence;
          }
        }
      }
      
      // Calculate confidence metrics
      const confidenceMetrics = this.calculateConfidenceMetrics(baseConfidence, agentConfidences);
      
      // Generate confidence factors
      const confidenceFactors = await this.generateConfidenceFactors(
        decision, confidenceMetrics, detailLevel
      );
      
      return {
        overallConfidence: baseConfidence,
        confidenceRange: {
          min: confidenceMetrics.minConfidence,
          max: confidenceMetrics.maxConfidence
        },
        uncertaintyLevel: 1 - baseConfidence,
        agentConfidences,
        confidenceFactors,
        confidenceInterpretation: this.interpretConfidence(baseConfidence)
      };
    } catch (error) {
      logger.warn('Failed to generate confidence analysis, using fallback', {
        error: error.message,
        decisionId: decision.id,
        contextId: this.contextId
      });
      
      // Return fallback analysis
      const baseConfidence = decision.confidence || 0.7;
      return {
        overallConfidence: baseConfidence,
        confidenceRange: {
          min: baseConfidence - 0.1,
          max: baseConfidence + 0.1
        },
        uncertaintyLevel: 1 - baseConfidence,
        agentConfidences: {},
        confidenceFactors: [
          {
            factor: 'System confidence',
            impact: baseConfidence
          }
        ],
        confidenceInterpretation: this.interpretConfidence(baseConfidence)
      };
    }
  }
  
  /**
   * Calculate confidence metrics
   * @param {number} baseConfidence - Base confidence value
   * @param {Object} agentConfidences - Agent confidence values
   * @returns {Object} Confidence metrics
   * @private
   */
  calculateConfidenceMetrics(baseConfidence, agentConfidences) {
    // Get all confidence values
    const confidenceValues = [baseConfidence];
    for (const confidence of Object.values(agentConfidences)) {
      confidenceValues.push(confidence);
    }
    
    // Calculate metrics
    const minConfidence = Math.min(...confidenceValues);
    const maxConfidence = Math.max(...confidenceValues);
    const avgConfidence = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
    const stdDeviation = Math.sqrt(
      confidenceValues.reduce((sum, val) => sum + Math.pow(val - avgConfidence, 2), 0) / confidenceValues.length
    );
    
    return {
      minConfidence,
      maxConfidence,
      avgConfidence,
      stdDeviation,
      consensusLevel: 1 - stdDeviation
    };
  }
  
  /**
   * Generate confidence factors
   * @param {Object} decision - Decision data
   * @param {Object} confidenceMetrics - Confidence metrics
   * @param {number} detailLevel - Level of detail
   * @returns {Promise<Array<Object>>} Confidence factors
   * @private
   */
  async generateConfidenceFactors(decision, confidenceMetrics, detailLevel) {
    try {
      // Use LLM to generate confidence factors
      const prompt = `
Based on the following decision information and confidence metrics, generate factors that explain the confidence level:

Decision Type: ${decision.type}
Selected Action: ${decision.action}
Overall Confidence: ${decision.confidence}
Confidence Range: ${confidenceMetrics.minConfidence} to ${confidenceMetrics.maxConfidence}
Consensus Level: ${confidenceMetrics.consensusLevel}

Context: ${JSON.stringify(decision.context || {})}

Please generate ${Math.min(4, detailLevel * 1.5)} factors that explain why the system has this level of confidence in the decision.

Return your analysis as a JSON array of confidence factors, where each factor has:
- A factor description
- An impact value between -1 and 1 (negative means reducing confidence, positive means increasing)

Example format:
[
  {
    "factor": "Strong historical performance of selected channel",
    "impact": 0.6
  },
  {
    "factor": "Limited data for this specific industry",
    "impact": -0.3
  }
]
`;

      const response = await this.llmEngine.generateWithAgentRAG({
        prompt,
        agentType: 'explainer',
        maxTokens: 800
      });
      
      // Parse response
      const factorsMatch = response.match(/\[[\s\S]*\]/);
      if (!factorsMatch) {
        return [];
      }
      
      const factorsJson = factorsMatch[0];
      return JSON.parse(factorsJson);
    } catch (error) {
      logger.warn('Failed to generate confidence factors', {
        error: error.message,
        contextId: this.contextId
      });
      
      // Return fallback factors
      return [
        {
          factor: 'System confidence based on available information',
          impact: decision.confidence || 0.7
        }
      ];
    }
  }
  
  /**
   * Interpret confidence level
   * @param {number} confidence - Confidence value
   * @returns {string} Confidence interpretation
   * @private
   */
  interpretConfidence(confidence) {
    if (confidence >= 0.9) {
      return 'Very High Confidence';
    } else if (confidence >= 0.75) {
      return 'High Confidence';
    } else if (confidence >= 0.6) {
      return 'Moderate Confidence';
    } else if (confidence >= 0.4) {
      return 'Low Confidence';
    } else {
      return 'Very Low Confidence';
    }
  }
  
  /**
   * Generate natural language explanation
   * @param {Object} decision - Decision data
   * @param {string} audienceType - Type of audience
   * @param {number} detailLevel - Level of detail
   * @param {Object} factorAnalysis - Factor analysis
   * @param {Object} confidenceAnalysis - Confidence analysis
   * @returns {Promise<string>} Natural language explanation
   * @private
   */
  async generateNaturalLanguageExplanation(
    decision, audienceType, detailLevel, factorAnalysis, confidenceAnalysis
  ) {
    try {
      // Prepare prompt based on audience type and detail level
      const prompt = this.prepareExplanationPrompt(
        decision, audienceType, detailLevel, factorAnalysis, confidenceAnalysis
      );
      
      // Generate explanation
      const explanation = await this.llmEngine.generateWithAgentDirect({
        prompt,
        agentType: 'explainer',
        maxTokens: detailLevel * 300
      });
      
      return explanation;
    } catch (error) {
      logger.warn('Failed to generate natural language explanation, using fallback', {
        error: error.message,
        decisionId: decision.id,
        contextId: this.contextId
      });
      
      // Return fallback explanation
      return `The system selected "${decision.action}" with ${(decision.confidence * 100).toFixed(0)}% confidence based on the available information and decision criteria.`;
    }
  }
  
  /**
   * Prepare explanation prompt
   * @param {Object} decision - Decision data
   * @param {string} audienceType - Type of audience
   * @param {number} detailLevel - Level of detail
   * @param {Object} factorAnalysis - Factor analysis
   * @param {Object} confidenceAnalysis - Confidence analysis
   * @returns {string} Explanation prompt
   * @private
   */
  prepareExplanationPrompt(
    decision, audienceType, detailLevel, factorAnalysis, confidenceAnalysis
  ) {
    // Base prompt
    let prompt = `
Generate a clear explanation for why the system made the following decision:

Decision Type: ${decision.type}
Selected Action: ${decision.action}
Confidence: ${decision.confidence}
Alternative Actions: ${decision.alternativeActions?.join(', ') || 'None'}

Key factors that influenced this decision:
${factorAnalysis.factors.map(f => 
  `- ${f.description} (Importance: ${f.importance.toFixed(2)}, Direction: ${f.direction})`
).join('\n')}

Confidence analysis:
- Overall confidence: ${confidenceAnalysis.overallConfidence.toFixed(2)}
- Confidence interpretation: ${confidenceAnalysis.confidenceInterpretation}
- Uncertainty level: ${confidenceAnalysis.uncertaintyLevel.toFixed(2)}
${confidenceAnalysis.confidenceFactors.map(f => 
  `- ${f.factor} (Impact: ${f.impact.toFixed(2)})`
).join('\n')}

Context information:
${JSON.stringify(decision.context || {}, null, 2)}
`;

    // Add audience-specific instructions
    switch (audienceType) {
      case AudienceType.TECHNICAL:
        prompt += `
You are explaining this decision to a TECHNICAL audience who wants to understand the detailed mechanics of how the decision was made. Include specific details about the decision process, factors, and confidence metrics. Use precise technical language.
`;
        break;
      case AudienceType.BUSINESS:
        prompt += `
You are explaining this decision to a BUSINESS audience who wants to understand the practical implications and business value of this decision. Focus on outcomes, benefits, and business impact. Use clear business language without technical jargon.
`;
        break;
      case AudienceType.EXECUTIVE:
        prompt += `
You are explaining this decision to an EXECUTIVE audience who needs a concise, high-level understanding of why this decision was made. Focus on strategic value and key factors only. Be brief and impactful.
`;
        break;
      case AudienceType.REGULATORY:
        prompt += `
You are explaining this decision to a REGULATORY audience who needs to understand compliance aspects and ethical considerations. Focus on fairness, transparency, and adherence to policies. Use formal, precise language.
`;
        break;
      case AudienceType.CUSTOMER:
        prompt += `
You are explaining this decision to a CUSTOMER who wants to understand why this action was taken. Use simple, non-technical language. Focus on benefits and value to the customer. Be conversational and approachable.
`;
        break;
    }
    
    // Add detail level instructions
    switch (detailLevel) {
      case DetailLevel.MINIMAL:
        prompt += `
Provide a MINIMAL explanation in 1-2 sentences that covers only the most essential information.
`;
        break;
      case DetailLevel.BRIEF:
        prompt += `
Provide a BRIEF explanation in 2-3 sentences that covers the key points without going into details.
`;
        break;
      case DetailLevel.STANDARD:
        prompt += `
Provide a STANDARD explanation in 1-2 paragraphs that covers the main factors and reasoning.
`;
        break;
      case DetailLevel.DETAILED:
        prompt += `
Provide a DETAILED explanation in 2-3 paragraphs that thoroughly explains the decision process, factors, and confidence.
`;
        break;
      case DetailLevel.COMPREHENSIVE:
        prompt += `
Provide a COMPREHENSIVE explanation with multiple paragraphs that exhaustively covers all aspects of the decision, including factors, confidence, alternatives considered, and implications.
`;
        break;
    }
    
    return prompt;
  }
  
  /**
   * Generate counterfactual analysis
   * @param {Object} decision - Decision data
   * @param {number} detailLevel - Level of detail
   * @returns {Promise<string>} Counterfactual analysis
   * @private
   */
  async generateCounterfactualAnalysis(decision, detailLevel) {
    try {
      // Prepare counterfactual prompt
      const prompt = `
Generate a counterfactual analysis for the following decision:

Decision Type: ${decision.type}
Selected Action: ${decision.action}
Confidence: ${decision.confidence}
Alternative Actions: ${decision.alternativeActions?.join(', ') || 'None'}

Context information:
${JSON.stringify(decision.context || {}, null, 2)}

Please explain:
1. What changes to the input factors would have resulted in a different decision?
2. Under what circumstances would each of the alternative actions have been selected?
3. What is the minimum change required to flip this decision to the top alternative?

Provide ${detailLevel >= 4 ? 'a comprehensive' : 'a concise'} counterfactual analysis that helps understand the decision boundaries and sensitivity.
`;

      // Generate counterfactual analysis
      const counterfactualAnalysis = await this.llmEngine.generateWithAgentDirect({
        prompt,
        agentType: 'explainer',
        maxTokens: detailLevel * 250
      });
      
      return counterfactualAnalysis;
    } catch (error) {
      logger.warn('Failed to generate counterfactual analysis, using fallback', {
        error: error.message,
        decisionId: decision.id,
        contextId: this.contextId
      });
      
      // Return fallback analysis
      return `If key factors had been different, the system might have selected one of the alternative actions: ${decision.alternativeActions?.join(', ') || 'None'}.`;
    }
  }
  
  /**
   * Format explanation based on requested format
   * @param {string} explanation - Raw explanation text
   * @param {string} format - Requested format
   * @returns {string} Formatted explanation
   * @private
   */
  formatExplanation(explanation, format) {
    switch (format) {
      case ExplanationFormat.HTML:
        return this.convertToHtml(explanation);
      case ExplanationFormat.MARKDOWN:
        return this.convertToMarkdown(explanation);
      case ExplanationFormat.JSON:
        return JSON.stringify({ explanation });
      case ExplanationFormat.TEXT:
      default:
        return explanation;
    }
  }
  
  /**
   * Convert explanation to HTML format
   * @param {string} explanation - Raw explanation text
   * @returns {string} HTML formatted explanation
   * @private
   */
  convertToHtml(explanation) {
    // Simple conversion - in production would use a proper HTML converter
    const paragraphs = explanation.split('\n\n');
    return `<div class="explanation">
      ${paragraphs.map(p => `<p>${p.replace('\n', '<br>')}</p>`).join('')}
    </div>`;
  }
  
  /**
   * Convert explanation to Markdown format
   * @param {string} explanation - Raw explanation text
   * @returns {string} Markdown formatted explanation
   * @private
   */
  convertToMarkdown(explanation) {
    // Simple conversion - in production would use a proper Markdown converter
    return explanation;
  }
  
  /**
   * Generate visual elements for explanation
   * @param {Object} decision - Decision data
   * @param {Object} factorAnalysis - Factor analysis
   * @param {Object} confidenceAnalysis - Confidence analysis
   * @param {string} counterfactualAnalysis - Counterfactual analysis
   * @returns {Object} Visual elements
   * @private
   */
  generateVisualElements(decision, factorAnalysis, confidenceAnalysis, counterfactualAnalysis) {
    // In a production system, this would generate actual visualizations
    // For now, we'll return visualization descriptions
    
    return {
      factorImportanceChart: {
        type: 'bar_chart',
        title: 'Factor Importance',
        description: 'Bar chart showing the relative importance of decision factors',
        data: factorAnalysis.factors.map(f => ({
          label: f.description.substring(0, 30) + (f.description.length > 30 ? '...' : ''),
          value: f.importance,
          color: f.direction === 'positive' ? '#4CAF50' : '#F44336'
        }))
      },
      confidenceGauge: {
        type: 'gauge',
        title: 'Decision Confidence',
        description: 'Gauge showing the overall confidence level',
        data: {
          value: confidenceAnalysis.overallConfidence,
          min: 0,
          max: 1,
          thresholds: [
            { value: 0.4, color: '#F44336', label: 'Low' },
            { value: 0.6, color: '#FFC107', label: 'Medium' },
            { value: 0.75, color: '#4CAF50', label: 'High' },
            { value: 0.9, color: '#2196F3', label: 'Very High' }
          ]
        }
      },
      decisionTree: counterfactualAnalysis ? {
        type: 'decision_tree',
        title: 'Decision Paths',
        description: 'Simplified decision tree showing alternative paths',
        data: {
          nodes: [
            { id: 'root', label: 'Decision Point' },
            { id: 'selected', label: decision.action, type: 'selected' },
            ...decision.alternativeActions?.slice(0, 2).map((alt, i) => ({ 
              id: `alt${i}`, 
              label: alt, 
              type: 'alternative' 
            })) || []
          ],
          edges: [
            { from: 'root', to: 'selected', label: 'Selected Path' },
            ...decision.alternativeActions?.slice(0, 2).map((_, i) => ({ 
              from: 'root', 
              to: `alt${i}`, 
              label: 'Alternative Path' 
            })) || []
          ]
        }
      } : null
    };
  }
  
  /**
   * Store explanation in database
   * @param {Object} explanation - Generated explanation
   * @returns {Promise<void>}
   * @private
   */
  async storeExplanation(explanation) {
    try {
      // Skip in test mode
      if (this.testMode) {
        return;
      }
      
      // Generate explanation ID
      const explanationId = `exp_${uuidv4()}`;
      
      // Store in database
      await db.collection('explanations').doc(explanationId).set({
        ...explanation,
        id: explanationId,
        createdAt: new Date().toISOString()
      });
      
      // Update decision with explanation reference
      await db.collection('decision_logs').doc(explanation.decisionId).update({
        explanations: admin.firestore.FieldValue.arrayUnion(explanationId)
      });
    } catch (error) {
      logger.warn('Failed to store explanation', {
        error: error.message,
        decisionId: explanation.decisionId,
        contextId: this.contextId
      });
    }
  }
  
  /**
   * Generate trace for a decision process
   * @param {Object} params - Trace parameters
   * @param {string} params.decisionId - ID of the decision to trace
   * @param {boolean} [params.includeIntermediateSteps=false] - Whether to include intermediate steps
   * @param {number} [params.detailLevel=DetailLevel.STANDARD] - Level of detail
   * @returns {Promise<Object>} Decision trace
   */
  async generateDecisionTrace(params) {
    const { 
      decisionId, 
      includeIntermediateSteps = false, 
      detailLevel = DetailLevel.STANDARD 
    } = params;
    
    try {
      // Check test mode
      if (this.testMode) {
        return this.getMockDecisionTrace(decisionId, includeIntermediateSteps, detailLevel);
      }
      
      // Load decision data
      const decision = await this.loadDecisionData(decisionId);
      
      if (!decision) {
        throw new ReachSparkError(
          'Decision not found',
          ErrorTypes.NOT_FOUND_ERROR,
          SeverityLevels.ERROR,
          null,
          { decisionId, contextId: this.contextId }
        );
      }
      
      // Load collaboration data if available
      const collaborationData = await this.loadCollaborationData(decisionId);
      
      // Generate trace steps
      const steps = await this.generateTraceSteps(
        decision, collaborationData, includeIntermediateSteps, detailLevel
      );
      
      // Assemble trace
      const trace = {
        decisionId,
        timestamp: new Date().toISOString(),
        decisionType: decision.type,
        result: {
          action: decision.action,
          confidence: decision.confidence
        },
        steps,
        stepCount: steps.length,
        duration: collaborationData ? 
          this.calculateDuration(collaborationData.startTime, collaborationData.endTime) : null
      };
      
      return trace;
    } catch (error) {
      logger.error('Failed to generate decision trace', {
        error: error.message,
        decisionId,
        contextId: this.contextId
      });
      
      throw new ReachSparkError(
        'Failed to generate decision trace',
        ErrorTypes.PROCESSING_ERROR,
        SeverityLevels.ERROR,
        error,
        { decisionId, contextId: this.contextId }
      );
    }
  }
  
  /**
   * Load collaboration data from database
   * @param {string} collaborationId - ID of the collaboration
   * @returns {Promise<Object|null>} Collaboration data or null if not found
   * @private
   */
  async loadCollaborationData(collaborationId) {
    try {
      const collaborationDoc = await db.collection('agent_collaborations').doc(collaborationId).get();
      
      if (collaborationDoc.exists) {
        return collaborationDoc.data();
      }
      
      return null;
    } catch (error) {
      logger.warn('Failed to load collaboration data', {
        error: error.message,
        collaborationId,
        contextId: this.contextId
      });
      
      return null;
    }
  }
  
  /**
   * Generate trace steps for a decision
   * @param {Object} decision - Decision data
   * @param {Object} collaborationData - Collaboration data
   * @param {boolean} includeIntermediateSteps - Whether to include intermediate steps
   * @param {number} detailLevel - Level of detail
   * @returns {Promise<Array<Object>>} Trace steps
   * @private
   */
  async generateTraceSteps(decision, collaborationData, includeIntermediateSteps, detailLevel) {
    const steps = [];
    
    // Add initialization step
    steps.push({
      id: 'step_init',
      type: 'initialization',
      description: `Decision process initiated for ${decision.type}`,
      timestamp: collaborationData?.startTime || decision.timestamp
    });
    
    // Add context processing step
    steps.push({
      id: 'step_context',
      type: 'context_processing',
      description: 'Context information processed',
      details: detailLevel >= DetailLevel.DETAILED ? 
        `Processed context: ${JSON.stringify(decision.context || {})}` : null,
      timestamp: this.estimateTimestamp(collaborationData?.startTime, 1)
    });
    
    // Add agent contribution steps if available
    if (collaborationData?.agentContributions && includeIntermediateSteps) {
      let stepIndex = 0;
      for (const [agentType, contribution] of Object.entries(collaborationData.agentContributions)) {
        steps.push({
          id: `step_agent_${stepIndex++}`,
          type: 'agent_contribution',
          agentType,
          description: `${this.formatAgentType(agentType)} provided input`,
          action: contribution.action,
          confidence: contribution.confidence,
          details: detailLevel >= DetailLevel.STANDARD ? contribution.reasoning : null,
          timestamp: this.estimateTimestamp(collaborationData.startTime, 2 + stepIndex)
        });
      }
    }
    
    // Add conflict resolution steps if available
    if (collaborationData?.conflicts && collaborationData.conflicts.length > 0 && includeIntermediateSteps) {
      for (let i = 0; i < collaborationData.conflicts.length; i++) {
        const conflict = collaborationData.conflicts[i];
        const resolution = collaborationData.resolutions?.[i];
        
        steps.push({
          id: `step_conflict_${i}`,
          type: 'conflict_resolution',
          description: `Resolved conflict: ${conflict.description}`,
          details: resolution ? 
            (detailLevel >= DetailLevel.STANDARD ? resolution.reasoning : resolution.resolution) : 
            'Conflict identified',
          timestamp: this.estimateTimestamp(collaborationData.startTime, 5 + i)
        });
      }
    }
    
    // Add decision step
    steps.push({
      id: 'step_decision',
      type: 'final_decision',
      description: `Selected action: ${decision.action}`,
      confidence: decision.confidence,
      details: detailLevel >= DetailLevel.BRIEF ? decision.reasoning : null,
      timestamp: collaborationData?.endTime || decision.timestamp
    });
    
    return steps;
  }
  
  /**
   * Format agent type for display
   * @param {string} agentType - Agent type
   * @returns {string} Formatted agent type
   * @private
   */
  formatAgentType(agentType) {
    return agentType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Estimate timestamp for a step
   * @param {string} startTime - Start time
   * @param {number} stepOffset - Step offset in seconds
   * @returns {string} Estimated timestamp
   * @private
   */
  estimateTimestamp(startTime, stepOffset) {
    if (!startTime) {
      return new Date().toISOString();
    }
    
    const startDate = new Date(startTime);
    const estimatedDate = new Date(startDate.getTime() + stepOffset * 1000);
    return estimatedDate.toISOString();
  }
  
  /**
   * Calculate duration between two timestamps
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @returns {number} Duration in milliseconds
   * @private
   */
  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) {
      return null;
    }
    
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    return endDate.getTime() - startDate.getTime();
  }
  
  /**
   * Get mock explanation for testing
   * @param {string} decisionId - ID of the decision
   * @param {string} audienceType - Type of audience
   * @param {boolean} includeCounterfactuals - Whether to include counterfactual analysis
   * @param {number} detailLevel - Level of detail
   * @returns {Object} Mock explanation
   * @private
   */
  getMockExplanation(decisionId, audienceType, includeCounterfactuals, detailLevel) {
    const factorAnalysis = {
      factors: [
        {
          id: 'mock_factor_1',
          description: 'High engagement from the lead',
          importance: 0.8,
          direction: 'positive',
          source: 'mock'
        },
        {
          id: 'mock_factor_2',
          description: 'Previous success with similar leads',
          importance: 0.6,
          direction: 'positive',
          source: 'mock'
        }
      ],
      primaryFactor: {
        id: 'mock_factor_1',
        description: 'High engagement from the lead',
        importance: 0.8,
        direction: 'positive',
        source: 'mock'
      },
      factorCount: 2,
      includedFactorCount: 2
    };
    
    const confidenceAnalysis = {
      overallConfidence: 0.8,
      confidenceRange: {
        min: 0.7,
        max: 0.9
      },
      uncertaintyLevel: 0.2,
      agentConfidences: {
        'strategy_agent': 0.85,
        'communication_agent': 0.75
      },
      confidenceFactors: [
        {
          factor: 'Strong historical performance',
          impact: 0.6
        },
        {
          factor: 'Limited data for this specific case',
          impact: -0.2
        }
      ],
      confidenceInterpretation: 'High Confidence'
    };
    
    const explanation = "The system selected this action because the lead has shown high engagement with previous communications and similar leads have responded well to this approach in the past. The confidence level is high (80%) due to strong historical performance, although there is some uncertainty due to limited data for this specific case.";
    
    const counterfactualAnalysis = includeCounterfactuals ?
      "If the lead's engagement level had been lower, the system would likely have chosen a different approach. Additionally, if the lead was from a different industry, the confidence level would have been lower and might have resulted in a more conservative action." :
      null;
    
    return {
      decisionId,
      timestamp: new Date().toISOString(),
      audienceType,
      detailLevel,
      format: ExplanationFormat.TEXT,
      decision: {
        type: 'mock_decision',
        action: 'mock_action',
        confidence: 0.8,
        timestamp: new Date().toISOString()
      },
      factorAnalysis,
      confidenceAnalysis,
      explanation,
      counterfactualAnalysis,
      visualElements: this.generateVisualElements(
        { action: 'mock_action', alternativeActions: ['alt1', 'alt2'] },
        factorAnalysis,
        confidenceAnalysis,
        counterfactualAnalysis
      )
    };
  }
  
  /**
   * Get mock decision trace for testing
   * @param {string} decisionId - ID of the decision
   * @param {boolean} includeIntermediateSteps - Whether to include intermediate steps
   * @param {number} detailLevel - Level of detail
   * @returns {Object} Mock decision trace
   * @private
   */
  getMockDecisionTrace(decisionId, includeIntermediateSteps, detailLevel) {
    const now = new Date();
    const startTime = new Date(now.getTime() - 5000).toISOString();
    const endTime = now.toISOString();
    
    const steps = [
      {
        id: 'step_init',
        type: 'initialization',
        description: 'Decision process initiated for mock_decision',
        timestamp: startTime
      },
      {
        id: 'step_context',
        type: 'context_processing',
        description: 'Context information processed',
        details: detailLevel >= DetailLevel.DETAILED ? 'Processed context: {"leadId":"mock-123"}' : null,
        timestamp: this.estimateTimestamp(startTime, 1)
      }
    ];
    
    if (includeIntermediateSteps) {
      steps.push(
        {
          id: 'step_agent_0',
          type: 'agent_contribution',
          agentType: 'strategy_agent',
          description: 'Strategy Agent provided input',
          action: 'mock_action',
          confidence: 0.85,
          details: detailLevel >= DetailLevel.STANDARD ? 'Mock reasoning from strategy agent' : null,
          timestamp: this.estimateTimestamp(startTime, 2)
        },
        {
          id: 'step_agent_1',
          type: 'agent_contribution',
          agentType: 'communication_agent',
          description: 'Communication Agent provided input',
          action: 'mock_action',
          confidence: 0.75,
          details: detailLevel >= DetailLevel.STANDARD ? 'Mock reasoning from communication agent' : null,
          timestamp: this.estimateTimestamp(startTime, 3)
        }
      );
    }
    
    steps.push({
      id: 'step_decision',
      type: 'final_decision',
      description: 'Selected action: mock_action',
      confidence: 0.8,
      details: detailLevel >= DetailLevel.BRIEF ? 'Mock decision reasoning' : null,
      timestamp: endTime
    });
    
    return {
      decisionId,
      timestamp: new Date().toISOString(),
      decisionType: 'mock_decision',
      result: {
        action: 'mock_action',
        confidence: 0.8
      },
      steps,
      stepCount: steps.length,
      duration: 5000
    };
  }
}

module.exports = {
  ExplainabilityEngine,
  AudienceType,
  ExplanationFormat,
  DetailLevel
};
