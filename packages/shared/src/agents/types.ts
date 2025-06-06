import { Token } from '../tokens/types';

export interface AgentCapability {
  name: string;
  description: string;
  requiredTokens: Token[];
  maxConcurrentOperations: number;
}

export interface AgentMetrics {
  successRate: number;
  averageResponseTime: number;
  tokenEfficiency: number;
  lastActive: Date;
  totalOperations: number;
  errorRate: number;
}

export interface AgentState {
  isActive: boolean;
  currentOperation: string | null;
  queuedOperations: string[];
  lastError: string | null;
  metrics: AgentMetrics;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  maxRetries: number;
  timeout: number;
  priority: number;
  dependencies: string[];
  fallbackAgents: string[];
}

export enum AgentType {
  CONTENT_GENERATOR = 'CONTENT_GENERATOR',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EMAIL_MARKETER = 'EMAIL_MARKETER',
  ANALYTICS = 'ANALYTICS',
  SCHEDULER = 'SCHEDULER',
  OPTIMIZER = 'OPTIMIZER',
  QUALITY_CONTROLLER = 'QUALITY_CONTROLLER',
  TOKEN_MANAGER = 'TOKEN_MANAGER',
}

export interface AgentOperation {
  id: string;
  type: string;
  status: OperationStatus;
  priority: number;
  payload: any;
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
  retryCount: number;
  assignedAgent?: string;
}

export enum OperationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

export interface AgentCommunication {
  from: string;
  to: string;
  type: CommunicationType;
  payload: any;
  timestamp: Date;
  priority: number;
}

export enum CommunicationType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  BROADCAST = 'BROADCAST',
  ALERT = 'ALERT',
  COORDINATION = 'COORDINATION',
}

export interface AgentLearning {
  model: string;
  trainingData: any[];
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  lastTraining: Date;
  nextTraining: Date;
}

export interface AgentOptimization {
  strategy: string;
  parameters: Record<string, any>;
  performance: {
    improvement: number;
    baseline: number;
    current: number;
  };
  lastOptimization: Date;
}

export interface AgentAutonomy {
  level: AutonomyLevel;
  decisionMaking: {
    confidence: number;
    threshold: number;
    fallbackStrategy: string;
  };
  constraints: {
    maxBudget: number;
    maxOperations: number;
    timeWindow: number;
  };
}

export enum AutonomyLevel {
  SUPERVISED = 'SUPERVISED',
  SEMI_AUTONOMOUS = 'SEMI_AUTONOMOUS',
  FULLY_AUTONOMOUS = 'FULLY_AUTONOMOUS',
}

export interface AgentHealth {
  status: HealthStatus;
  lastCheck: Date;
  metrics: {
    cpu: number;
    memory: number;
    responseTime: number;
    errorRate: number;
  };
  alerts: Alert[];
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export enum AlertType {
  PERFORMANCE = 'PERFORMANCE',
  ERROR = 'ERROR',
  RESOURCE = 'RESOURCE',
  SECURITY = 'SECURITY',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
} 