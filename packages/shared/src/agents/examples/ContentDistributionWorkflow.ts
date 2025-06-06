import { AgentType } from '../types';
import { WorkflowConfig } from '../AgentCoordinator';

export const contentDistributionWorkflow: WorkflowConfig = {
  name: 'content-distribution',
  description: 'Automated content generation and distribution workflow',
  steps: [
    {
      id: 'generate-content',
      agentType: AgentType.CONTENT_GENERATOR,
      operation: 'generate',
      dependencies: [],
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoff: 1000,
      },
    },
    {
      id: 'analyze-content',
      agentType: AgentType.ANALYTICS,
      operation: 'analyze',
      dependencies: ['generate-content'],
      timeout: 15000,
      retryPolicy: {
        maxRetries: 2,
        backoff: 500,
      },
    },
    {
      id: 'distribute-content',
      agentType: AgentType.SOCIAL_MEDIA,
      operation: 'post',
      dependencies: ['analyze-content'],
      timeout: 20000,
      retryPolicy: {
        maxRetries: 3,
        backoff: 1000,
      },
    },
  ],
  triggers: [
    {
      type: 'schedule',
      config: {
        cron: '0 9 * * *', // Every day at 9 AM
        timezone: 'UTC',
      },
    },
  ],
  conditions: [
    {
      type: 'metric',
      condition: 'engagement_rate > 0.05',
      value: 0.05,
    },
    {
      type: 'time',
      condition: 'is_business_hours',
      value: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
      },
    },
  ],
  actions: [
    {
      type: 'notification',
      config: {
        channel: 'email',
        template: 'content-distribution-report',
        recipients: ['admin@reachspark.com'],
      },
    },
    {
      type: 'webhook',
      config: {
        url: 'https://api.reachspark.com/webhooks/content-distribution',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    },
  ],
};

// Example usage:
/*
const coordinator = new AgentCoordinator({
  name: 'content-coordinator',
  description: 'Coordinates content generation and distribution',
});

// Register agents
coordinator.registerAgent(new ContentGeneratorAgent({
  name: 'content-generator',
  description: 'Generates marketing content',
}));

coordinator.registerAgent(new AnalyticsAgent({
  name: 'analytics',
  description: 'Analyzes content performance',
}));

coordinator.registerAgent(new SocialMediaAgent({
  name: 'social-media',
  description: 'Manages social media distribution',
}));

// Register workflow
await coordinator.registerWorkflow(contentDistributionWorkflow);

// Execute workflow
const result = await coordinator.executeOperation({
  id: 'op-1',
  type: 'workflow',
  status: 'pending',
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
*/ 