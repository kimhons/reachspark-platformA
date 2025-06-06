/**
 * Tests for Enhanced Explainability Engine
 * 
 * This file contains comprehensive tests for the Explainability Engine module,
 * including tests for explanation generation, decision tracing, and integration
 * with other components.
 */

const { ExplainabilityEngine, AudienceType, ExplanationFormat, DetailLevel } = require('../explainability-engine');
const { logger } = require('../../reachspark-firebase/packages/functions/src/utils/errorLogging');

// Mock dependencies
jest.mock('../../reachspark-firebase/packages/functions/src/utils/errorLogging', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  ReachSparkError: class MockReachSparkError extends Error {
    constructor(message, type, severity, originalError, context) {
      super(message);
      this.type = type;
      this.severity = severity;
      this.originalError = originalError;
      this.context = context;
    }
  },
  ErrorTypes: {
    VALIDATION_ERROR: 'validation_error',
    PROCESSING_ERROR: 'processing_error',
    NOT_FOUND_ERROR: 'not_found_error'
  },
  SeverityLevels: {
    ERROR: 'error',
    WARNING: 'warning'
  }
}));

jest.mock('../../reachspark-firebase/packages/functions/src/utils/llm', () => ({
  LLMEngine: jest.fn().mockImplementation(() => ({
    generateWithAgentRAG: jest.fn().mockResolvedValue(JSON.stringify([
      {
        "description": "The lead has shown high engagement with previous content",
        "importance": 0.8,
        "direction": "positive"
      },
      {
        "description": "The lead's company is in an industry with high conversion rates",
        "importance": 0.6,
        "direction": "positive"
      }
    ])),
    generateWithAgentDirect: jest.fn().mockResolvedValue("This is a test explanation for the decision. The system selected this action because the lead has shown high engagement with previous content and the lead's company is in an industry with high conversion rates.")
  }))
}));

jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          add: jest.fn().mockResolvedValue({}),
          get: jest.fn().mockResolvedValue({ docs: [], forEach: jest.fn() })
        }),
        get: jest.fn().mockResolvedValue({ exists: false, data: jest.fn().mockReturnValue({}) }),
        set: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({})
      }),
      add: jest.fn().mockResolvedValue({}),
      where: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: [], forEach: jest.fn() })
        })
      }),
      orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: [], forEach: jest.fn() })
        })
      })
    }),
    runTransaction: jest.fn().mockImplementation(fn => 
      fn({
        get: jest.fn().mockResolvedValue({ exists: false, data: jest.fn().mockReturnValue({}) }),
        set: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({})
      })
    ),
    FieldValue: {
      arrayUnion: jest.fn().mockReturnValue({})
    }
  };
  
  return {
    apps: [],
    initializeApp: jest.fn(),
    firestore: jest.fn().mockReturnValue(mockFirestore)
  };
});

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

