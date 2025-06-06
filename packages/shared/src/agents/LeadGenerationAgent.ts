import { BaseAgent } from './BaseAgent';
import { AgentType, AgentOperation, OperationStatus } from './types';
import { TokenType } from '../tokens/types';

interface Lead {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  contact: ContactInfo;
  business: BusinessInfo;
  interests: string[];
  budget: BudgetInfo;
  timeline: TimelineInfo;
  interactions: Interaction[];
  score: number;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LeadSource {
  type: 'organic' | 'paid' | 'referral' | 'event' | 'outbound';
  channel: string;
  campaign?: string;
  referrer?: string;
  utmParams?: Record<string, string>;
}

interface LeadStatus {
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost';
  substage?: string;
  reason?: string;
  lastUpdated: Date;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  location: string;
  timezone: string;
  preferredContact: 'email' | 'phone' | 'both';
  availability: AvailabilityInfo;
}

interface BusinessInfo {
  type: string;
  size: 'small' | 'medium' | 'large';
  industry: string;
  annualRevenue?: number;
  employeeCount?: number;
  painPoints: string[];
  goals: string[];
  competitors: string[];
  techStack: string[];
}

interface BudgetInfo {
  range: {
    min: number;
    max: number;
  };
  currency: string;
  approvalProcess: string;
  timeline: string;
  constraints: string[];
}

interface TimelineInfo {
  startDate: Date;
  deadline: Date;
  urgency: 'low' | 'medium' | 'high';
  dependencies: string[];
  milestones: Milestone[];
}

interface Milestone {
  name: string;
  date: Date;
  status: 'pending' | 'completed' | 'delayed';
  dependencies: string[];
}

interface Interaction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'chat' | 'social';
  channel: string;
  direction: 'inbound' | 'outbound';
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  outcome: string;
  nextSteps: string[];
  timestamp: Date;
}

interface AvailabilityInfo {
  days: string[];
  hours: {
    start: string;
    end: string;
  };
  timezone: string;
  exceptions: Exception[];
}

interface Exception {
  date: Date;
  reason: string;
  status: 'available' | 'unavailable' | 'limited';
}

interface LeadScore {
  demographic: number;
  firmographic: number;
  behavioral: number;
  engagement: number;
  total: number;
}

interface LeadQualification {
  budget: boolean;
  authority: boolean;
  need: boolean;
  timeline: boolean;
  score: number;
}

interface ConversionStrategy {
  type: 'email' | 'call' | 'meeting' | 'demo' | 'trial';
  content: string;
  timing: Date;
  channel: string;
  followUp: FollowUpPlan;
}

interface FollowUpPlan {
  steps: FollowUpStep[];
  cadence: string;
  maxAttempts: number;
  fallbackStrategy: string;
}

interface FollowUpStep {
  type: string;
  content: string;
  delay: number;
  channel: string;
}

interface AdBudget {
  monthlyBudget: number;
  currentSpend: number;
  remainingBudget: number;
  allocations: AdAllocation[];
  performance: AdPerformance;
  lastReset: Date;
}

interface AdAllocation {
  channel: string;
  percentage: number;
  dailyBudget: number;
  spent: number;
  performance: ChannelPerformance;
}

interface AdPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

interface ChannelPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

interface AdCampaign {
  id: string;
  name: string;
  channel: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  targeting: AdTargeting;
  creatives: AdCreative[];
  performance: AdPerformance;
}

interface AdTargeting {
  locations: string[];
  demographics: Record<string, string[]>;
  interests: string[];
  behaviors: string[];
  keywords: string[];
  exclusions: string[];
}

interface AdCreative {
  id: string;
  type: 'image' | 'video' | 'text';
  content: string;
  headline: string;
  description: string;
  cta: string;
  performance: CreativePerformance;
}

interface CreativePerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
}

interface BudgetScaling {
  baseBudget: number;
  currentBudget: number;
  maxBudget: number;
  scalingFactors: ScalingFactors;
  performanceThresholds: PerformanceThresholds;
  lastAdjustment: Date;
}

interface ScalingFactors {
  conversionRate: number;
  roas: number;
  cpa: number;
  engagement: number;
}

