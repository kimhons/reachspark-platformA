import { AgentType } from '../types';
import { WorkflowConfig } from '../AgentCoordinator';

export const smallBusinessGrowthWorkflow: WorkflowConfig = {
  name: 'small-business-growth',
  description: 'Automated marketing and growth workflow for small businesses',
  steps: [
    {
      id: 'analyze-competitors',
      agentType: AgentType.ANALYTICS,
      operation: 'analyze_competitors',
      dependencies: [],
      timeout: 45000,
      retryPolicy: {
        maxRetries: 2,
        backoff: 2000,
      },
    },
    {
      id: 'generate-content-strategy',
      agentType: AgentType.CONTENT_GENERATOR,
      operation: 'generate_strategy',
      dependencies: ['analyze-competitors'],
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoff: 1000,
      },
    },
    {
      id: 'create-weekly-content',
      agentType: AgentType.CONTENT_GENERATOR,
      operation: 'generate_content_batch',
      dependencies: ['generate-content-strategy'],
      timeout: 60000,
      retryPolicy: {
        maxRetries: 3,
        backoff: 2000,
      },
    },
    {
      id: 'optimize-content',
      agentType: AgentType.ANALYTICS,
      operation: 'optimize_content',
      dependencies: ['create-weekly-content'],
      timeout: 30000,
      retryPolicy: {
        maxRetries: 2,
        backoff: 1000,
      },
    },
    {
      id: 'schedule-social-posts',
      agentType: AgentType.SOCIAL_MEDIA,
      operation: 'schedule_posts',
      dependencies: ['optimize-content'],
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoff: 1000,
      },
    },
    {
      id: 'engage-with-audience',
      agentType: AgentType.SOCIAL_MEDIA,
      operation: 'engage_audience',
      dependencies: ['schedule-social-posts'],
      timeout: 45000,
      retryPolicy: {
        maxRetries: 2,
        backoff: 2000,
      },
    },
    {
      id: 'analyze-performance',
      agentType: AgentType.ANALYTICS,
      operation: 'analyze_performance',
      dependencies: ['engage-with-audience'],
      timeout: 30000,
      retryPolicy: {
        maxRetries: 2,
        backoff: 1000,
      },
    },
    {
      id: 'generate-report',
      agentType: AgentType.ANALYTICS,
      operation: 'generate_report',
      dependencies: ['analyze-performance'],
      timeout: 15000,
      retryPolicy: {
        maxRetries: 2,
        backoff: 1000,
      },
    },
  ],
  triggers: [
    {
      type: 'schedule',
      config: {
        cron: '0 0 * * 1', // Every Monday at midnight
        timezone: 'UTC',
      },
    },
    {
      type: 'event',
      config: {
        event: 'new_campaign',
        conditions: {
          campaign_type: ['product_launch', 'promotion', 'event'],
        },
      },
    },
  ],
  conditions: [
    {
      type: 'metric',
      condition: 'engagement_rate > 0.03',
      value: 0.03,
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
    {
      type: 'state',
      condition: 'has_sufficient_tokens',
      value: {
        required_tokens: {
          content_generation: 100,
          social_media: 50,
          analytics: 30,
        },
      },
    },
  ],
  actions: [
    {
      type: 'notification',
      config: {
        channel: 'email',
        template: 'weekly-growth-report',
        recipients: ['business@reachspark.com'],
        schedule: 'weekly',
      },
    },
    {
      type: 'notification',
      config: {
        channel: 'slack',
        template: 'performance-alert',
        recipients: ['#marketing-alerts'],
        conditions: {
          metric: 'engagement_rate',
          threshold: 0.05,
          comparison: 'below',
        },
      },
    },
    {
      type: 'webhook',
      config: {
        url: 'https://api.reachspark.com/webhooks/growth-metrics',
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
  name: 'small-business-coordinator',
  description: 'Coordinates small business growth activities',
});

// Register agents
coordinator.registerAgent(new ContentGeneratorAgent({
  name: 'content-generator',
  description: 'Generates marketing content and strategies',
}));

coordinator.registerAgent(new AnalyticsAgent({
  name: 'analytics',
  description: 'Analyzes performance and optimizes content',
}));

coordinator.registerAgent(new SocialMediaAgent({
  name: 'social-media',
  description: 'Manages social media presence and engagement',
}));

// Register workflow
await coordinator.registerWorkflow(smallBusinessGrowthWorkflow);

// Execute workflow
const result = await coordinator.executeOperation({
  id: 'op-1',
  type: 'workflow',
  status: OperationStatus.PENDING,
  priority: 1,
  payload: {
    workflowName: 'small-business-growth',
    input: {
      businessType: 'retail',
      targetAudience: 'local customers',
      platforms: ['facebook', 'instagram', 'twitter'],
      contentPreferences: {
        tone: 'friendly',
        style: 'casual',
        frequency: 'daily',
      },
      goals: {
        engagement: 0.05,
        followers: 1000,
        conversions: 50,
      },
    },
  },
  startTime: new Date(),
  retryCount: 0,
});
*/ 