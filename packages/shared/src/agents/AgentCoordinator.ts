import { BaseAgent } from './BaseAgent';
import { ContentGeneratorAgent } from './ContentGeneratorAgent';
import { SocialMediaAgent } from './SocialMediaAgent';
import { AnalyticsAgent } from './AnalyticsAgent';
import {
  AgentType,
  AgentOperation,
  AgentCommunication,
  CommunicationType,
  OperationStatus,
  AlertType,
  AlertSeverity,
} from './types';

export interface WorkflowConfig {
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

interface WorkflowStep {
  id: string;
  agentType: AgentType;
  operation: string;
  dependencies: string[];
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    backoff: number;
  };
}

interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'condition';
  config: any;
}

interface WorkflowCondition {
  type: 'metric' | 'state' | 'time';
  condition: string;
  value: any;
}

interface WorkflowAction {
  type: 'notification' | 'webhook' | 'agent';
  config: any;
}

interface WorkflowState {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStep: number;
  results: Map<string, any>;
  errors: Map<string, Error>;
  startTime: Date;
  endTime?: Date;
}

export class AgentCoordinator extends BaseAgent {
  private agents: Map<AgentType, BaseAgent>;
  private workflows: Map<string, WorkflowConfig>;
  private workflowStates: Map<string, WorkflowState>;
  private communicationQueue: AgentCommunication[];

  constructor(config: any) {
    super({
      ...config,
      type: AgentType.COORDINATOR,
      capabilities: [
        {
          name: 'coordination',
          description: 'Coordinate agent interactions and workflows',
          requiredTokens: [],
          maxConcurrentOperations: 20,
        },
      ],
    });

    this.agents = new Map();
    this.workflows = new Map();
    this.workflowStates = new Map();
    this.communicationQueue = [];
  }

  public registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getConfig().type, agent);
  }

  public async registerWorkflow(workflow: WorkflowConfig): Promise<void> {
    this.workflows.set(workflow.name, workflow);
    await this.validateWorkflow(workflow);
  }

  protected async executeOperation(operation: AgentOperation): Promise<any> {
    const { workflowName, input } = operation.payload;
    
    // Get workflow configuration
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow ${workflowName} not found`);
    }

    // Initialize workflow state
    const state: WorkflowState = {
      id: `wf-${Date.now()}`,
      status: 'running',
      currentStep: 0,
      results: new Map(),
      errors: new Map(),
      startTime: new Date(),
    };
    this.workflowStates.set(state.id, state);

    try {
      // Execute workflow steps
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        state.currentStep = i;

        // Check dependencies
        if (!this.checkDependencies(step, state)) {
          throw new Error(`Dependencies not met for step ${step.id}`);
        }

        // Execute step
        const result = await this.executeStep(step, input, state);
        state.results.set(step.id, result);

        // Check conditions
        if (!this.checkConditions(workflow.conditions, state)) {
          throw new Error('Workflow conditions not met');
        }

        // Execute actions
        await this.executeActions(workflow.actions, state);
      }

      // Complete workflow
      state.status = 'completed';
      state.endTime = new Date();
      return state;
    } catch (error) {
      // Handle workflow failure
      state.status = 'failed';
      state.endTime = new Date();
      state.errors.set('workflow', error as Error);
      throw error;
    }
  }

  protected validateOperation(operation: AgentOperation): boolean {
    const { workflowName, input } = operation.payload;
    return (
      typeof workflowName === 'string' &&
      this.workflows.has(workflowName) &&
      typeof input === 'object'
    );
  }

  protected async handleError(error: Error, operation: AgentOperation): Promise<void> {
    await this.addAlert({
      id: `error-${Date.now()}`,
      type: AlertType.ERROR,
      severity: AlertSeverity.HIGH,
      message: `Workflow execution failed: ${error.message}`,
      timestamp: new Date(),
      resolved: false,
    });

    // Implement fallback strategy
    if (operation.retryCount < this.config.maxRetries) {
      operation.retryCount++;
      operation.status = OperationStatus.RETRYING;
      await this.processOperation(operation);
    }
  }

  private async validateWorkflow(workflow: WorkflowConfig): Promise<void> {
    // Validate workflow configuration
    for (const step of workflow.steps) {
      if (!this.agents.has(step.agentType)) {
        throw new Error(`Agent type ${step.agentType} not registered`);
      }
    }
  }

  private checkDependencies(step: WorkflowStep, state: WorkflowState): boolean {
    return step.dependencies.every(depId => state.results.has(depId));
  }

  private async executeStep(
    step: WorkflowStep,
    input: any,
    state: WorkflowState
  ): Promise<any> {
    const agent = this.agents.get(step.agentType);
    if (!agent) {
      throw new Error(`Agent type ${step.agentType} not found`);
    }

    const operation: AgentOperation = {
      id: `op-${Date.now()}`,
      type: step.operation,
      status: OperationStatus.PENDING,
      priority: 1,
      payload: {
        ...input,
        workflowId: state.id,
        stepId: step.id,
      },
      startTime: new Date(),
      retryCount: 0,
    };

    return agent.processOperation(operation);
  }

  private checkConditions(conditions: WorkflowCondition[], state: WorkflowState): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'metric':
          return this.checkMetricCondition(condition, state);
        case 'state':
          return this.checkStateCondition(condition, state);
        case 'time':
          return this.checkTimeCondition(condition);
        default:
          return false;
      }
    });
  }

  private checkMetricCondition(condition: WorkflowCondition, state: WorkflowState): boolean {
    // Implement metric condition checking
    return true;
  }

  private checkStateCondition(condition: WorkflowCondition, state: WorkflowState): boolean {
    // Implement state condition checking
    return true;
  }

  private checkTimeCondition(condition: WorkflowCondition): boolean {
    // Implement time condition checking
    return true;
  }

  private async executeActions(actions: WorkflowAction[], state: WorkflowState): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'notification':
          await this.sendNotification(action.config, state);
          break;
        case 'webhook':
          await this.triggerWebhook(action.config, state);
          break;
        case 'agent':
          await this.triggerAgentAction(action.config, state);
          break;
      }
    }
  }

  private async sendNotification(config: any, state: WorkflowState): Promise<void> {
    // Implement notification sending
  }

  private async triggerWebhook(config: any, state: WorkflowState): Promise<void> {
    // Implement webhook triggering
  }

  private async triggerAgentAction(config: any, state: WorkflowState): Promise<void> {
    // Implement agent action triggering
  }

  public async sendMessage(message: AgentCommunication): Promise<void> {
    this.communicationQueue.push(message);
    await this.processCommunicationQueue();
  }

  private async processCommunicationQueue(): Promise<void> {
    while (this.communicationQueue.length > 0) {
      const message = this.communicationQueue.shift();
      if (!message) continue;

      const targetAgent = this.agents.get(message.to as AgentType);
      if (targetAgent) {
        await targetAgent.communicate(message);
      }
    }
  }

  public getWorkflowState(workflowId: string): WorkflowState | undefined {
    return this.workflowStates.get(workflowId);
  }

  public getRegisteredAgents(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  public getRegisteredWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }
} 