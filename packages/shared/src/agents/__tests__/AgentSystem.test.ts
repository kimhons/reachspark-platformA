import { AgentCoordinator } from '../AgentCoordinator';
import { ContentGeneratorAgent } from '../ContentGeneratorAgent';
import { SocialMediaAgent } from '../SocialMediaAgent';
import { AnalyticsAgent } from '../AnalyticsAgent';
import { contentDistributionWorkflow } from '../examples/ContentDistributionWorkflow';
import { AgentType, OperationStatus } from '../types';

describe('Agent System', () => {
  let coordinator: AgentCoordinator;
  let contentGenerator: ContentGeneratorAgent;
  let socialMedia: SocialMediaAgent;
  let analytics: AnalyticsAgent;

  beforeEach(() => {
    // Initialize agents
    contentGenerator = new ContentGeneratorAgent({
      name: 'content-generator',
      description: 'Generates marketing content',
    });

    analytics = new AnalyticsAgent({
      name: 'analytics',
      description: 'Analyzes content performance',
    });

    socialMedia = new SocialMediaAgent({
      name: 'social-media',
      description: 'Manages social media distribution',
    });

    // Initialize coordinator
    coordinator = new AgentCoordinator({
      name: 'content-coordinator',
      description: 'Coordinates content generation and distribution',
    });

    // Register agents
    coordinator.registerAgent(contentGenerator);
    coordinator.registerAgent(analytics);
    coordinator.registerAgent(socialMedia);
  });

  it('should register and execute a workflow', async () => {
    // Register workflow
    await coordinator.registerWorkflow(contentDistributionWorkflow);

    // Execute workflow
    const result = await coordinator.executeOperation({
      id: 'op-1',
      type: 'workflow',
      status: OperationStatus.PENDING,
      priority: 1,
      payload: {
        workflowName: 'content-distribution',
        input: {
          topic: 'Product Launch',
          platforms: ['twitter', 'linkedin'],
          targetAudience: 'tech professionals',
        },
      },
      startTime: new Date(),
      retryCount: 0,
    });

    // Verify workflow execution
    expect(result.status).toBe('completed');
    expect(result.results.size).toBe(3);
    expect(result.results.has('generate-content')).toBe(true);
    expect(result.results.has('analyze-content')).toBe(true);
    expect(result.results.has('distribute-content')).toBe(true);
  });

  it('should handle workflow failures gracefully', async () => {
    // Register workflow
    await coordinator.registerWorkflow(contentDistributionWorkflow);

    // Mock a failure in content generation
    jest.spyOn(contentGenerator, 'processOperation').mockRejectedValueOnce(
      new Error('Content generation failed')
    );

    // Execute workflow
    const result = await coordinator.executeOperation({
      id: 'op-2',
      type: 'workflow',
      status: OperationStatus.PENDING,
      priority: 1,
      payload: {
        workflowName: 'content-distribution',
        input: {
          topic: 'Product Launch',
          platforms: ['twitter', 'linkedin'],
          targetAudience: 'tech professionals',
        },
      },
      startTime: new Date(),
      retryCount: 0,
    });

    // Verify error handling
    expect(result.status).toBe('failed');
    expect(result.errors.has('workflow')).toBe(true);
  });

  it('should respect workflow dependencies', async () => {
    // Register workflow
    await coordinator.registerWorkflow(contentDistributionWorkflow);

    // Mock analytics to fail
    jest.spyOn(analytics, 'processOperation').mockRejectedValueOnce(
      new Error('Analytics failed')
    );

    // Execute workflow
    const result = await coordinator.executeOperation({
      id: 'op-3',
      type: 'workflow',
      status: OperationStatus.PENDING,
      priority: 1,
      payload: {
        workflowName: 'content-distribution',
        input: {
          topic: 'Product Launch',
          platforms: ['twitter', 'linkedin'],
          targetAudience: 'tech professionals',
        },
      },
      startTime: new Date(),
      retryCount: 0,
    });

    // Verify dependency handling
    expect(result.status).toBe('failed');
    expect(result.results.has('generate-content')).toBe(true);
    expect(result.results.has('analyze-content')).toBe(false);
    expect(result.results.has('distribute-content')).toBe(false);
  });

  it('should process agent communications', async () => {
    // Register workflow
    await coordinator.registerWorkflow(contentDistributionWorkflow);

    // Mock communication between agents
    const mockCommunicate = jest.fn();
    contentGenerator.communicate = mockCommunicate;

    // Send message
    await coordinator.sendMessage({
      id: 'msg-1',
      from: AgentType.SOCIAL_MEDIA,
      to: AgentType.CONTENT_GENERATOR,
      type: 'request',
      payload: {
        request: 'generate_content',
        params: {
          topic: 'Product Launch',
          style: 'professional',
        },
      },
      timestamp: new Date(),
    });

    // Verify communication
    expect(mockCommunicate).toHaveBeenCalled();
  });

  it('should track workflow state', async () => {
    // Register workflow
    await coordinator.registerWorkflow(contentDistributionWorkflow);

    // Execute workflow
    const result = await coordinator.executeOperation({
      id: 'op-4',
      type: 'workflow',
      status: OperationStatus.PENDING,
      priority: 1,
      payload: {
        workflowName: 'content-distribution',
        input: {
          topic: 'Product Launch',
          platforms: ['twitter', 'linkedin'],
          targetAudience: 'tech professionals',
        },
      },
      startTime: new Date(),
      retryCount: 0,
    });

    // Get workflow state
    const state = coordinator.getWorkflowState(result.id);

    // Verify state tracking
    expect(state).toBeDefined();
    expect(state?.status).toBe('completed');
    expect(state?.currentStep).toBe(2);
    expect(state?.startTime).toBeDefined();
    expect(state?.endTime).toBeDefined();
  });
}); 