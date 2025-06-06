import { BaseAgent } from './BaseAgent';
import {
  AgentOperation,
  AgentType,
  OperationStatus,
  AlertType,
  AlertSeverity,
} from './types';
import { Token, TokenType } from '../tokens/types';

interface SocialMediaConfig {
  platforms: {
    [key: string]: {
      enabled: boolean;
      apiKey?: string;
      apiSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      rateLimit: number;
      cooldown: number;
    };
  };
  scheduling: {
    maxPostsPerDay: number;
    optimalPostingTimes: string[];
    timezone: string;
  };
  analytics: {
    trackingEnabled: boolean;
    metrics: string[];
    updateInterval: number;
  };
}

interface PostResult {
  id: string;
  platform: string;
  content: string;
  status: 'published' | 'scheduled' | 'failed';
  metrics?: {
    reach: number;
    engagement: number;
    clicks: number;
    shares: number;
  };
  timestamp: Date;
}

export class SocialMediaAgent extends BaseAgent {
  private socialConfig: SocialMediaConfig;
  private postHistory: Map<string, PostResult[]>;
  private platformMetrics: Map<string, any>;
  private optimalPostingSchedule: Map<string, Date[]>;

  constructor(config: any) {
    super({
      ...config,
      type: AgentType.SOCIAL_MEDIA,
      capabilities: [
        {
          name: 'social_posting',
          description: 'Post content to multiple social media platforms',
          requiredTokens: [
            { type: TokenType.SOCIAL_MEDIA, id: 'twitter', amount: 1 },
            { type: TokenType.SOCIAL_MEDIA, id: 'facebook', amount: 1 },
            { type: TokenType.SOCIAL_MEDIA, id: 'linkedin', amount: 1 },
          ],
          maxConcurrentOperations: 3,
        },
      ],
    });

    this.socialConfig = {
      platforms: {
        twitter: {
          enabled: true,
          rateLimit: 50,
          cooldown: 3600,
        },
        facebook: {
          enabled: true,
          rateLimit: 30,
          cooldown: 7200,
        },
        linkedin: {
          enabled: true,
          rateLimit: 20,
          cooldown: 86400,
        },
      },
      scheduling: {
        maxPostsPerDay: 10,
        optimalPostingTimes: ['09:00', '12:00', '15:00', '18:00'],
        timezone: 'UTC',
      },
      analytics: {
        trackingEnabled: true,
        metrics: ['reach', 'engagement', 'clicks', 'shares'],
        updateInterval: 3600,
      },
    };

    this.postHistory = new Map();
    this.platformMetrics = new Map();
    this.optimalPostingSchedule = new Map();
    this.initializePostingSchedule();
  }

  protected async executeOperation(operation: AgentOperation): Promise<PostResult> {
    const { content, platform, scheduleTime } = operation.payload;
    
    // Validate platform and content
    if (!this.isValidPlatform(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    if (!this.isValidContent(content, platform)) {
      throw new Error(`Invalid content for platform: ${platform}`);
    }

    // Check rate limits and cooldown
    if (!this.canPostToPlatform(platform)) {
      throw new Error(`Rate limit or cooldown active for platform: ${platform}`);
    }

    // Post content
    const result = await this.postToPlatform(platform, content, scheduleTime);
    
    // Update history and metrics
    this.updatePostHistory(platform, result);
    await this.updatePlatformMetrics(platform, result);

    return result;
  }

  protected validateOperation(operation: AgentOperation): boolean {
    const { content, platform } = operation.payload;
    return (
      typeof content === 'string' &&
      content.length > 0 &&
      typeof platform === 'string' &&
      this.isValidPlatform(platform)
    );
  }

  protected async handleError(error: Error, operation: AgentOperation): Promise<void> {
    await this.addAlert({
      id: `error-${Date.now()}`,
      type: AlertType.ERROR,
      severity: AlertSeverity.HIGH,
      message: `Social media posting failed: ${error.message}`,
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

  private async postToPlatform(
    platform: string,
    content: string,
    scheduleTime?: Date
  ): Promise<PostResult> {
    // Implement platform-specific posting logic
    // This is a placeholder for the actual API integration
    const result: PostResult = {
      id: `post-${Date.now()}`,
      platform,
      content,
      status: scheduleTime ? 'scheduled' : 'published',
      timestamp: scheduleTime || new Date(),
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    return result;
  }

  private isValidPlatform(platform: string): boolean {
    return (
      platform in this.socialConfig.platforms &&
      this.socialConfig.platforms[platform].enabled
    );
  }

  private isValidContent(content: string, platform: string): boolean {
    // Platform-specific content validation
    const maxLengths = {
      twitter: 280,
      facebook: 63206,
      linkedin: 3000,
    };

    return content.length <= (maxLengths[platform] || 280);
  }

  private canPostToPlatform(platform: string): boolean {
    const config = this.socialConfig.platforms[platform];
    const lastPost = this.getLastPostTime(platform);
    
    if (!lastPost) return true;

    const timeSinceLastPost = Date.now() - lastPost.getTime();
    return timeSinceLastPost >= config.cooldown * 1000;
  }

  private getLastPostTime(platform: string): Date | null {
    const history = this.postHistory.get(platform) || [];
    if (history.length === 0) return null;
    return history[history.length - 1].timestamp;
  }

  private updatePostHistory(platform: string, result: PostResult): void {
    const history = this.postHistory.get(platform) || [];
    history.push(result);
    this.postHistory.set(platform, history);
  }

  private async updatePlatformMetrics(platform: string, result: PostResult): Promise<void> {
    // Implement metrics tracking
    const metrics = this.platformMetrics.get(platform) || {};
    this.platformMetrics.set(platform, {
      ...metrics,
      lastUpdate: new Date(),
      totalPosts: (metrics.totalPosts || 0) + 1,
    });
  }

  private initializePostingSchedule(): void {
    const { optimalPostingTimes, timezone } = this.socialConfig.scheduling;
    
    Object.keys(this.socialConfig.platforms).forEach(platform => {
      const schedule = optimalPostingTimes.map(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      });
      
      this.optimalPostingSchedule.set(platform, schedule);
    });
  }

  public async optimizePostingSchedule(): Promise<void> {
    // Analyze post performance and adjust optimal posting times
    Object.keys(this.socialConfig.platforms).forEach(platform => {
      const history = this.postHistory.get(platform) || [];
      const performanceByHour = new Map<number, number>();

      history.forEach(post => {
        const hour = post.timestamp.getHours();
        const performance = post.metrics?.engagement || 0;
        performanceByHour.set(hour, (performanceByHour.get(hour) || 0) + performance);
      });

      // Update optimal posting times based on performance
      const optimalHours = Array.from(performanceByHour.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([hour]) => `${hour.toString().padStart(2, '0')}:00`);

      this.socialConfig.scheduling.optimalPostingTimes = optimalHours;
    });
  }

  public getPostHistory(platform?: string): PostResult[] {
    if (platform) {
      return this.postHistory.get(platform) || [];
    }
    return Array.from(this.postHistory.values()).flat();
  }

  public getPlatformMetrics(platform: string): any {
    return this.platformMetrics.get(platform) || {};
  }

  public getOptimalPostingTimes(platform: string): Date[] {
    return this.optimalPostingSchedule.get(platform) || [];
  }

  public getSocialConfig(): SocialMediaConfig {
    return { ...this.socialConfig };
  }
} 