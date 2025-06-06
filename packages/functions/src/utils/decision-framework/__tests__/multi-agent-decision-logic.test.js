/**
 * Tests for Enhanced Multi-Agent Decision Logic
 * 
 * This file contains comprehensive tests for the Multi-Agent Decision Logic module,
 * including tests for different collaboration modes, agent interactions, conflict resolution,
 * and integration with other components.
 */

const { MultiAgentEnsemble, AgentType, CollaborationMode } = require('../multi-agent-decision-logic');
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
    generateWithAgentRAG: jest.fn().mockResolvedValue(JSON.stringify({
      action: 'test_action',
      confidence: 0.85,
      reasoning: 'Test reasoning',
      alternativeActions: ['alt_action_1', 'alt_action_2'],
      considerations: {
        key1: 'value1',
        key2: 'value2'
      }
    })),
    generateWithAgentDirect: jest.fn().mockResolvedValue('test_response')
  }))
}));

jest.mock('../../reachspark-firebase/packages/functions/src/utils/retryLogic', () => ({
  retryWithExponentialBackoff: jest.fn().mockImplementation((fn) => fn())
}));

describe('Enhanced MultiAgentEnsemble', () => {
  let agentEnsemble;
  
  beforeEach(() => {
    // Create a new instance for each test
    agentEnsemble = new MultiAgentEnsemble('test-context', true);
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Constructor', () => {
    it('should initialize with default parameters', () => {
      expect(agentEnsemble.contextId).toBe('test-context');
      expect(agentEnsemble.testMode).toBe(true);
      expect(agentEnsemble.agentMemory).toEqual({});
      expect(agentEnsemble.collaborationHistory).toEqual([]);
    });
    
    it('should initialize LLM engine', () => {
      expect(agentEnsemble.llmEngine).toBeDefined();
    });
  });
  
  describe('generateCollaborativeDecision', () => {
    it('should return a mock decision in test mode', async () => {
      const result = await agentEnsemble.generateCollaborativeDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' }
      });
      
      expect(result).toBeDefined();
      expect(result.action).toBe('qualify_lead');
      expect(result.confidence).toBe(0.85);
      expect(result.alternativeActions).toContain('disqualify_lead');
    });
    
    it('should validate required parameters', async () => {
      await expect(agentEnsemble.generateCollaborativeDecision({
        context: { leadId: 'test-lead' }
      })).rejects.toThrow('Decision type is required');
      
      await expect(agentEnsemble.generateCollaborativeDecision({
        decisionType: 'LEAD_QUALIFICATION'
      })).rejects.toThrow('Decision context is required');
    });
    
    it('should use default agents when not specified', async () => {
      // Override test mode for this test
      agentEnsemble.testMode = false;
      
      // Mock getDefaultAgentsForDecisionType
      const spy = jest.spyOn(agentEnsemble, 'getDefaultAgentsForDecisionType');
      spy.mockReturnValue([AgentType.QUALIFICATION_AGENT, AgentType.RESEARCH_AGENT]);
      
      // Mock executeConsensusCollaboration
      const mockExecute = jest.spyOn(agentEnsemble, 'executeConsensusCollaboration');
      mockExecute.mockResolvedValue({
        action: 'test_action',
        confidence: 0.8
      });
      
      await agentEnsemble.generateCollaborativeDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' }
      });
      
      expect(spy).toHaveBeenCalledWith('LEAD_QUALIFICATION');
      expect(mockExecute).toHaveBeenCalled();
      expect(mockExecute.mock.calls[0][0].agentTypes).toEqual([
        AgentType.QUALIFICATION_AGENT,
        AgentType.RESEARCH_AGENT
      ]);
      
      // Restore test mode
      agentEnsemble.testMode = true;
    });
    
    it('should use specified collaboration mode', async () => {
      // Override test mode for this test
      agentEnsemble.testMode = false;
      
      // Mock execution methods
      const mockSequential = jest.spyOn(agentEnsemble, 'executeSequentialCollaboration');
      mockSequential.mockResolvedValue({
        action: 'sequential_action',
        confidence: 0.8
      });
      
      const mockParallel = jest.spyOn(agentEnsemble, 'executeParallelCollaboration');
      mockParallel.mockResolvedValue({
        action: 'parallel_action',
        confidence: 0.8
      });
      
      const mockHierarchical = jest.spyOn(agentEnsemble, 'executeHierarchicalCollaboration');
      mockHierarchical.mockResolvedValue({
        action: 'hierarchical_action',
        confidence: 0.8
      });
      
      const mockConsensus = jest.spyOn(agentEnsemble, 'executeConsensusCollaboration');
      mockConsensus.mockResolvedValue({
        action: 'consensus_action',
        confidence: 0.8
      });
      
      // Test sequential mode
      await agentEnsemble.generateCollaborativeDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        collaborationMode: CollaborationMode.SEQUENTIAL
      });
      
      expect(mockSequential).toHaveBeenCalled();
      expect(mockParallel).not.toHaveBeenCalled();
      expect(mockHierarchical).not.toHaveBeenCalled();
      expect(mockConsensus).not.toHaveBeenCalled();
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test parallel mode
      await agentEnsemble.generateCollaborativeDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        collaborationMode: CollaborationMode.PARALLEL
      });
      
      expect(mockSequential).not.toHaveBeenCalled();
      expect(mockParallel).toHaveBeenCalled();
      expect(mockHierarchical).not.toHaveBeenCalled();
      expect(mockConsensus).not.toHaveBeenCalled();
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test hierarchical mode
      await agentEnsemble.generateCollaborativeDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        collaborationMode: CollaborationMode.HIERARCHICAL
      });
      
      expect(mockSequential).not.toHaveBeenCalled();
      expect(mockParallel).not.toHaveBeenCalled();
      expect(mockHierarchical).toHaveBeenCalled();
      expect(mockConsensus).not.toHaveBeenCalled();
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test consensus mode (default)
      await agentEnsemble.generateCollaborativeDecision({
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' }
      });
      
      expect(mockSequential).not.toHaveBeenCalled();
      expect(mockParallel).not.toHaveBeenCalled();
      expect(mockHierarchical).not.toHaveBeenCalled();
      expect(mockConsensus).toHaveBeenCalled();
      
      // Restore test mode
      agentEnsemble.testMode = true;
    });
  });
  
  describe('getDefaultAgentsForDecisionType', () => {
    it('should return correct agents for known decision types', () => {
      const leadQualificationAgents = agentEnsemble.getDefaultAgentsForDecisionType('LEAD_QUALIFICATION');
      expect(leadQualificationAgents).toContain(AgentType.QUALIFICATION_AGENT);
      expect(leadQualificationAgents).toContain(AgentType.RESEARCH_AGENT);
      
      const channelSelectionAgents = agentEnsemble.getDefaultAgentsForDecisionType('CHANNEL_SELECTION');
      expect(channelSelectionAgents).toContain(AgentType.CHANNEL_STRATEGIST_AGENT);
      expect(channelSelectionAgents).toContain(AgentType.COMMUNICATION_AGENT);
    });
    
    it('should return default agents for unknown decision types', () => {
      const defaultAgents = agentEnsemble.getDefaultAgentsForDecisionType('UNKNOWN_TYPE');
      expect(defaultAgents).toContain(AgentType.STRATEGY_AGENT);
      expect(defaultAgents).toContain(AgentType.ETHICS_ADVISOR_AGENT);
      expect(defaultAgents).toContain(AgentType.RISK_ASSESSMENT_AGENT);
    });
  });
  
  describe('executeSequentialCollaboration', () => {
    it('should process agents in sequence', async () => {
      // Override test mode for this test
      agentEnsemble.testMode = false;
      
      // Mock getAgentContribution
      const mockGetContribution = jest.spyOn(agentEnsemble, 'getAgentContribution');
      mockGetContribution
        .mockResolvedValueOnce({
          action: 'action_1',
          confidence: 0.7,
          reasoning: 'Reasoning 1',
          alternativeActions: ['alt_1'],
          agentType: AgentType.QUALIFICATION_AGENT
        })
        .mockResolvedValueOnce({
          action: 'action_2',
          confidence: 0.8,
          reasoning: 'Reasoning 2',
          alternativeActions: ['alt_2'],
          agentType: AgentType.RESEARCH_AGENT
        });
      
      // Mock integrateAgentContribution
      const mockIntegrate = jest.spyOn(agentEnsemble, 'integrateAgentContribution');
      mockIntegrate
        .mockReturnValueOnce({
          action: 'action_1',
          confidence: 0.7,
          reasoning: 'Reasoning 1',
          alternativeActions: ['alt_1'],
          agentContributions: {
            [AgentType.QUALIFICATION_AGENT]: {
              action: 'action_1',
              confidence: 0.7,
              reasoning: 'Reasoning 1',
              alternativeActions: ['alt_1'],
              agentType: AgentType.QUALIFICATION_AGENT
            }
          }
        })
        .mockReturnValueOnce({
          action: 'action_2',
          confidence: 0.8,
          reasoning: 'Combined reasoning',
          alternativeActions: ['alt_1', 'alt_2'],
          agentContributions: {
            [AgentType.QUALIFICATION_AGENT]: {
              action: 'action_1',
              confidence: 0.7,
              reasoning: 'Reasoning 1',
              alternativeActions: ['alt_1'],
              agentType: AgentType.QUALIFICATION_AGENT
            },
            [AgentType.RESEARCH_AGENT]: {
              action: 'action_2',
              confidence: 0.8,
              reasoning: 'Reasoning 2',
              alternativeActions: ['alt_2'],
              agentType: AgentType.RESEARCH_AGENT
            }
          }
        });
      
      const collaborationContext = {
        agentTypes: [AgentType.QUALIFICATION_AGENT, AgentType.RESEARCH_AGENT],
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        constraints: {},
        agentContributions: {}
      };
      
      const result = await agentEnsemble.executeSequentialCollaboration(collaborationContext);
      
      expect(mockGetContribution).toHaveBeenCalledTimes(2);
      expect(mockIntegrate).toHaveBeenCalledTimes(2);
      expect(result.action).toBe('action_2');
      expect(result.confidence).toBe(0.8);
      expect(result.alternativeActions).toContain('alt_1');
      expect(result.alternativeActions).toContain('alt_2');
      
      // Verify agent contributions were stored
      expect(collaborationContext.agentContributions[AgentType.QUALIFICATION_AGENT]).toBeDefined();
      expect(collaborationContext.agentContributions[AgentType.RESEARCH_AGENT]).toBeDefined();
      
      // Restore test mode
      agentEnsemble.testMode = true;
    });
  });
  
  describe('executeParallelCollaboration', () => {
    it('should process agents in parallel', async () => {
      // Override test mode for this test
      agentEnsemble.testMode = false;
      
      // Mock getAgentContribution
      const mockGetContribution = jest.spyOn(agentEnsemble, 'getAgentContribution');
      mockGetContribution
        .mockResolvedValueOnce({
          action: 'action_1',
          confidence: 0.7,
          reasoning: 'Reasoning 1',
          alternativeActions: ['alt_1'],
          agentType: AgentType.QUALIFICATION_AGENT
        })
        .mockResolvedValueOnce({
          action: 'action_2',
          confidence: 0.8,
          reasoning: 'Reasoning 2',
          alternativeActions: ['alt_2'],
          agentType: AgentType.RESEARCH_AGENT
        });
      
      // Mock integrateMultipleContributions
      const mockIntegrateMultiple = jest.spyOn(agentEnsemble, 'integrateMultipleContributions');
      mockIntegrateMultiple.mockReturnValue({
        action: 'combined_action',
        confidence: 0.75,
        reasoning: 'Combined reasoning',
        alternativeActions: ['alt_1', 'alt_2'],
        agentContributions: {
          [AgentType.QUALIFICATION_AGENT]: {
            action: 'action_1',
            confidence: 0.7,
            reasoning: 'Reasoning 1',
            alternativeActions: ['alt_1'],
            agentType: AgentType.QUALIFICATION_AGENT
          },
          [AgentType.RESEARCH_AGENT]: {
            action: 'action_2',
            confidence: 0.8,
            reasoning: 'Reasoning 2',
            alternativeActions: ['alt_2'],
            agentType: AgentType.RESEARCH_AGENT
          }
        }
      });
      
      const collaborationContext = {
        agentTypes: [AgentType.QUALIFICATION_AGENT, AgentType.RESEARCH_AGENT],
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        constraints: {},
        agentContributions: {}
      };
      
      const result = await agentEnsemble.executeParallelCollaboration(collaborationContext);
      
      expect(mockGetContribution).toHaveBeenCalledTimes(2);
      expect(mockIntegrateMultiple).toHaveBeenCalledTimes(1);
      expect(result.action).toBe('combined_action');
      expect(result.confidence).toBe(0.75);
      
      // Verify agent contributions were stored
      expect(collaborationContext.agentContributions[AgentType.QUALIFICATION_AGENT]).toBeDefined();
      expect(collaborationContext.agentContributions[AgentType.RESEARCH_AGENT]).toBeDefined();
      
      // Restore test mode
      agentEnsemble.testMode = true;
    });
  });
  
  describe('executeHierarchicalCollaboration', () => {
    it('should use lead agent to make final decision', async () => {
      // Override test mode for this test
      agentEnsemble.testMode = false;
      
      // Mock determineLeadAgent
      const mockDetermineLeadAgent = jest.spyOn(agentEnsemble, 'determineLeadAgent');
      mockDetermineLeadAgent.mockReturnValue(AgentType.STRATEGY_AGENT);
      
      // Mock getAgentContribution
      const mockGetContribution = jest.spyOn(agentEnsemble, 'getAgentContribution');
      mockGetContribution
        .mockResolvedValueOnce({
          action: 'action_1',
          confidence: 0.7,
          reasoning: 'Reasoning 1',
          alternativeActions: ['alt_1'],
          agentType: AgentType.QUALIFICATION_AGENT
        })
        .mockResolvedValueOnce({
          action: 'action_2',
          confidence: 0.8,
          reasoning: 'Reasoning 2',
          alternativeActions: ['alt_2'],
          agentType: AgentType.RESEARCH_AGENT
        })
        .mockResolvedValueOnce({
          action: 'lead_action',
          confidence: 0.9,
          reasoning: 'Lead reasoning',
          alternativeActions: ['lead_alt'],
          agentType: AgentType.STRATEGY_AGENT
        });
      
      const collaborationContext = {
        agentTypes: [AgentType.STRATEGY_AGENT, AgentType.QUALIFICATION_AGENT, AgentType.RESEARCH_AGENT],
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        constraints: {},
        agentContributions: {}
      };
      
      const result = await agentEnsemble.executeHierarchicalCollaboration(collaborationContext);
      
      expect(mockDetermineLeadAgent).toHaveBeenCalledWith(
        'LEAD_QUALIFICATION',
        [AgentType.STRATEGY_AGENT, AgentType.QUALIFICATION_AGENT, AgentType.RESEARCH_AGENT]
      );
      expect(mockGetContribution).toHaveBeenCalledTimes(3);
      
      // Verify lead agent was called with supporting contributions
      expect(mockGetContribution.mock.calls[2][0].supportingContributions).toBeDefined();
      expect(mockGetContribution.mock.calls[2][0].agentType).toBe(AgentType.STRATEGY_AGENT);
      
      expect(result.action).toBe('lead_action');
      expect(result.confidence).toBe(0.9);
      
      // Verify agent contributions were stored
      expect(collaborationContext.agentContributions[AgentType.QUALIFICATION_AGENT]).toBeDefined();
      expect(collaborationContext.agentContributions[AgentType.RESEARCH_AGENT]).toBeDefined();
      expect(collaborationContext.agentContributions[AgentType.STRATEGY_AGENT]).toBeDefined();
      
      // Restore test mode
      agentEnsemble.testMode = true;
    });
  });
  
  describe('executeConsensusCollaboration', () => {
    it('should integrate contributions when no conflicts exist', async () => {
      // Override test mode for this test
      agentEnsemble.testMode = false;
      
      // Mock getAgentContribution
      const mockGetContribution = jest.spyOn(agentEnsemble, 'getAgentContribution');
      mockGetContribution
        .mockResolvedValueOnce({
          action: 'same_action',
          confidence: 0.7,
          reasoning: 'Reasoning 1',
          alternativeActions: ['alt_1'],
          agentType: AgentType.QUALIFICATION_AGENT
        })
        .mockResolvedValueOnce({
          action: 'same_action',
          confidence: 0.8,
          reasoning: 'Reasoning 2',
          alternativeActions: ['alt_2'],
          agentType: AgentType.RESEARCH_AGENT
        });
      
      // Mock identifyConflicts
      const mockIdentifyConflicts = jest.spyOn(agentEnsemble, 'identifyConflicts');
      mockIdentifyConflicts.mockReturnValue([]);
      
      // Mock integrateMultipleContributions
      const mockIntegrateMultiple = jest.spyOn(agentEnsemble, 'integrateMultipleContributions');
      mockIntegrateMultiple.mockReturnValue({
        action: 'same_action',
        confidence: 0.75,
        reasoning: 'Combined reasoning',
        alternativeActions: ['alt_1', 'alt_2']
      });
      
      const collaborationContext = {
        agentTypes: [AgentType.QUALIFICATION_AGENT, AgentType.RESEARCH_AGENT],
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        constraints: {},
        agentContributions: {}
      };
      
      const result = await agentEnsemble.executeConsensusCollaboration(collaborationContext);
      
      expect(mockGetContribution).toHaveBeenCalledTimes(2);
      expect(mockIdentifyConflicts).toHaveBeenCalledTimes(1);
      expect(mockIntegrateMultiple).toHaveBeenCalledTimes(1);
      expect(result.action).toBe('same_action');
      
      // Verify no conflicts were stored
      expect(collaborationContext.conflicts).toEqual([]);
      
      // Restore test mode
      agentEnsemble.testMode = true;
    });
    
    it('should resolve conflicts through debate when conflicts exist', async () => {
      // Override test mode for this test
      agentEnsemble.testMode = false;
      
      // Mock getAgentContribution
      const mockGetContribution = jest.spyOn(agentEnsemble, 'getAgentContribution');
      // Initial contributions with conflict
      mockGetContribution
        .mockResolvedValueOnce({
          action: 'action_1',
          confidence: 0.7,
          reasoning: 'Reasoning 1',
          alternativeActions: ['alt_1'],
          agentType: AgentType.QUALIFICATION_AGENT
        })
        .mockResolvedValueOnce({
          action: 'action_2',
          confidence: 0.8,
          reasoning: 'Reasoning 2',
          alternativeActions: ['alt_2'],
          agentType: AgentType.RESEARCH_AGENT
        })
        // Final contributions after debate
        .mockResolvedValueOnce({
          action: 'consensus_action',
          confidence: 0.85,
          reasoning: 'Updated reasoning 1',
          alternativeActions: ['alt_1'],
          agentType: AgentType.QUALIFICATION_AGENT
        })
        .mockResolvedValueOnce({
          action: 'consensus_action',
          confidence: 0.8,
          reasoning: 'Updated reasoning 2',
          alternativeActions: ['alt_2'],
          agentType: AgentType.RESEARCH_AGENT
        });
      
      // Mock identifyConflicts
      const mockIdentifyConflicts = jest.spyOn(agentEnsemble, 'identifyConflicts');
      mockIdentifyConflicts.mockReturnValue([
        {
          id: 'conflict-1',
          type: 'action_disagreement',
          description: 'Disagreement on recommended action',
          agents: {
            'action_1': [AgentType.QUALIFICATION_AGENT],
            'action_2': [AgentType.RESEARCH_AGENT]
          }
        }
      ]);
      
      // Mock resolveConflictsThroughDebate
      const mockResolveConflicts = jest.spyOn(agentEnsemble, 'resolveConflictsThroughDebate');
      mockResolveConflicts.mockResolvedValue([
        {
          conflictId: 'conflict-1',
          resolution: 'Agents should agree on consensus_action',
          reasoning: 'Debate reasoning',
          recommendedAction: 'consensus_action',
          confidence: 0.85
        }
      ]);
      
      // Mock integrateMultipleContributions
      const mockIntegrateMultiple = jest.spyOn(agentEnsemble, 'integrateMultipleContributions');
      mockIntegrateMultiple.mockReturnValue({
        action: 'consensus_action',
        confidence: 0.85,
        reasoning: 'Consensus reasoning',
        alternativeActions: ['alt_1', 'alt_2']
      });
      
      const collaborationContext = {
        agentTypes: [AgentType.QUALIFICATION_AGENT, AgentType.RESEARCH_AGENT],
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        constraints: {},
        agentContributions: {}
      };
      
      const result = await agentEnsemble.executeConsensusCollaboration(collaborationContext);
      
      expect(mockGetContribution).toHaveBeenCalledTimes(4); // 2 initial + 2 after debate
      expect(mockIdentifyConflicts).toHaveBeenCalledTimes(1);
      expect(mockResolveConflicts).toHaveBeenCalledTimes(1);
      expect(mockIntegrateMultiple).toHaveBeenCalledTimes(1);
      expect(result.action).toBe('consensus_action');
      
      // Verify conflicts and resolutions were stored
      expect(collaborationContext.conflicts.length).toBe(1);
      expect(collaborationContext.resolutions.length).toBe(1);
      
      // Restore test mode
      agentEnsemble.testMode = true;
    });
  });
  
  describe('getAgentContribution', () => {
    it('should prepare prompt and get response from LLM', async () => {
      // Override test mode for this test
      agentEnsemble.testMode = false;
      
      // Mock prepareAgentPrompt
      const mockPreparePrompt = jest.spyOn(agentEnsemble, 'prepareAgentPrompt');
      mockPreparePrompt.mockReturnValue('Test prompt');
      
      // Mock getAgentMemory
      const mockGetMemory = jest.spyOn(agentEnsemble, 'getAgentMemory');
      mockGetMemory.mockReturnValue({
        recentDecisions: [],
        insights: []
      });
      
      // Mock parseAgentResponse
      const mockParseResponse = jest.spyOn(agentEnsemble, 'parseAgentResponse');
      mockParseResponse.mockReturnValue({
        action: 'parsed_action',
        confidence: 0.8,
        reasoning: 'Parsed reasoning',
        alternativeActions: ['alt_1', 'alt_2'],
        agentType: AgentType.QUALIFICATION_AGENT
      });
      
      const params = {
        agentType: AgentType.QUALIFICATION_AGENT,
        decisionType: 'LEAD_QUALIFICATION',
        context: { leadId: 'test-lead' },
        constraints: {}
      };
      
      const result = await agentEnsemble.getAgentContribution(params);
      
      expect(mockPreparePrompt).toHaveBeenCalledWith(params);
      expect(mockGetMemory).toHaveBeenCalledWith(AgentType.QUALIFICATION_AGENT);
      expect(agentEnsemble.llmEngine.generateWithAgentRAG).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        agentType: AgentType.QUALIFICATION_AGENT,
        memory: { recentDecisions: [], insights: [] },
        maxTokens: 1000
      });
      expect(mockParseResponse).toHaveBeenCalled();
      expect(result.action).toBe('parsed_action');
      
      // Restore test mode
      agentEnsemble.testMode = true;
    });
  });
  
  describe('parseAgentResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        action: 'test_action',
        confidence: 0.85,
        reasoning: 'Test reasoning',
        alternativeActions: ['alt_1', 'alt_2']
      });
      
      const result = agentEnsemble.parseAgentResponse(response, AgentType.QUALIFICATION_AGENT);
      
      expect(result.action).toBe('test_action');
      expect(result.confidence).toBe(0.85);
      expect(result.reasoning).toBe('Test reasoning');
      expect(result.alternativeActions).toEqual(['alt_1', 'alt_2']);
      expect(result.agentType).toBe(AgentType.QUALIFICATION_AGENT);
    });
    
    it('should extract JSON from text response', () => {
      const response = `
Here's my recommendation:
{
  "action": "test_action",
  "confidence": 0.85,
  "reasoning": "Test reasoning",
  "alternativeActions": ["alt_1", "alt_2"]
}
I hope this helps!
      `;
      
      const result = agentEnsemble.parseAgentResponse(response, AgentType.QUALIFICATION_AGENT);
      
      expect(result.action).toBe('test_action');
      expect(result.confidence).toBe(0.85);
    });
    
    it('should return fallback for invalid response', () => {
      const response = 'This is not valid JSON';
      
      const result = agentEnsemble.parseAgentResponse(response, AgentType.QUALIFICATION_AGENT);
      
      expect(result.action).toBe('fallback_action');
      expect(result.isErrorResponse).toBe(true);
      expect(result.agentType).toBe(AgentType.QUALIFICATION_AGENT);
    });
    
    it('should validate required fields', () => {
      const response = JSON.stringify({
        // Missing action
        confidence: 0.85,
        reasoning: 'Test reasoning',
        alternativeActions: ['alt_1', 'alt_2']
      });
      
      const result = agentEnsemble.parseAgentResponse(response, AgentType.QUALIFICATION_AGENT);
      
      expect(result.action).toBe('fallback_action');
      expect(result.isErrorResponse).toBe(true);
    });
  });
  
  describe('integrateAgentContribution', () => {
    it('should use contribution as base when current result is empty', () => {
      const currentResult = {
        action: null,
        confidence: 0,
        reasoning: '',
        alternativeActions: []
      };
      
      const agentContribution = {
        action: 'test_action',
        confidence: 0.8,
        reasoning: 'Test reasoning',
        alternativeActions: ['alt_1', 'alt_2'],
        agentType: AgentType.QUALIFICATION_AGENT
      };
      
      const result = agentEnsemble.integrateAgentContribution(currentResult, agentContribution);
      
      expect(result.action).toBe('test_action');
      expect(result.confidence).toBe(0.8);
      expect(result.reasoning).toBe('Test reasoning');
      expect(result.alternativeActions).toEqual(['alt_1', 'alt_2']);
      expect(result.agentContributions[AgentType.QUALIFICATION_AGENT]).toBe(agentContribution);
    });
    
    it('should combine reasoning and alternative actions', () => {
      const currentResult = {
        action: 'current_action',
        confidence: 0.7,
        reasoning: 'Current reasoning',
        alternativeActions: ['current_alt_1', 'current_alt_2'],
        agentContributions: {
          [AgentType.RESEARCH_AGENT]: {
            action: 'current_action',
            confidence: 0.7,
            reasoning: 'Current reasoning',
            alternativeActions: ['current_alt_1', 'current_alt_2'],
            agentType: AgentType.RESEARCH_AGENT
          }
        }
      };
      
      const agentContribution = {
        action: 'new_action',
        confidence: 0.8,
        reasoning: 'New reasoning',
        alternativeActions: ['new_alt_1', 'current_alt_2'], // Overlapping alt
        agentType: AgentType.QUALIFICATION_AGENT
      };
      
      const result = agentEnsemble.integrateAgentContribution(currentResult, agentContribution);
      
      // Should use new action due to higher confidence
      expect(result.action).toBe('new_action');
      expect(result.confidence).toBe(0.8);
      
      // Should combine reasoning
      expect(result.reasoning).toContain('Current reasoning');
      expect(result.reasoning).toContain('New reasoning');
      expect(result.reasoning).toContain(AgentType.QUALIFICATION_AGENT);
      
      // Should combine alternatives without duplicates
      expect(result.alternativeActions).toContain('current_alt_1');
      expect(result.alternativeActions).toContain('new_alt_1');
      expect(result.alternativeActions).toContain('current_alt_2');
      expect(result.alternativeActions.length).toBe(3); // No duplicates
      
      // Should store both contributions
      expect(result.agentContributions[AgentType.RESEARCH_AGENT]).toBeDefined();
      expect(result.agentContributions[AgentType.QUALIFICATION_AGENT]).toBe(agentContribution);
    });
    
    it('should keep current action when new confidence is lower', () => {
      const currentResult = {
        action: 'current_action',
        confidence: 0.9,
        reasoning: 'Current reasoning',
        alternativeActions: ['alt_1'],
        agentContributions: {}
      };
      
      const agentContribution = {
        action: 'new_action',
        confidence: 0.7,
        reasoning: 'New reasoning',
        alternativeActions: ['alt_2'],
        agentType: AgentType.QUALIFICATION_AGENT
      };
      
      const result = agentEnsemble.integrateAgentContribution(currentResult, agentContribution);
      
      // Should keep current action due to higher confidence
      expect(result.action).toBe('current_action');
      expect(result.confidence).toBe(0.9);
    });
  });
  
  describe('identifyConflicts', () => {
    it('should identify action disagreements', () => {
      const contributions = [
        {
          action: 'action_1',
          confidence: 0.7,
          reasoning: 'Reasoning 1',
          agentType: AgentType.QUALIFICATION_AGENT
        },
        {
          action: 'action_2',
          confidence: 0.8,
          reasoning: 'Reasoning 2',
          agentType: AgentType.RESEARCH_AGENT
        }
      ];
      
      const conflicts = agentEnsemble.identifyConflicts(contributions);
      
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('action_disagreement');
      expect(conflicts[0].agents['action_1']).toContain(AgentType.QUALIFICATION_AGENT);
      expect(conflicts[0].agents['action_2']).toContain(AgentType.RESEARCH_AGENT);
    });
    
    it('should identify confidence disagreements', () => {
      const contributions = [
        {
          action: 'same_action',
          confidence: 0.9,
          reasoning: 'Reasoning 1',
          agentType: AgentType.QUALIFICATION_AGENT
        },
        {
          action: 'same_action',
          confidence: 0.5,
          reasoning: 'Reasoning 2',
          agentType: AgentType.RESEARCH_AGENT
        }
      ];
      
      const conflicts = agentEnsemble.identifyConflicts(contributions);
      
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('confidence_disagreement');
      expect(conflicts[0].action).toBe('same_action');
      expect(conflicts[0].confidenceRange.min).toBe(0.5);
      expect(conflicts[0].confidenceRange.max).toBe(0.9);
    });
    
    it('should return empty array when no conflicts exist', () => {
      const contributions = [
        {
          action: 'same_action',
          confidence: 0.7,
          reasoning: 'Reasoning 1',
          agentType: AgentType.QUALIFICATION_AGENT
        },
        {
          action: 'same_action',
          confidence: 0.8,
          reasoning: 'Reasoning 2',
          agentType: AgentType.RESEARCH_AGENT
        }
      ];
      
      const conflicts = agentEnsemble.identifyConflicts(contributions);
      
      expect(conflicts.length).toBe(0);
    });
  });
  
  describe('determineLeadAgent', () => {
    it('should return preferred lead agent when available', () => {
      const decisionType = 'LEAD_QUALIFICATION';
      const agentTypes = [
        AgentType.STRATEGY_AGENT,
        AgentType.QUALIFICATION_AGENT,
        AgentType.RESEARCH_AGENT
      ];
      
      const leadAgent = agentEnsemble.determineLeadAgent(decisionType, agentTypes);
      
      expect(leadAgent).toBe(AgentType.QUALIFICATION_AGENT);
    });
    
    it('should return strategy agent when preferred agent not available', () => {
      const decisionType = 'LEAD_QUALIFICATION';
      const agentTypes = [
        AgentType.STRATEGY_AGENT,
        AgentType.RESEARCH_AGENT
      ];
      
      const leadAgent = agentEnsemble.determineLeadAgent(decisionType, agentTypes);
      
      expect(leadAgent).toBe(AgentType.STRATEGY_AGENT);
    });
    
    it('should return first agent when neither preferred nor strategy agent available', () => {
      const decisionType = 'LEAD_QUALIFICATION';
      const agentTypes = [
        AgentType.RESEARCH_AGENT,
        AgentType.COMMUNICATION_AGENT
      ];
      
      const leadAgent = agentEnsemble.determineLeadAgent(decisionType, agentTypes);
      
      expect(leadAgent).toBe(AgentType.RESEARCH_AGENT);
    });
  });
  
  describe('getMockCollaborativeDecision', () => {
    it('should return appropriate mock decision for known types', () => {
      const leadQualificationDecision = agentEnsemble.getMockCollaborativeDecision('LEAD_QUALIFICATION');
      expect(leadQualificationDecision.action).toBe('qualify_lead');
      
      const channelSelectionDecision = agentEnsemble.getMockCollaborativeDecision('CHANNEL_SELECTION');
      expect(channelSelectionDecision.action).toBe('email');
    });
    
    it('should return default mock decision for unknown types', () => {
      const defaultDecision = agentEnsemble.getMockCollaborativeDecision('UNKNOWN_TYPE');
      expect(defaultDecision.action).toBe('default_action');
      expect(defaultDecision.confidence).toBe(0.7);
    });
  });
});
