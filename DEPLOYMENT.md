# Deployment Guide for ReachSpark Platform

This comprehensive guide provides detailed instructions for deploying the ReachSpark platform to production environments.

## Prerequisites

### Required Accounts
- Firebase account with Blaze plan (pay-as-you-go)
- Google Cloud Platform account
- Stripe account for payment processing
- OpenAI, Gemini, and/or Claude accounts for AI services

### Required Tools
- Node.js 18.x or later
- pnpm 8.6.0 or later
- Firebase CLI (`npm install -g firebase-tools`)
- Git

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/kimhons/reachspark-firebase.git
cd reachspark-firebase
git checkout sync-enhanced-df
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables

Create the following environment files with appropriate values:

#### .env.development
For local development environment:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_dev_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_dev_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_dev_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_dev_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_dev_measurement_id

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=your_test_webhook_secret

OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
CLAUDE_API_KEY=your_claude_key
```

#### .env.production
For production environment:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_prod_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_prod_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_prod_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_prod_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_prod_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_prod_measurement_id

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=your_live_webhook_secret

OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
CLAUDE_API_KEY=your_claude_key
```

### 4. Firebase Project Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "reachspark-prod")
4. Enable Google Analytics
5. Select or create a Google Analytics account
6. Click "Create project"

#### Configure Firebase Services
1. **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Email/Password, Google, and any other providers you need

2. **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode
   - Choose a location close to your users

3. **Storage**:
   - Go to Storage
   - Click "Get started"
   - Choose a location close to your users

4. **Functions**:
   - Ensure you're on the Blaze plan
   - Go to Functions
   - Click "Get started" if prompted

#### Configure .firebaserc
Create or update `.firebaserc` file:
```json
{
  "projects": {
    "default": "your-firebase-project-id",
    "production": "your-firebase-project-id",
    "staging": "your-firebase-staging-project-id"
  }
}
```

## Deployment Process

### 1. Build the Project
```bash
pnpm run build
```

### 2. Deploy to Firebase

#### Deploy Everything
```bash
firebase deploy
```

#### Deploy Specific Components
```bash
# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy only firestore rules
firebase deploy --only firestore:rules

# Deploy only storage rules
firebase deploy --only storage:rules
```

### 3. Verify Deployment
1. Check Firebase console for successful deployment
2. Visit your deployed site at `https://your-project-id.web.app`
3. Test authentication and core functionality
4. Verify Firestore security rules are working correctly

## Stripe Integration Setup

### 1. Configure Stripe Webhooks
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers > Webhooks
3. Click "Add endpoint"
4. Enter your webhook URL: `https://your-project-id.web.app/api/webhooks/stripe`
5. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy the webhook signing secret and add it to your environment variables

### 2. Configure Stripe Products and Prices
1. Go to Products > Add Product
2. Create products for each subscription tier:
   - Free
   - Starter
   - Professional
   - Enterprise
3. For each product, create recurring prices with the appropriate billing interval
4. Create products for token packages with one-time prices
5. Note the product and price IDs for use in your application

## AI Service Integration

### OpenAI Setup
1. Obtain API key from [OpenAI Platform](https://platform.openai.com/)
2. Add key to environment variables
3. Configure rate limits and budget alerts

### Gemini Setup
1. Obtain API key from [Google AI Studio](https://makersuite.google.com/)
2. Add key to environment variables
3. Configure rate limits and budget alerts

### Claude Setup
1. Obtain API key from [Anthropic Console](https://console.anthropic.com/)
2. Add key to environment variables
3. Configure rate limits and budget alerts

## Monitoring and Maintenance

### Firebase Monitoring
1. Set up Firebase Performance Monitoring
2. Configure Firebase Crashlytics
3. Set up Firebase Analytics events for key user actions

### Logging
1. Use Firebase Functions logs for server-side monitoring
2. Set up log-based alerts for critical errors

### Backups
1. Set up regular Firestore backups
2. Configure automated exports to Google Cloud Storage

## Scaling Considerations

### Functions Scaling
- Configure minimum and maximum instances for critical functions
- Use regional deployment for lower latency
- Consider dedicated instances for high-traffic functions

### Database Scaling
- Set up database sharding for high-volume collections
- Use composite indexes for complex queries
- Implement caching for frequently accessed data

### Cost Optimization
- Use Firestore TTL for temporary data
- Implement batching for bulk operations
- Monitor usage and adjust resources accordingly

## Troubleshooting

### Common Deployment Issues
1. **Functions fail to deploy**:
   - Check for syntax errors in functions code
   - Verify all dependencies are correctly installed
   - Check Firebase CLI version is up to date

2. **Authentication issues**:
   - Verify Firebase Auth configuration
   - Check domain authorization settings
   - Confirm API keys are correctly set in environment variables

3. **Database permission errors**:
   - Review Firestore security rules
   - Check authentication state when accessing database
   - Verify user roles and permissions

### Support Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)

## Rollback Procedures

### How to Rollback Functions
```bash
firebase functions:rollback
```

### How to Rollback Hosting
```bash
firebase hosting:rollback
```

### How to Restore Firestore Data
1. Go to Firebase Console > Firestore
2. Navigate to Backups
3. Select the backup to restore
4. Follow the restoration procedure

## Security Best Practices

1. Regularly rotate API keys and secrets
2. Review and update Firestore security rules
3. Implement rate limiting for public APIs
4. Use Firebase App Check to prevent abuse
5. Enable Firebase Security Rules for Storage

## Conclusion

This deployment guide provides a comprehensive approach to deploying the ReachSpark platform. Follow these instructions carefully to ensure a successful deployment. For any issues or questions, refer to the troubleshooting section or contact the development team.

Remember to test thoroughly in a staging environment before deploying to production, and always have a rollback plan in case of unexpected issues.