interface PerformanceThresholds {
  conversionRate: {
    excellent: number;
    good: number;
    average: number;
  };
  roas: {
    excellent: number;
    good: number;
    average: number;
  };
  cpa: {
    excellent: number;
    good: number;
    average: number;
  };
  engagement: {
    excellent: number;
    good: number;
    average: number;
  };
}

export class LeadGenerationAgent extends BaseAgent {
  private leads: Map<string, Lead>;
  private conversionStrategies: Map<string, ConversionStrategy>;
  private leadScores: Map<string, LeadScore>;
  private qualificationCriteria: Map<string, LeadQualification>;
  private adBudget: AdBudget;
  private campaigns: Map<string, AdCampaign>;
  private budgetScaling: BudgetScaling;

  constructor(config: any) {
    super({
      ...config,
      type: AgentType.LEAD_GENERATION,
      capabilities: [
        {
          name: 'lead_capture',
          description: 'Capture and qualify leads from various sources',
          requiredTokens: [TokenType.AI_SERVICE],
          maxConcurrentOperations: 20,
        },
        {
          name: 'lead_scoring',
          description: 'Score and prioritize leads based on various factors',
          requiredTokens: [TokenType.AI_SERVICE],
          maxConcurrentOperations: 10,
        },
        {
          name: 'lead_nurturing',
          description: 'Nurture leads through personalized engagement',
          requiredTokens: [TokenType.AI_SERVICE, TokenType.EMAIL],
          maxConcurrentOperations: 15,
        },
        {
          name: 'conversion_optimization',
          description: 'Optimize lead conversion through targeted strategies',
          requiredTokens: [TokenType.AI_SERVICE],
          maxConcurrentOperations: 5,
        },
        {
          name: 'ad_budget_management',
          description: 'Manage and optimize ad budget across channels',
          requiredTokens: [TokenType.AI_SERVICE],
          maxConcurrentOperations: 3,
        },
      ],
    });

    this.leads = new Map();
    this.conversionStrategies = new Map();
    this.leadScores = new Map();
    this.qualificationCriteria = new Map();
    this.campaigns = new Map();

    // Initialize ad budget
    this.adBudget = {
      monthlyBudget: 150,
      currentSpend: 0,
      remainingBudget: 150,
      allocations: [
        {
          channel: 'google_ads',
          percentage: 40,
          dailyBudget: 2.00, // $150 * 40% / 30 days
          spent: 0,
          performance: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            cpa: 0,
            roas: 0,
          },
        },
        {
          channel: 'facebook_ads',
          percentage: 40,
          dailyBudget: 2.00, // $150 * 40% / 30 days
          spent: 0,
          performance: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            cpa: 0,
            roas: 0,
          },
        },
        {
          channel: 'linkedin_ads',
          percentage: 20,
          dailyBudget: 1.00, // $150 * 20% / 30 days
          spent: 0,
          performance: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            cpa: 0,
            roas: 0,
          },
        },
      ],
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
      },
      lastReset: new Date(),
    };

    // Initialize budget scaling
    this.budgetScaling = {
      baseBudget: 150,
      currentBudget: 150,
      maxBudget: 1500, // Increased max budget to 10x base budget
      scalingFactors: {
        conversionRate: 1.5, // 50% increase for excellent conversion rate
        roas: 2.0, // 100% increase for excellent ROAS
        cpa: 1.3, // 30% increase for excellent CPA
        engagement: 1.2, // 20% increase for excellent engagement
      },
      performanceThresholds: {
        conversionRate: {
          excellent: 0.15, // 15% conversion rate
          good: 0.10, // 10% conversion rate
          average: 0.05, // 5% conversion rate
        },
        roas: {
          excellent: 5.0, // 5x return on ad spend
          good: 3.0, // 3x return on ad spend
          average: 1.5, // 1.5x return on ad spend
        },
        cpa: {
          excellent: 10, // $10 cost per acquisition
          good: 20, // $20 cost per acquisition
          average: 30, // $30 cost per acquisition
        },
        engagement: {
          excellent: 0.08, // 8% engagement rate
          good: 0.05, // 5% engagement rate
          average: 0.03, // 3% engagement rate
        },
      },
      lastAdjustment: new Date(),
    };
  }

  protected async executeOperation(operation: AgentOperation): Promise<any> {
    const { type, payload } = operation;

    switch (type) {
      case 'capture_lead':
        return this.captureLead(payload);
      case 'score_lead':
        return this.scoreLead(payload);
      case 'nurture_lead':
        return this.nurtureLead(payload);
      case 'convert_lead':
        return this.convertLead(payload);
      case 'update_lead':
        return this.updateLead(payload);
      case 'generate_report':
        return this.generateReport(payload);
      case 'manage_ad_budget':
        return this.manageAdBudget(payload);
      case 'create_ad_campaign':
        return this.createAdCampaign(payload);
      case 'optimize_ad_campaign':
        return this.optimizeAdCampaign(payload);
      case 'track_ad_performance':
        return this.trackAdPerformance(payload);
      default:
        throw new Error(`Unsupported operation type: ${type}`);
    }
  }

  protected validateOperation(operation: AgentOperation): boolean {
    const { type, payload } = operation;
    return (
      typeof type === 'string' &&
      typeof payload === 'object' &&
      payload !== null
    );
  }

  private async captureLead(payload: any): Promise<Lead> {
    const { source, contact, business } = payload;

    // Validate lead data
    await this.validateLeadData(payload);

    // Create lead
    const lead: Lead = {
      id: `lead-${Date.now()}`,
      source,
      status: {
        stage: 'new',
        lastUpdated: new Date(),
      },
      contact,
      business,
      interests: [],
      budget: {
        range: { min: 0, max: 0 },
        currency: 'USD',
        approvalProcess: '',
        timeline: '',
        constraints: [],
      },
      timeline: {
        startDate: new Date(),
        deadline: new Date(),
        urgency: 'low',
        dependencies: [],
        milestones: [],
      },
      interactions: [],
      score: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Score lead
    await this.scoreLead({ leadId: lead.id });

    // Qualify lead
    await this.qualifyLead(lead);

    // Create conversion strategy
    await this.createConversionStrategy(lead);

    this.leads.set(lead.id, lead);
    return lead;
  }

  private async scoreLead(payload: any): Promise<LeadScore> {
    const { leadId } = payload;
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Calculate demographic score
    const demographicScore = await this.calculateDemographicScore(lead);

    // Calculate firmographic score
    const firmographicScore = await this.calculateFirmographicScore(lead);

    // Calculate behavioral score
    const behavioralScore = await this.calculateBehavioralScore(lead);

    // Calculate engagement score
    const engagementScore = await this.calculateEngagementScore(lead);

    // Calculate total score
    const totalScore = this.calculateTotalScore({
      demographic: demographicScore,
      firmographic: firmographicScore,
      behavioral: behavioralScore,
      engagement: engagementScore,
    });

    const score: LeadScore = {
      demographic: demographicScore,
      firmographic: firmographicScore,
      behavioral: behavioralScore,
      engagement: engagementScore,
      total: totalScore,
    };

    this.leadScores.set(leadId, score);
    return score;
  }

  private async nurtureLead(payload: any): Promise<void> {
    const { leadId, strategy } = payload;
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Get conversion strategy
    const conversionStrategy = this.conversionStrategies.get(leadId);
    if (!conversionStrategy) {
      throw new Error(`Conversion strategy not found for lead: ${leadId}`);
    }

    // Execute nurturing steps
    await this.executeNurturingSteps(lead, conversionStrategy);

    // Update lead status
    await this.updateLeadStatus(lead, 'nurturing');

    // Track interactions
    await this.trackInteraction(lead, {
      type: 'email',
      channel: 'email',
      direction: 'outbound',
      content: strategy.content,
      sentiment: 'neutral',
      outcome: 'pending',
      nextSteps: strategy.followUp.steps.map(step => step.type),
      timestamp: new Date(),
    });
  }

  private async convertLead(payload: any): Promise<void> {
    const { leadId, conversionType } = payload;
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Validate conversion
    await this.validateConversion(lead, conversionType);

    // Execute conversion
    await this.executeConversion(lead, conversionType);

    // Update lead status
    await this.updateLeadStatus(lead, 'converted');

    // Track conversion
    await this.trackConversion(lead, conversionType);

    // Create customer
    await this.createCustomer(lead);
  }

  private async updateLead(payload: any): Promise<Lead> {
    const { leadId, updates } = payload;
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Validate updates
    await this.validateLeadUpdates(updates);

    // Apply updates
    const updatedLead = {
      ...lead,
      ...updates,
      updatedAt: new Date(),
    };

    // Recalculate score
    await this.scoreLead({ leadId });

    this.leads.set(leadId, updatedLead);
    return updatedLead;
  }

  private async generateReport(payload: any): Promise<any> {
    const { type, filters } = payload;

    switch (type) {
      case 'lead_summary':
        return this.generateLeadSummary(filters);
      case 'conversion_summary':
        return this.generateConversionSummary(filters);
      case 'nurturing_summary':
        return this.generateNurturingSummary(filters);
      default:
        throw new Error(`Invalid report type: ${type}`);
    }
  }

  private async validateLeadData(payload: any): Promise<void> {
    // Implement lead data validation logic
  }

  private async qualifyLead(lead: Lead): Promise<void> {
    // Implement lead qualification logic
  }

  private async createConversionStrategy(lead: Lead): Promise<void> {
    // Implement conversion strategy creation logic
  }

  private async calculateDemographicScore(lead: Lead): Promise<number> {
    // Implement demographic scoring logic
    return 0;
  }

  private async calculateFirmographicScore(lead: Lead): Promise<number> {
    // Implement firmographic scoring logic
    return 0;
  }

  private async calculateBehavioralScore(lead: Lead): Promise<number> {
    // Implement behavioral scoring logic
    return 0;
  }

  private async calculateEngagementScore(lead: Lead): Promise<number> {
    // Implement engagement scoring logic
    return 0;
  }

  private calculateTotalScore(scores: Omit<LeadScore, 'total'>): number {
    // Implement total score calculation logic
    return 0;
  }

  private async executeNurturingSteps(lead: Lead, strategy: ConversionStrategy): Promise<void> {
    // Implement nurturing steps execution logic
  }

  private async updateLeadStatus(lead: Lead, status: string): Promise<void> {
    // Implement lead status update logic
  }

  private async trackInteraction(lead: Lead, interaction: Interaction): Promise<void> {
    // Implement interaction tracking logic
  }

  private async validateConversion(lead: Lead, type: string): Promise<void> {
    // Implement conversion validation logic
  }

  private async executeConversion(lead: Lead, type: string): Promise<void> {
    // Implement conversion execution logic
  }

  private async trackConversion(lead: Lead, type: string): Promise<void> {
    // Implement conversion tracking logic
  }

  private async createCustomer(lead: Lead): Promise<void> {
    // Implement customer creation logic
  }

  private async validateLeadUpdates(updates: any): Promise<void> {
    // Implement lead updates validation logic
  }

  private async generateLeadSummary(filters: any): Promise<any> {
    // Implement lead summary generation logic
    return {};
  }

  private async generateConversionSummary(filters: any): Promise<any> {
    // Implement conversion summary generation logic
    return {};
  }

  private async generateNurturingSummary(filters: any): Promise<any> {
    // Implement nurturing summary generation logic
    return {};
  }

  private async manageAdBudget(payload: any): Promise<AdBudget> {
    const { action, data } = payload;

    switch (action) {
      case 'check_budget':
        return this.checkBudgetStatus();
      case 'allocate_budget':
        return this.allocateBudget(data);
      case 'adjust_allocation':
        return this.adjustAllocation(data);
      case 'reset_budget':
        return this.resetBudget();
      default:
        throw new Error(`Unsupported budget action: ${action}`);
    }
  }

  private async checkBudgetStatus(): Promise<AdBudget> {
    // Check if budget needs to be reset
    if (this.shouldResetBudget()) {
      await this.resetBudget();
    }

    // Update remaining budget
    this.adBudget.remainingBudget = this.adBudget.monthlyBudget - this.adBudget.currentSpend;

    return this.adBudget;
  }

  private async allocateBudget(data: any): Promise<AdBudget> {
    const { channel, amount } = data;

    // Validate allocation
    if (amount > this.adBudget.remainingBudget) {
      throw new Error('Insufficient budget for allocation');
    }

    // Find channel allocation
    const allocation = this.adBudget.allocations.find(a => a.channel === channel);
    if (!allocation) {
      throw new Error(`Channel not found: ${channel}`);
    }

    // Update allocation
    allocation.spent += amount;
    this.adBudget.currentSpend += amount;
    this.adBudget.remainingBudget -= amount;

    return this.adBudget;
  }

  private async adjustAllocation(data: any): Promise<AdBudget> {
    const { channel, newPercentage } = data;

    // Validate percentage
    if (newPercentage < 0 || newPercentage > 100) {
      throw new Error('Invalid percentage value');
    }

    // Find channel allocation
    const allocation = this.adBudget.allocations.find(a => a.channel === channel);
    if (!allocation) {
      throw new Error(`Channel not found: ${channel}`);
    }

    // Calculate adjustment
    const oldPercentage = allocation.percentage;
    const difference = newPercentage - oldPercentage;

    // Update allocation
    allocation.percentage = newPercentage;
    allocation.dailyBudget = (this.adBudget.monthlyBudget * newPercentage) / 100 / 30;

    // Adjust other channels proportionally
    const otherAllocations = this.adBudget.allocations.filter(a => a.channel !== channel);
    const totalOtherPercentage = otherAllocations.reduce((sum, a) => sum + a.percentage, 0);

    otherAllocations.forEach(a => {
      const adjustment = (a.percentage / totalOtherPercentage) * -difference;
      a.percentage += adjustment;
      a.dailyBudget = (this.adBudget.monthlyBudget * a.percentage) / 100 / 30;
    });

    return this.adBudget;
  }

  private async resetBudget(): Promise<AdBudget> {
    // Reset budget
    this.adBudget.currentSpend = 0;
    this.adBudget.remainingBudget = this.adBudget.monthlyBudget;
    this.adBudget.lastReset = new Date();

    // Reset allocations
    this.adBudget.allocations.forEach(allocation => {
      allocation.spent = 0;
      allocation.performance = {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
      };
    });

    // Reset performance
    this.adBudget.performance = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cpa: 0,
      roas: 0,
    };

    return this.adBudget;
  }

  private shouldResetBudget(): boolean {
    const now = new Date();
    const lastReset = new Date(this.adBudget.lastReset);
    return now.getMonth() !== lastReset.getMonth();
  }

  private async createAdCampaign(payload: any): Promise<AdCampaign> {
    const { name, channel, targeting, creatives } = payload;

    // Validate budget
    const allocation = this.adBudget.allocations.find(a => a.channel === channel);
    if (!allocation) {
      throw new Error(`Channel not found: ${channel}`);
    }

    if (allocation.spent >= allocation.dailyBudget) {
      throw new Error('Daily budget limit reached for channel');
    }

    // Create campaign
    const campaign: AdCampaign = {
      id: `campaign-${Date.now()}`,
      name,
      channel,
      status: 'active',
      budget: allocation.dailyBudget,
      spent: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      targeting,
      creatives,
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
      },
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  private async optimizeAdCampaign(payload: any): Promise<AdCampaign> {
    const { campaignId, optimizations } = payload;
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Apply optimizations
    if (optimizations.targeting) {
      campaign.targeting = {
        ...campaign.targeting,
        ...optimizations.targeting,
      };
    }

    if (optimizations.creatives) {
      campaign.creatives = campaign.creatives.map(creative => {
        const optimization = optimizations.creatives.find(c => c.id === creative.id);
        if (optimization) {
          return {
            ...creative,
            ...optimization,
          };
        }
        return creative;
      });
    }

    // Update campaign
    this.campaigns.set(campaignId, campaign);
    return campaign;
  }

  private async trackAdPerformance(payload: any): Promise<AdPerformance> {
    const performance = await super.trackAdPerformance(payload);

    // Check if it's time to adjust budget (every 7 days)
    const daysSinceLastAdjustment = Math.floor(
      (new Date().getTime() - this.budgetScaling.lastAdjustment.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastAdjustment >= 7) {
      await this.adjustBudgetBasedOnPerformance();
    }

    return performance;
  }

  private async adjustBudgetBasedOnPerformance(): Promise<void> {
    const performance = this.adBudget.performance;
    const thresholds = this.budgetScaling.performanceThresholds;
    const factors = this.budgetScaling.scalingFactors;

    // Calculate performance scores
    const conversionScore = this.calculatePerformanceScore(
      performance.conversions / performance.clicks,
      thresholds.conversionRate
    );
    const roasScore = this.calculatePerformanceScore(
      performance.roas,
      thresholds.roas
    );
    const cpaScore = this.calculatePerformanceScore(
      performance.cpa,
      thresholds.cpa,
      true // Lower is better for CPA
    );
    const engagementScore = this.calculatePerformanceScore(
      performance.clicks / performance.impressions,
      thresholds.engagement
    );

    // Calculate budget multiplier
    const budgetMultiplier = this.calculateBudgetMultiplier({
      conversionScore,
      roasScore,
      cpaScore,
      engagementScore,
      factors,
    });

    // Calculate new budget
    const newBudget = Math.min(
      this.budgetScaling.baseBudget * budgetMultiplier,
      this.budgetScaling.maxBudget
    );

    // Update budget if significant change
    if (Math.abs(newBudget - this.budgetScaling.currentBudget) >= 10) {
      await this.updateBudget(newBudget);
    }
  }

  private calculatePerformanceScore(
    value: number,
    thresholds: { excellent: number; good: number; average: number },
    lowerIsBetter: boolean = false
  ): number {
    if (lowerIsBetter) {
      if (value <= thresholds.excellent) return 1.0;
      if (value <= thresholds.good) return 0.7;
      if (value <= thresholds.average) return 0.4;
      return 0.1;
    } else {
      if (value >= thresholds.excellent) return 1.0;
      if (value >= thresholds.good) return 0.7;
      if (value >= thresholds.average) return 0.4;
      return 0.1;
    }
  }

  private calculateBudgetMultiplier(params: {
    conversionScore: number;
    roasScore: number;
    cpaScore: number;
    engagementScore: number;
    factors: ScalingFactors;
  }): number {
    const { conversionScore, roasScore, cpaScore, engagementScore, factors } = params;

    // Calculate weighted multiplier
    const weightedMultiplier =
      (conversionScore * factors.conversionRate +
        roasScore * factors.roas +
        cpaScore * factors.cpa +
        engagementScore * factors.engagement) /
      (factors.conversionRate + factors.roas + factors.cpa + factors.engagement);

    return Math.max(1.0, weightedMultiplier); // Never go below base budget
  }

  private async updateBudget(newBudget: number): Promise<void> {
    const oldBudget = this.budgetScaling.currentBudget;
    this.budgetScaling.currentBudget = newBudget;
    this.budgetScaling.lastAdjustment = new Date();

    // Update ad budget
    this.adBudget.monthlyBudget = newBudget;
    this.adBudget.remainingBudget += (newBudget - oldBudget);

    // Recalculate daily budgets
    this.adBudget.allocations.forEach(allocation => {
      allocation.dailyBudget = (newBudget * allocation.percentage) / 100 / 30;
    });

    // Log budget adjustment
    console.log(`Budget adjusted from $${oldBudget} to $${newBudget} based on performance`);
  }

  // Add method to get budget scaling information
  public async getBudgetScalingInfo(): Promise<{
    currentBudget: number;
    baseBudget: number;
    maxBudget: number;
    lastAdjustment: Date;
    performance: AdPerformance;
  }> {
    return {
      currentBudget: this.budgetScaling.currentBudget,
      baseBudget: this.budgetScaling.baseBudget,
      maxBudget: this.budgetScaling.maxBudget,
      lastAdjustment: this.budgetScaling.lastAdjustment,
      performance: this.adBudget.performance,
    };
  }
} 