describe('Enhanced ExplainabilityEngine', () => {
  let explainEngine;
  
  beforeEach(() => {
    // Create a new instance for each test
    explainEngine = new ExplainabilityEngine('test-context', true);
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Constructor', () => {
    it('should initialize with default parameters', () => {
      expect(explainEngine.contextId).toBe('test-context');
      expect(explainEngine.testMode).toBe(true);
      expect(explainEngine.explanationCache).toBeDefined();
      expect(explainEngine.explanationCache instanceof Map).toBe(true);
    });
    
    it('should initialize LLM engine', () => {
      expect(explainEngine.llmEngine).toBeDefined();
    });
  });
  
  describe('generateDecisionExplanation', () => {
    it('should return mock explanation in test mode', async () => {
      const result = await explainEngine.generateDecisionExplanation({
        decisionId: 'test-decision',
        audienceType: AudienceType.BUSINESS,
        includeCounterfactuals: true,
        detailLevel: DetailLevel.STANDARD
      });
      
      expect(result).toBeDefined();
      expect(result.decisionId).toBe('test-decision');
      expect(result.audienceType).toBe(AudienceType.BUSINESS);
      expect(result.factorAnalysis).toBeDefined();
      expect(result.confidenceAnalysis).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.counterfactualAnalysis).toBeDefined();
      expect(result.visualElements).toBeDefined();
    });
    
    it('should validate required parameters', async () => {
      await expect(explainEngine.generateDecisionExplanation({
        audienceType: AudienceType.BUSINESS
      })).rejects.toThrow('Decision not found');
    });
    
    it('should use cache when available', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      // Mock loadDecisionData
      const mockLoadDecision = jest.spyOn(explainEngine, 'loadDecisionData');
      mockLoadDecision.mockResolvedValue({
        id: 'cached-decision',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        reasoning: 'Test reasoning',
        alternativeActions: ['disqualify_lead'],
        timestamp: new Date().toISOString()
      });
      
      // Add to cache
      const cacheKey = 'cached-decision:business:false:3:text';
      explainEngine.explanationCache.set(cacheKey, {
        decisionId: 'cached-decision',
        explanation: 'Cached explanation'
      });
      
      const result = await explainEngine.generateDecisionExplanation({
        decisionId: 'cached-decision',
        audienceType: AudienceType.BUSINESS,
        includeCounterfactuals: false,
        detailLevel: DetailLevel.STANDARD,
        format: ExplanationFormat.TEXT
      });
      
      expect(result.explanation).toBe('Cached explanation');
      expect(mockLoadDecision).not.toHaveBeenCalled();
      
      // Restore test mode
      explainEngine.testMode = true;
    });
    
    it('should generate explanation components when not in cache', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      // Mock loadDecisionData
      const mockLoadDecision = jest.spyOn(explainEngine, 'loadDecisionData');
      mockLoadDecision.mockResolvedValue({
        id: 'new-decision',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        reasoning: 'Test reasoning',
        alternativeActions: ['disqualify_lead'],
        timestamp: new Date().toISOString(),
        context: { leadId: 'test-lead' }
      });
      
      // Mock component generation methods
      const mockFactorAnalysis = jest.spyOn(explainEngine, 'generateFactorAnalysis');
      mockFactorAnalysis.mockResolvedValue({
        factors: [
          {
            id: 'factor-1',
            description: 'High engagement',
            importance: 0.8,
            direction: 'positive',
            source: 'main'
          }
        ],
        primaryFactor: {
          id: 'factor-1',
          description: 'High engagement',
          importance: 0.8,
          direction: 'positive',
          source: 'main'
        },
        factorCount: 1,
        includedFactorCount: 1
      });
      
      const mockConfidenceAnalysis = jest.spyOn(explainEngine, 'generateConfidenceAnalysis');
      mockConfidenceAnalysis.mockResolvedValue({
        overallConfidence: 0.8,
        confidenceRange: { min: 0.7, max: 0.9 },
        uncertaintyLevel: 0.2,
        agentConfidences: {},
        confidenceFactors: [
          { factor: 'Strong historical performance', impact: 0.6 }
        ],
        confidenceInterpretation: 'High Confidence'
      });
      
      const mockNaturalLanguage = jest.spyOn(explainEngine, 'generateNaturalLanguageExplanation');
      mockNaturalLanguage.mockResolvedValue('Test natural language explanation');
      
      const mockCounterfactual = jest.spyOn(explainEngine, 'generateCounterfactualAnalysis');
      mockCounterfactual.mockResolvedValue('Test counterfactual analysis');
      
      const mockStoreExplanation = jest.spyOn(explainEngine, 'storeExplanation');
      mockStoreExplanation.mockResolvedValue({});
      
      const result = await explainEngine.generateDecisionExplanation({
        decisionId: 'new-decision',
        audienceType: AudienceType.BUSINESS,
        includeCounterfactuals: true,
        detailLevel: DetailLevel.STANDARD,
        format: ExplanationFormat.TEXT
      });
      
      expect(mockLoadDecision).toHaveBeenCalledWith('new-decision');
      expect(mockFactorAnalysis).toHaveBeenCalled();
      expect(mockConfidenceAnalysis).toHaveBeenCalled();
      expect(mockNaturalLanguage).toHaveBeenCalled();
      expect(mockCounterfactual).toHaveBeenCalled();
      expect(mockStoreExplanation).toHaveBeenCalled();
      
      expect(result.explanation).toBe('Test natural language explanation');
      expect(result.counterfactualAnalysis).toBe('Test counterfactual analysis');
      
      // Check cache was updated
      const cacheKey = 'new-decision:business:true:3:text';
      expect(explainEngine.explanationCache.has(cacheKey)).toBe(true);
      
      // Restore test mode
      explainEngine.testMode = true;
    });
    
    it('should skip counterfactual analysis when not requested', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      // Mock loadDecisionData
      jest.spyOn(explainEngine, 'loadDecisionData').mockResolvedValue({
        id: 'no-counterfactual',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        reasoning: 'Test reasoning',
        timestamp: new Date().toISOString()
      });
      
      // Mock component generation methods
      jest.spyOn(explainEngine, 'generateFactorAnalysis').mockResolvedValue({
        factors: [],
        primaryFactor: null,
        factorCount: 0,
        includedFactorCount: 0
      });
      
      jest.spyOn(explainEngine, 'generateConfidenceAnalysis').mockResolvedValue({
        overallConfidence: 0.8,
        confidenceRange: { min: 0.7, max: 0.9 },
        uncertaintyLevel: 0.2,
        confidenceFactors: []
      });
      
      jest.spyOn(explainEngine, 'generateNaturalLanguageExplanation').mockResolvedValue('Test explanation');
      
      const mockCounterfactual = jest.spyOn(explainEngine, 'generateCounterfactualAnalysis');
      
      const result = await explainEngine.generateDecisionExplanation({
        decisionId: 'no-counterfactual',
        includeCounterfactuals: false
      });
      
      expect(mockCounterfactual).not.toHaveBeenCalled();
      expect(result.counterfactualAnalysis).toBeNull();
      
      // Restore test mode
      explainEngine.testMode = true;
    });
    
    it('should format explanation based on requested format', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      // Mock loadDecisionData
      jest.spyOn(explainEngine, 'loadDecisionData').mockResolvedValue({
        id: 'format-test',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        reasoning: 'Test reasoning',
        timestamp: new Date().toISOString()
      });
      
      // Mock component generation methods
      jest.spyOn(explainEngine, 'generateFactorAnalysis').mockResolvedValue({
        factors: [],
        primaryFactor: null,
        factorCount: 0,
        includedFactorCount: 0
      });
      
      jest.spyOn(explainEngine, 'generateConfidenceAnalysis').mockResolvedValue({
        overallConfidence: 0.8,
        confidenceRange: { min: 0.7, max: 0.9 },
        uncertaintyLevel: 0.2,
        confidenceFactors: []
      });
      
      jest.spyOn(explainEngine, 'generateNaturalLanguageExplanation').mockResolvedValue('Test explanation');
      
      // Mock format methods
      const mockConvertToHtml = jest.spyOn(explainEngine, 'convertToHtml');
      mockConvertToHtml.mockReturnValue('<p>Test explanation</p>');
      
      const mockConvertToMarkdown = jest.spyOn(explainEngine, 'convertToMarkdown');
      mockConvertToMarkdown.mockReturnValue('# Test explanation');
      
      // Test HTML format
      const htmlResult = await explainEngine.generateDecisionExplanation({
        decisionId: 'format-test',
        format: ExplanationFormat.HTML
      });
      
      expect(mockConvertToHtml).toHaveBeenCalled();
      expect(htmlResult.explanation).toBe('<p>Test explanation</p>');
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test Markdown format
      const markdownResult = await explainEngine.generateDecisionExplanation({
        decisionId: 'format-test',
        format: ExplanationFormat.MARKDOWN
      });
      
      expect(mockConvertToMarkdown).toHaveBeenCalled();
      expect(markdownResult.explanation).toBe('# Test explanation');
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test JSON format
      const jsonResult = await explainEngine.generateDecisionExplanation({
        decisionId: 'format-test',
        format: ExplanationFormat.JSON
      });
      
      expect(jsonResult.explanation).toContain('{"explanation":');
      
      // Restore test mode
      explainEngine.testMode = true;
    });
  });
  
  describe('generateFactorAnalysis', () => {
    it('should extract factors from reasoning', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      const decision = {
        id: 'factor-test',
        reasoning: 'The lead has shown high engagement and is from a high-value industry.',
        agentContributions: {
          'agent1': {
            reasoning: 'Agent 1 reasoning'
          },
          'agent2': {
            reasoning: 'Agent 2 reasoning'
          }
        }
      };
      
      // Mock extractFactorsFromReasoning
      const mockExtractFactors = jest.spyOn(explainEngine, 'extractFactorsFromReasoning');
      mockExtractFactors
        .mockResolvedValueOnce([
          {
            id: 'factor-1',
            description: 'Agent 1 factor',
            importance: 0.7,
            direction: 'positive',
            source: 'agent1'
          }
        ])
        .mockResolvedValueOnce([
          {
            id: 'factor-2',
            description: 'Agent 2 factor',
            importance: 0.6,
            direction: 'positive',
            source: 'agent2'
          }
        ])
        .mockResolvedValueOnce([
          {
            id: 'factor-3',
            description: 'Main factor',
            importance: 0.8,
            direction: 'positive',
            source: 'main'
          }
        ]);
      
      const result = await explainEngine.generateFactorAnalysis(decision, DetailLevel.STANDARD);
      
      expect(mockExtractFactors).toHaveBeenCalledTimes(3);
      expect(result.factors.length).toBe(3);
      expect(result.primaryFactor.id).toBe('factor-3'); // Highest importance
      expect(result.factorCount).toBe(3);
      expect(result.includedFactorCount).toBe(3);
      
      // Restore test mode
      explainEngine.testMode = true;
    });
    
    it('should generate synthetic factors when extraction fails', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      const decision = {
        id: 'synthetic-test',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        alternativeActions: ['disqualify_lead'],
        context: { leadId: 'test-lead' }
      };
      
      // Mock extractFactorsFromReasoning to return empty array
      const mockExtractFactors = jest.spyOn(explainEngine, 'extractFactorsFromReasoning');
      mockExtractFactors.mockResolvedValue([]);
      
      // Mock generateSyntheticFactors
      const mockGenerateSynthetic = jest.spyOn(explainEngine, 'generateSyntheticFactors');
      mockGenerateSynthetic.mockResolvedValue([
        {
          id: 'synthetic-1',
          description: 'Synthetic factor 1',
          importance: 0.8,
          direction: 'positive',
          source: 'synthetic'
        },
        {
          id: 'synthetic-2',
          description: 'Synthetic factor 2',
          importance: 0.6,
          direction: 'positive',
          source: 'synthetic'
        }
      ]);
      
      const result = await explainEngine.generateFactorAnalysis(decision, DetailLevel.STANDARD);
      
      expect(mockExtractFactors).toHaveBeenCalled();
      expect(mockGenerateSynthetic).toHaveBeenCalled();
      expect(result.factors.length).toBe(2);
      expect(result.factors[0].source).toBe('synthetic');
      
      // Restore test mode
      explainEngine.testMode = true;
    });
    
    it('should limit factors based on detail level', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      const decision = {
        id: 'detail-test',
        reasoning: 'Test reasoning'
      };
      
      // Mock extractFactorsFromReasoning to return many factors
      const mockExtractFactors = jest.spyOn(explainEngine, 'extractFactorsFromReasoning');
      mockExtractFactors.mockResolvedValue([
        { id: 'f1', description: 'Factor 1', importance: 0.9, direction: 'positive', source: 'main' },
        { id: 'f2', description: 'Factor 2', importance: 0.8, direction: 'positive', source: 'main' },
        { id: 'f3', description: 'Factor 3', importance: 0.7, direction: 'positive', source: 'main' },
        { id: 'f4', description: 'Factor 4', importance: 0.6, direction: 'positive', source: 'main' },
        { id: 'f5', description: 'Factor 5', importance: 0.5, direction: 'positive', source: 'main' },
        { id: 'f6', description: 'Factor 6', importance: 0.4, direction: 'positive', source: 'main' },
        { id: 'f7', description: 'Factor 7', importance: 0.3, direction: 'positive', source: 'main' },
        { id: 'f8', description: 'Factor 8', importance: 0.2, direction: 'positive', source: 'main' }
      ]);
      
      // Test with minimal detail level
      const minimalResult = await explainEngine.generateFactorAnalysis(decision, DetailLevel.MINIMAL);
      expect(minimalResult.factors.length).toBe(3); // DetailLevel.MINIMAL * 3 = 3
      
      // Test with detailed level
      const detailedResult = await explainEngine.generateFactorAnalysis(decision, DetailLevel.DETAILED);
      expect(detailedResult.factors.length).toBe(8); // All factors (less than DetailLevel.DETAILED * 3)
      
      // Restore test mode
      explainEngine.testMode = true;
    });
    
    it('should return fallback analysis on error', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      // Force an error
      jest.spyOn(explainEngine, 'extractFactorsFromReasoning').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      jest.spyOn(explainEngine, 'generateSyntheticFactors').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = await explainEngine.generateFactorAnalysis({}, DetailLevel.STANDARD);
      
      expect(result.factors.length).toBe(1);
      expect(result.factors[0].description).toContain('fallback');
      expect(logger.warn).toHaveBeenCalled();
      
      // Restore test mode
      explainEngine.testMode = true;
    });
  });
  
  describe('generateConfidenceAnalysis', () => {
    it('should calculate confidence metrics', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      const decision = {
        id: 'confidence-test',
        confidence: 0.8,
        agentContributions: {
          'agent1': { confidence: 0.7 },
          'agent2': { confidence: 0.9 }
        }
      };
      
      // Mock calculateConfidenceMetrics
      const mockCalculateMetrics = jest.spyOn(explainEngine, 'calculateConfidenceMetrics');
      mockCalculateMetrics.mockReturnValue({
        minConfidence: 0.7,
        maxConfidence: 0.9,
        avgConfidence: 0.8,
        stdDeviation: 0.1,
        consensusLevel: 0.9
      });
      
      // Mock generateConfidenceFactors
      const mockGenerateFactors = jest.spyOn(explainEngine, 'generateConfidenceFactors');
      mockGenerateFactors.mockResolvedValue([
        { factor: 'Strong historical performance', impact: 0.6 },
        { factor: 'Limited data', impact: -0.2 }
      ]);
      
      // Mock interpretConfidence
      const mockInterpret = jest.spyOn(explainEngine, 'interpretConfidence');
      mockInterpret.mockReturnValue('High Confidence');
      
      const result = await explainEngine.generateConfidenceAnalysis(decision, DetailLevel.STANDARD);
      
      expect(mockCalculateMetrics).toHaveBeenCalled();
      expect(mockGenerateFactors).toHaveBeenCalled();
      expect(mockInterpret).toHaveBeenCalled();
      
      expect(result.overallConfidence).toBe(0.8);
      expect(result.confidenceRange.min).toBe(0.7);
      expect(result.confidenceRange.max).toBe(0.9);
      expect(result.uncertaintyLevel).toBe(0.2); // 1 - confidence
      expect(result.agentConfidences).toEqual({
        'agent1': 0.7,
        'agent2': 0.9
      });
      expect(result.confidenceFactors.length).toBe(2);
      expect(result.confidenceInterpretation).toBe('High Confidence');
      
      // Restore test mode
      explainEngine.testMode = true;
    });
    
    it('should return fallback analysis on error', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      // Force an error
      jest.spyOn(explainEngine, 'calculateConfidenceMetrics').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = await explainEngine.generateConfidenceAnalysis({ confidence: 0.7 }, DetailLevel.STANDARD);
      
      expect(result.overallConfidence).toBe(0.7);
      expect(result.confidenceFactors.length).toBe(1);
      expect(result.confidenceFactors[0].factor).toContain('System confidence');
      expect(logger.warn).toHaveBeenCalled();
      
      // Restore test mode
      explainEngine.testMode = true;
    });
  });
  
  describe('interpretConfidence', () => {
    it('should return appropriate interpretation for different confidence levels', () => {
      expect(explainEngine.interpretConfidence(0.95)).toBe('Very High Confidence');
      expect(explainEngine.interpretConfidence(0.85)).toBe('High Confidence');
      expect(explainEngine.interpretConfidence(0.65)).toBe('Moderate Confidence');
      expect(explainEngine.interpretConfidence(0.45)).toBe('Low Confidence');
      expect(explainEngine.interpretConfidence(0.25)).toBe('Very Low Confidence');
    });
  });
  
  describe('generateNaturalLanguageExplanation', () => {
    it('should prepare prompt and get response from LLM', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      const decision = {
        id: 'explanation-test',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        alternativeActions: ['disqualify_lead'],
        context: { leadId: 'test-lead' }
      };
      
      const factorAnalysis = {
        factors: [
          {
            id: 'factor-1',
            description: 'High engagement',
            importance: 0.8,
            direction: 'positive',
            source: 'main'
          }
        ],
        primaryFactor: {
          id: 'factor-1',
          description: 'High engagement',
          importance: 0.8,
          direction: 'positive',
          source: 'main'
        },
        factorCount: 1,
        includedFactorCount: 1
      };
      
      const confidenceAnalysis = {
        overallConfidence: 0.8,
        confidenceRange: { min: 0.7, max: 0.9 },
        uncertaintyLevel: 0.2,
        confidenceFactors: [
          { factor: 'Strong historical performance', impact: 0.6 }
        ],
        confidenceInterpretation: 'High Confidence'
      };
      
      // Mock prepareExplanationPrompt
      const mockPreparePrompt = jest.spyOn(explainEngine, 'prepareExplanationPrompt');
      mockPreparePrompt.mockReturnValue('Test prompt');
      
      const result = await explainEngine.generateNaturalLanguageExplanation(
        decision,
        AudienceType.BUSINESS,
        DetailLevel.STANDARD,
        factorAnalysis,
        confidenceAnalysis
      );
      
      expect(mockPreparePrompt).toHaveBeenCalledWith(
        decision,
        AudienceType.BUSINESS,
        DetailLevel.STANDARD,
        factorAnalysis,
        confidenceAnalysis
      );
      
      expect(explainEngine.llmEngine.generateWithAgentDirect).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        agentType: 'explainer',
        maxTokens: DetailLevel.STANDARD * 300
      });
      
      expect(result).toBeDefined();
      
      // Restore test mode
      explainEngine.testMode = true;
    });
    
    it('should return fallback explanation on error', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      // Force an error
      jest.spyOn(explainEngine, 'prepareExplanationPrompt').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const decision = {
        id: 'error-test',
        action: 'test_action',
        confidence: 0.7
      };
      
      const result = await explainEngine.generateNaturalLanguageExplanation(
        decision,
        AudienceType.BUSINESS,
        DetailLevel.STANDARD,
        { factors: [] },
        { confidenceFactors: [] }
      );
      
      expect(result).toContain('selected');
      expect(result).toContain('test_action');
      expect(logger.warn).toHaveBeenCalled();
      
      // Restore test mode
      explainEngine.testMode = true;
    });
  });
  
  describe('prepareExplanationPrompt', () => {
    it('should include audience-specific instructions', () => {
      const decision = {
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        alternativeActions: ['disqualify_lead'],
        context: { leadId: 'test-lead' }
      };
      
      const factorAnalysis = {
        factors: [
          {
            description: 'High engagement',
            importance: 0.8,
            direction: 'positive'
          }
        ]
      };
      
      const confidenceAnalysis = {
        overallConfidence: 0.8,
        confidenceInterpretation: 'High Confidence',
        uncertaintyLevel: 0.2,
        confidenceFactors: [
          { factor: 'Strong historical performance', impact: 0.6 }
        ]
      };
      
      // Test different audience types
      const technicalPrompt = explainEngine.prepareExplanationPrompt(
        decision,
        AudienceType.TECHNICAL,
        DetailLevel.STANDARD,
        factorAnalysis,
        confidenceAnalysis
      );
      
      expect(technicalPrompt).toContain('TECHNICAL audience');
      
      const businessPrompt = explainEngine.prepareExplanationPrompt(
        decision,
        AudienceType.BUSINESS,
        DetailLevel.STANDARD,
        factorAnalysis,
        confidenceAnalysis
      );
      
      expect(businessPrompt).toContain('BUSINESS audience');
      
      const executivePrompt = explainEngine.prepareExplanationPrompt(
        decision,
        AudienceType.EXECUTIVE,
        DetailLevel.STANDARD,
        factorAnalysis,
        confidenceAnalysis
      );
      
      expect(executivePrompt).toContain('EXECUTIVE audience');
    });
    
    it('should include detail level instructions', () => {
      const decision = {
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        alternativeActions: ['disqualify_lead'],
        context: { leadId: 'test-lead' }
      };
      
      const factorAnalysis = {
        factors: [
          {
            description: 'High engagement',
            importance: 0.8,
            direction: 'positive'
          }
        ]
      };
      
      const confidenceAnalysis = {
        overallConfidence: 0.8,
        confidenceInterpretation: 'High Confidence',
        uncertaintyLevel: 0.2,
        confidenceFactors: [
          { factor: 'Strong historical performance', impact: 0.6 }
        ]
      };
      
      // Test different detail levels
      const minimalPrompt = explainEngine.prepareExplanationPrompt(
        decision,
        AudienceType.BUSINESS,
        DetailLevel.MINIMAL,
        factorAnalysis,
        confidenceAnalysis
      );
      
      expect(minimalPrompt).toContain('MINIMAL explanation');
      
      const detailedPrompt = explainEngine.prepareExplanationPrompt(
        decision,
        AudienceType.BUSINESS,
        DetailLevel.DETAILED,
        factorAnalysis,
        confidenceAnalysis
      );
      
      expect(detailedPrompt).toContain('DETAILED explanation');
      
      const comprehensivePrompt = explainEngine.prepareExplanationPrompt(
        decision,
        AudienceType.BUSINESS,
        DetailLevel.COMPREHENSIVE,
        factorAnalysis,
        confidenceAnalysis
      );
      
      expect(comprehensivePrompt).toContain('COMPREHENSIVE explanation');
    });
  });
  
  describe('generateDecisionTrace', () => {
    it('should return mock trace in test mode', async () => {
      const result = await explainEngine.generateDecisionTrace({
        decisionId: 'test-decision',
        includeIntermediateSteps: true,
        detailLevel: DetailLevel.STANDARD
      });
      
      expect(result).toBeDefined();
      expect(result.decisionId).toBe('test-decision');
      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.stepCount).toBe(result.steps.length);
    });
    
    it('should validate required parameters', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      // Mock loadDecisionData to return null
      jest.spyOn(explainEngine, 'loadDecisionData').mockResolvedValue(null);
      
      await expect(explainEngine.generateDecisionTrace({
        decisionId: 'non-existent'
      })).rejects.toThrow('Decision not found');
      
      // Restore test mode
      explainEngine.testMode = true;
    });
    
    it('should generate trace steps based on decision and collaboration data', async () => {
      // Override test mode for this test
      explainEngine.testMode = false;
      
      // Mock loadDecisionData
      const mockLoadDecision = jest.spyOn(explainEngine, 'loadDecisionData');
      mockLoadDecision.mockResolvedValue({
        id: 'trace-test',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        reasoning: 'Test reasoning',
        timestamp: new Date().toISOString()
      });
      
      // Mock loadCollaborationData
      const mockLoadCollaboration = jest.spyOn(explainEngine, 'loadCollaborationData');
      mockLoadCollaboration.mockResolvedValue({
        id: 'trace-test',
        startTime: new Date(Date.now() - 5000).toISOString(),
        endTime: new Date().toISOString(),
        agentContributions: {
          'agent1': {
            action: 'qualify_lead',
            confidence: 0.7,
            reasoning: 'Agent 1 reasoning'
          },
          'agent2': {
            action: 'qualify_lead',
            confidence: 0.9,
            reasoning: 'Agent 2 reasoning'
          }
        },
        conflicts: [
          {
            description: 'Confidence disagreement'
          }
        ],
        resolutions: [
          {
            resolution: 'Resolved by consensus',
            reasoning: 'Resolution reasoning'
          }
        ]
      });
      
      // Mock generateTraceSteps
      const mockGenerateSteps = jest.spyOn(explainEngine, 'generateTraceSteps');
      mockGenerateSteps.mockResolvedValue([
        {
          id: 'step_init',
          type: 'initialization',
          description: 'Decision process initiated',
          timestamp: new Date(Date.now() - 5000).toISOString()
        },
        {
          id: 'step_decision',
          type: 'final_decision',
          description: 'Selected action: qualify_lead',
          confidence: 0.8,
          timestamp: new Date().toISOString()
        }
      ]);
      
      const result = await explainEngine.generateDecisionTrace({
        decisionId: 'trace-test',
        includeIntermediateSteps: true,
        detailLevel: DetailLevel.STANDARD
      });
      
      expect(mockLoadDecision).toHaveBeenCalledWith('trace-test');
      expect(mockLoadCollaboration).toHaveBeenCalledWith('trace-test');
      expect(mockGenerateSteps).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        true,
        DetailLevel.STANDARD
      );
      
      expect(result.decisionId).toBe('trace-test');
      expect(result.decisionType).toBe('LEAD_QUALIFICATION');
      expect(result.steps.length).toBe(2);
      expect(result.duration).toBeDefined();
      
      // Restore test mode
      explainEngine.testMode = true;
    });
  });
  
  describe('generateTraceSteps', () => {
    it('should include initialization and context steps', async () => {
      const decision = {
        id: 'steps-test',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        timestamp: new Date().toISOString(),
        context: { leadId: 'test-lead' }
      };
      
      const collaborationData = {
        startTime: new Date(Date.now() - 5000).toISOString(),
        endTime: new Date().toISOString()
      };
      
      const steps = await explainEngine.generateTraceSteps(
        decision,
        collaborationData,
        false,
        DetailLevel.STANDARD
      );
      
      expect(steps.length).toBe(3); // init, context, decision
      expect(steps[0].type).toBe('initialization');
      expect(steps[1].type).toBe('context_processing');
      expect(steps[2].type).toBe('final_decision');
    });
    
    it('should include agent contributions when intermediate steps requested', async () => {
      const decision = {
        id: 'agent-steps-test',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        timestamp: new Date().toISOString()
      };
      
      const collaborationData = {
        startTime: new Date(Date.now() - 5000).toISOString(),
        endTime: new Date().toISOString(),
        agentContributions: {
          'agent1': {
            action: 'qualify_lead',
            confidence: 0.7,
            reasoning: 'Agent 1 reasoning'
          },
          'agent2': {
            action: 'qualify_lead',
            confidence: 0.9,
            reasoning: 'Agent 2 reasoning'
          }
        }
      };
      
      const steps = await explainEngine.generateTraceSteps(
        decision,
        collaborationData,
        true, // Include intermediate steps
        DetailLevel.STANDARD
      );
      
      expect(steps.length).toBe(5); // init, context, agent1, agent2, decision
      
      // Find agent contribution steps
      const agentSteps = steps.filter(step => step.type === 'agent_contribution');
      expect(agentSteps.length).toBe(2);
      expect(agentSteps[0].agentType).toBeDefined();
      expect(agentSteps[1].agentType).toBeDefined();
    });
    
    it('should include conflict resolution steps when available', async () => {
      const decision = {
        id: 'conflict-steps-test',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        timestamp: new Date().toISOString()
      };
      
      const collaborationData = {
        startTime: new Date(Date.now() - 5000).toISOString(),
        endTime: new Date().toISOString(),
        conflicts: [
          {
            description: 'Action disagreement'
          },
          {
            description: 'Confidence disagreement'
          }
        ],
        resolutions: [
          {
            resolution: 'Resolved by consensus',
            reasoning: 'Resolution reasoning 1'
          },
          {
            resolution: 'Resolved by lead agent',
            reasoning: 'Resolution reasoning 2'
          }
        ]
      };
      
      const steps = await explainEngine.generateTraceSteps(
        decision,
        collaborationData,
        true, // Include intermediate steps
        DetailLevel.STANDARD
      );
      
      // Find conflict resolution steps
      const conflictSteps = steps.filter(step => step.type === 'conflict_resolution');
      expect(conflictSteps.length).toBe(2);
      expect(conflictSteps[0].description).toContain('Action disagreement');
      expect(conflictSteps[1].description).toContain('Confidence disagreement');
    });
    
    it('should adjust detail level of step details', async () => {
      const decision = {
        id: 'detail-steps-test',
        type: 'LEAD_QUALIFICATION',
        action: 'qualify_lead',
        confidence: 0.8,
        reasoning: 'Detailed reasoning',
        timestamp: new Date().toISOString(),
        context: { leadId: 'test-lead' }
      };
      
      const collaborationData = {
        startTime: new Date(Date.now() - 5000).toISOString(),
        endTime: new Date().toISOString()
      };
      
      // Test minimal detail level
      const minimalSteps = await explainEngine.generateTraceSteps(
        decision,
        collaborationData,
        false,
        DetailLevel.MINIMAL
      );
      
      expect(minimalSteps[1].details).toBeNull(); // Context step should have no details
      expect(minimalSteps[2].details).toBeNull(); // Decision step should have no details
      
      // Test detailed detail level
      const detailedSteps = await explainEngine.generateTraceSteps(
        decision,
        collaborationData,
        false,
        DetailLevel.DETAILED
      );
      
      expect(detailedSteps[1].details).toContain('leadId'); // Context step should have details
      expect(detailedSteps[2].details).toBe('Detailed reasoning'); // Decision step should have details
    });
  });
  
  describe('formatAgentType', () => {
    it('should format agent type for display', () => {
      expect(explainEngine.formatAgentType('strategy_agent')).toBe('Strategy Agent');
      expect(explainEngine.formatAgentType('qualification_agent')).toBe('Qualification Agent');
      expect(explainEngine.formatAgentType('research')).toBe('Research');
    });
  });
  
  describe('estimateTimestamp', () => {
    it('should calculate timestamp based on start time and offset', () => {
      const startTime = new Date(2025, 0, 1, 12, 0, 0).toISOString();
      const timestamp = explainEngine.estimateTimestamp(startTime, 5);
      
      const expectedDate = new Date(2025, 0, 1, 12, 0, 5);
      expect(new Date(timestamp).getTime()).toBe(expectedDate.getTime());
    });
    
    it('should return current time when start time is not provided', () => {
      const before = new Date();
      const timestamp = explainEngine.estimateTimestamp(null, 5);
      const after = new Date();
      
      const timestampDate = new Date(timestamp);
      expect(timestampDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestampDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
  
  describe('calculateDuration', () => {
    it('should calculate duration between timestamps', () => {
      const startTime = new Date(2025, 0, 1, 12, 0, 0).toISOString();
      const endTime = new Date(2025, 0, 1, 12, 0, 5).toISOString();
      
      const duration = explainEngine.calculateDuration(startTime, endTime);
      expect(duration).toBe(5000); // 5 seconds in milliseconds
    });
    
    it('should return null when timestamps are missing', () => {
      expect(explainEngine.calculateDuration(null, new Date().toISOString())).toBeNull();
      expect(explainEngine.calculateDuration(new Date().toISOString(), null)).toBeNull();
      expect(explainEngine.calculateDuration(null, null)).toBeNull();
    });
  });
});
