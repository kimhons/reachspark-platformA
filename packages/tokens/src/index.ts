import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

// Types
export interface TokenService {
  // Token balance operations
  getTokenBalance: (userId: string) => Promise<number>;
  
  // Token purchase operations
  purchaseTokens: (planId: string, paymentMethodId: string) => Promise<TokenPurchaseResult>;
  
  // Token usage operations
  useTokens: (amount: number, feature: string, metadata?: any) => Promise<TokenUsageResult>;
  
  // Feature-specific token operations
  generateImage: (prompt: string, size?: string, n?: number) => Promise<ImageGenerationResult>;
  scheduleSocialPost: (content: string, platforms: string[], scheduledDate: string, image?: string) => Promise<SocialPostResult>;
  sendEmailCampaign: (name: string, subject: string, content: string, recipients: number) => Promise<EmailCampaignResult>;
  
  // Token history
  getTokenHistory: (userId: string, limit?: number) => Promise<TokenHistoryItem[]>;
}

// Result types
export interface TokenPurchaseResult {
  success: boolean;
  tokens: number;
  message: string;
}

export interface TokenUsageResult {
  success: boolean;
  remainingTokens: number;
  message: string;
}

export interface ImageGenerationResult extends TokenUsageResult {
  imageId: string;
  images: string[];
  tokenCost: number;
}

export interface SocialPostResult extends TokenUsageResult {
  postId: string;
  tokenCost: number;
}

export interface EmailCampaignResult extends TokenUsageResult {
  campaignId: string;
  tokenCost: number;
}

export interface TokenHistoryItem {
  id: string;
  amount: number;
  type: 'purchase' | 'usage';
  feature?: string;
  description: string;
  createdAt: Date;
}

export class FirebaseTokenService implements TokenService {
  private functions;
  private db;
  private userId: string;
  
  constructor(firebaseConfig: any, userId: string) {
    const app = initializeApp(firebaseConfig);
    this.functions = getFunctions(app);
    this.db = getFirestore(app);
    this.userId = userId;
  }
  
  // Token balance operations
  async getTokenBalance(userId: string = this.userId): Promise<number> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      return userDoc.data().tokens || 0;
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }
  
  // Token purchase operations
  async purchaseTokens(planId: string, paymentMethodId: string): Promise<TokenPurchaseResult> {
    try {
      const purchaseTokensFunction = httpsCallable<
        { planId: string; paymentMethodId: string },
        TokenPurchaseResult
      >(this.functions, 'purchaseTokens');
      
      const result = await purchaseTokensFunction({ planId, paymentMethodId });
      return result.data;
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      throw error;
    }
  }
  
  // Token usage operations
  async useTokens(amount: number, feature: string, metadata?: any): Promise<TokenUsageResult> {
    try {
      const useTokensFunction = httpsCallable<
        { amount: number; feature: string; metadata?: any },
        TokenUsageResult
      >(this.functions, 'useTokens');
      
      const result = await useTokensFunction({ amount, feature, metadata });
      return result.data;
    } catch (error) {
      console.error('Error using tokens:', error);
      throw error;
    }
  }
  
  // Feature-specific token operations
  async generateImage(prompt: string, size: string = '1024x1024', n: number = 1): Promise<ImageGenerationResult> {
    try {
      const generateImageFunction = httpsCallable<
        { prompt: string; size: string; n: number },
        ImageGenerationResult
      >(this.functions, 'generateImage');
      
      const result = await generateImageFunction({ prompt, size, n });
      return result.data;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
  
  async scheduleSocialPost(
    content: string,
    platforms: string[],
    scheduledDate: string,
    image?: string
  ): Promise<SocialPostResult> {
    try {
      const scheduleSocialPostFunction = httpsCallable<
        { content: string; platforms: string[]; scheduledDate: string; image?: string },
        SocialPostResult
      >(this.functions, 'scheduleSocialPost');
      
      const result = await scheduleSocialPostFunction({ content, platforms, scheduledDate, image });
      return result.data;
    } catch (error) {
      console.error('Error scheduling social post:', error);
      throw error;
    }
  }
  
  async sendEmailCampaign(
    name: string,
    subject: string,
    content: string,
    recipients: number
  ): Promise<EmailCampaignResult> {
    try {
      const sendEmailCampaignFunction = httpsCallable<
        { name: string; subject: string; content: string; recipients: number },
        EmailCampaignResult
      >(this.functions, 'sendEmailCampaign');
      
      const result = await sendEmailCampaignFunction({ name, subject, content, recipients });
      return result.data;
    } catch (error) {
      console.error('Error sending email campaign:', error);
      throw error;
    }
  }
  
  // Token history
  async getTokenHistory(userId: string = this.userId, limit: number = 10): Promise<TokenHistoryItem[]> {
    try {
      // Get purchase transactions
      const purchasesSnapshot = await getDoc(doc(this.db, 'transactions', userId));
      const purchases = purchasesSnapshot.exists() 
        ? purchasesSnapshot.data().transactions.map((t: any) => ({
            id: t.id,
            amount: t.tokens,
            type: 'purchase' as const,
            description: `Purchased ${t.tokens} tokens (${t.planName})`,
            createdAt: t.createdAt.toDate()
          }))
        : [];
      
      // Get token usage
      const usageSnapshot = await getDoc(doc(this.db, 'tokenUsage', userId));
      const usage = usageSnapshot.exists()
        ? usageSnapshot.data().usage.map((u: any) => ({
            id: u.id,
            amount: -u.amount,
            type: 'usage' as const,
            feature: u.feature,
            description: this.getUsageDescription(u.feature, u.amount, u.metadata),
            createdAt: u.createdAt.toDate()
          }))
        : [];
      
      // Combine and sort by date
      const history = [...purchases, ...usage].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Apply limit
      return history.slice(0, limit);
    } catch (error) {
      console.error('Error getting token history:', error);
      throw error;
    }
  }
  
  // Helper method to generate usage descriptions
  private getUsageDescription(feature: string, amount: number, metadata: any): string {
    switch (feature) {
      case 'image-generation':
        return `Generated ${metadata.n} image${metadata.n > 1 ? 's' : ''} (${metadata.size})`;
      case 'social-media-scheduling':
        return `Scheduled post to ${metadata.platforms.join(', ')}`;
      case 'email-campaign':
        return `Sent email campaign to ${metadata.recipients} recipients`;
      default:
        return `Used ${amount} tokens for ${feature}`;
    }
  }
}

// Factory function to create token service
export function createTokenService(firebaseConfig: any, userId: string): TokenService {
  return new FirebaseTokenService(firebaseConfig, userId);
}

export default createTokenService;
