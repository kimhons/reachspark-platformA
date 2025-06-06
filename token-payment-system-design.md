# Token-Based Payment System Design for ReachSpark

## Overview

This document outlines the design for a token-based payment system for the ReachSpark platform. The system will allow users to purchase tokens that can be spent on various platform features, providing flexibility, transparency, and scalability.

## System Requirements

1. **Token Economy**: Users purchase tokens that can be spent on platform features
2. **Tiered Subscription Plans**: Different subscription levels with varying token allocations
3. **Pay-as-you-go Option**: Ability to purchase additional tokens beyond subscription allocation
4. **Usage Tracking**: Accurate tracking of token consumption across all platform features
5. **Transparent Pricing**: Clear token costs for each feature/action
6. **Automated Billing**: Seamless integration with payment processor
7. **Usage Analytics**: Reporting on token consumption patterns
8. **Quota Management**: Preventing usage beyond available tokens

## Token Economy Design

### Token Value and Pricing

- **Base Token Value**: 1 token = $0.10 USD (configurable)
- **Bulk Purchase Discounts**:
  - 100 tokens: $10 (no discount)
  - 500 tokens: $45 (10% discount)
  - 1,000 tokens: $80 (20% discount)
  - 5,000 tokens: $350 (30% discount)

### Subscription Tiers

| Plan | Monthly Price | Monthly Tokens | Additional Benefits |
|------|---------------|----------------|---------------------|
| Free | $0 | 20 | Basic features only |
| Starter | $29 | 300 | All features, standard priority |
| Professional | $79 | 1,000 | All features, high priority |
| Enterprise | $299 | 5,000 | All features, highest priority, dedicated support |

### Token Consumption Rates

#### Content Generation
- Text content generation (short): 1 token
- Text content generation (medium): 3 tokens
- Text content generation (long): 5 tokens
- Image generation (DALL-E 3): 10 tokens
- Video thumbnail generation: 5 tokens

#### Marketing Actions
- Social media post scheduling: 2 tokens
- Email campaign creation: 5 tokens
- Email sent (per recipient): 0.1 tokens
- Website page creation: 10 tokens
- SEO analysis: 5 tokens
- Performance report generation: 3 tokens

#### Advanced Features
- AI marketing strategy: 20 tokens
- Campaign optimization: 15 tokens
- Competitor analysis: 25 tokens
- Custom audience targeting: 10 tokens

## Technical Architecture

### Database Schema (Firestore)

#### Users Collection
```
users/{userId}
  - email: string
  - displayName: string
  - createdAt: timestamp
  - subscriptionTier: string (free, starter, professional, enterprise)
  - subscriptionStatus: string (active, canceled, past_due)
  - subscriptionId: string (Stripe subscription ID)
  - customerId: string (Stripe customer ID)
  - tokenBalance: number
  - tokensConsumed: number
  - tokensRefillDate: timestamp
```

#### Transactions Collection
```
transactions/{transactionId}
  - userId: string
  - type: string (purchase, consumption, refill)
  - amount: number
  - description: string
  - feature: string
  - timestamp: timestamp
  - paymentId: string (for purchases)
  - status: string (completed, pending, failed)
```

#### Products Collection
```
products/{productId}
  - name: string
  - description: string
  - type: string (subscription, token_pack)
  - active: boolean
  - price: number
  - currency: string
  - tokenAmount: number (for token packs)
  - stripeProductId: string
  - stripePriceId: string
```

#### Features Collection
```
features/{featureId}
  - name: string
  - description: string
  - category: string
  - tokenCost: number
  - availableTiers: array<string>
  - active: boolean
```

### Firebase Functions

#### Authentication and User Management
- `createUserRecord`: Creates user record in Firestore when a new user signs up
- `updateUserSubscription`: Updates user subscription details when changed

#### Token Management
- `purchaseTokens`: Processes token purchase requests
- `consumeTokens`: Deducts tokens when features are used
- `checkTokenBalance`: Verifies if user has sufficient tokens for an action
- `refillSubscriptionTokens`: Automatically refills tokens for subscription users

#### Stripe Integration
- `createCheckoutSession`: Creates Stripe checkout session for token purchases
- `handleStripeWebhook`: Processes Stripe webhook events
- `createSubscription`: Handles subscription creation
- `updateSubscription`: Manages subscription changes
- `cancelSubscription`: Processes subscription cancellations

### Client-Side Implementation

#### Token Balance Display
- Prominent display of current token balance in the UI header
- Visual indicators when balance is low

#### Purchase Flow
1. User clicks "Buy Tokens" button
2. Modal displays available token packages
3. User selects desired package
4. Stripe Checkout is launched
5. Upon successful payment, token balance is updated immediately

#### Subscription Management
- Interface for viewing current subscription
- Options to upgrade/downgrade
- Clear display of token allocation and renewal date

#### Usage Tracking
- Dashboard showing token consumption by feature
- Historical usage patterns
- Projected usage based on current patterns

## Integration with Stripe

### Products and Prices Setup

1. **Subscription Products**:
   - Create a product for each subscription tier in Stripe
   - Set up recurring prices with the appropriate billing interval

2. **Token Pack Products**:
   - Create products for each token package
   - Set up one-time prices for each package

### Metered Billing for Enterprise

For enterprise customers with variable usage:
- Use Stripe's metered billing
- Report usage to Stripe based on token consumption
- Set up tiered pricing based on volume

### Webhook Events to Monitor

- `checkout.session.completed`: Process successful payments
- `invoice.paid`: Update subscription status and token balance
- `invoice.payment_failed`: Handle failed payments
- `customer.subscription.updated`: Update subscription details
- `customer.subscription.deleted`: Handle cancellations

## Implementation Plan

### Phase 1: Core Infrastructure
1. Set up Firestore schema
2. Create Stripe products and prices
3. Implement basic token purchase and consumption functions
4. Develop token balance display in UI

### Phase 2: Subscription Management
1. Implement subscription creation and management
2. Develop automatic token refills
3. Create subscription management UI

### Phase 3: Advanced Features
1. Implement usage analytics
2. Develop predictive usage patterns
3. Create administrative reporting tools
4. Implement quota management and alerts

## Security Considerations

1. **Server-Side Validation**: All token consumption must be validated server-side
2. **Concurrency Control**: Prevent race conditions when updating token balances
3. **Audit Logging**: Maintain detailed logs of all token transactions
4. **Encryption**: Secure storage of payment information
5. **Access Control**: Strict permissions for token management functions

## Monitoring and Maintenance

1. **Balance Alerts**: Notify users when token balance is low
2. **Usage Anomalies**: Monitor for unusual consumption patterns
3. **Error Tracking**: Log and alert on payment processing errors
4. **Performance Monitoring**: Track response times for payment functions
5. **Regular Audits**: Reconcile token balances with transaction history

## Conclusion

This token-based payment system provides ReachSpark with a flexible, scalable monetization strategy. By assigning token costs to different features, we create a transparent pricing model that allows users to pay for what they use while providing predictable revenue through subscriptions.

The implementation leverages Firebase and Stripe to create a robust, secure payment infrastructure that can scale with the platform's growth. The modular design allows for easy adjustments to pricing and the addition of new features as the platform evolves.
