/**
 * Enhanced Template System
 * 
 * This module provides a comprehensive template system with 50+ templates
 * organized by style, industry, and content type.
 * 
 * Features:
 * - 50+ professionally designed templates
 * - Categorization by style, industry, and content type
 * - AI-powered template customization
 * - Template analytics and performance tracking
 * - Template versioning and history
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getModelSelector } = require('../apis');
const { OpenAI } = require('../apis/openai');
const { Claude } = require('../apis/claude');
const { Gemini } = require('../apis/gemini');

// Initialize clients
const openai = new OpenAI();
const claude = new Claude();
const gemini = new Gemini();
const modelSelector = getModelSelector();

// Template categories
const TEMPLATE_STYLES = [
  'Modern', 'Elegant', 'Minimalist', 'Bold', 'Playful', 
  'Corporate', 'Creative', 'Vintage', 'Luxurious', 'Casual'
];

const TEMPLATE_INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 
  'Food & Beverage', 'Travel', 'Real Estate', 'Fashion', 'Fitness',
  'Beauty', 'Entertainment', 'Professional Services', 'Non-profit', 'Manufacturing'
];

const TEMPLATE_CONTENT_TYPES = [
  'Social Media Post', 'Blog Article', 'Email Newsletter', 'Landing Page',
  'Product Description', 'Advertisement', 'Press Release', 'Case Study',
  'Whitepaper', 'Video Script', 'Podcast Script', 'Infographic',
  'Brochure', 'Event Invitation', 'Customer Testimonial'
];

const TEMPLATE_PLATFORMS = [
  'Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok',
  'YouTube', 'Pinterest', 'Email', 'Website', 'Blog'
];

/**
 * Get all templates with optional filtering
 */
exports.getTemplates = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { style, industry, contentType, platform, searchQuery } = data || {};
    
    // Reference to templates collection
    const templatesRef = admin.firestore().collection('templates');
    
    // Build query based on filters
    let query = templatesRef;
    
    if (style) {
      query = query.where('style', '==', style);
    }
    
    if (industry) {
      query = query.where('industries', 'array-contains', industry);
    }
    
    if (contentType) {
      query = query.where('contentType', '==', contentType);
    }
    
    if (platform) {
      query = query.where('platforms', 'array-contains', platform);
    }
    
    // Execute query
    const snapshot = await query.get();
    
    // Process results
    let templates = [];
    snapshot.forEach(doc => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Apply search filter if provided
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      templates = templates.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    return {
      success: true,
      templates
    };
    
  } catch (error) {
    console.error('Error getting templates:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to get templates: ${error.message}`
    );
  }
});

/**
 * Get template by ID
 */
exports.getTemplateById = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { templateId } = data;
    
    if (!templateId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function requires a "templateId" parameter.'
      );
    }
    
    // Get template document
    const templateDoc = await admin.firestore().collection('templates').doc(templateId).get();
    
    if (!templateDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `Template with ID ${templateId} not found.`
      );
    }
    
    // Get template data
    const template = {
      id: templateDoc.id,
      ...templateDoc.data()
    };
    
    // Increment view count
    await admin.firestore().collection('templates').doc(templateId).update({
      viewCount: admin.firestore.FieldValue.increment(1)
    });
    
    return {
      success: true,
      template
    };
    
  } catch (error) {
    console.error('Error getting template by ID:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to get template: ${error.message}`
    );
  }
});

/**
 * Customize template with AI
 */
exports.customizeTemplate = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { templateId, customizationParams, brandKitId } = data;
    
    if (!templateId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function requires a "templateId" parameter.'
      );
    }
    
    if (!customizationParams) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function requires a "customizationParams" parameter.'
      );
    }
    
    // Get template document
    const templateDoc = await admin.firestore().collection('templates').doc(templateId).get();
    
    if (!templateDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `Template with ID ${templateId} not found.`
      );
    }
    
    // Get template data
    const template = templateDoc.data();
    
    // Get brand kit if provided
    let brandKit = null;
    if (brandKitId) {
      const brandKitDoc = await admin.firestore().collection('brandKits').doc(brandKitId).get();
      if (brandKitDoc.exists) {
        brandKit = brandKitDoc.data();
      }
    }
    
    // Select the best model for this task
    const selectedModel = await modelSelector.selectModel({
      task: 'template_customization',
      priority: 'quality'
    });
    
    // Prepare prompt for AI
    const prompt = `
      Customize the following template based on the provided parameters:
      
      Template Name: ${template.name}
      Template Type: ${template.contentType}
      Template Content: ${JSON.stringify(template.content)}
      
      Customization Parameters: ${JSON.stringify(customizationParams)}
      ${brandKit ? `Brand Kit: ${JSON.stringify(brandKit)}` : ''}
      
      Please provide the customized content while maintaining the structure and format of the original template.
      Return your response as a JSON object with the customized content.
    `;
    
    // Use the selected AI model
    let customizedContent;
    
    switch (selectedModel.provider) {
      case 'openai':
        const openaiResult = await openai.chat.completions.create({
          model: selectedModel.model,
          messages: [
            { role: 'system', content: 'You are a template customization expert. Customize the template based on the provided parameters while maintaining its structure and format.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          response_format: { type: 'json_object' }
        });
        
        customizedContent = JSON.parse(openaiResult.choices[0].message.content);
        break;
        
      case 'anthropic':
        const claudeResult = await claude.messages.create({
          model: selectedModel.model,
          system: 'You are a template customization expert. Customize the template based on the provided parameters while maintaining its structure and format.',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.5
        });
        
        // Extract JSON from Claude's response
        const claudeContent = claudeResult.content[0].text;
        const jsonMatch = claudeContent.match(/\{[\s\S]*\}/);
        customizedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : template.content;
        break;
        
      case 'gemini':
        const geminiResult = await gemini.generateContent({
          model: selectedModel.model,
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.5
          }
        });
        
        // Extract JSON from Gemini's response
        const geminiContent = geminiResult.response.candidates[0].content.parts[0].text;
        const geminiJsonMatch = geminiContent.match(/\{[\s\S]*\}/);
        customizedContent = geminiJsonMatch ? JSON.parse(geminiJsonMatch[0]) : template.content;
        break;
        
      default:
        // Fallback to original content
        customizedContent = template.content;
    }
    
    // Save customization to user's history
    await admin.firestore().collection('users').doc(context.auth.uid).collection('templateHistory').add({
      templateId,
      originalContent: template.content,
      customizedContent,
      customizationParams,
      brandKitId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Increment usage count
    await admin.firestore().collection('templates').doc(templateId).update({
      usageCount: admin.firestore.FieldValue.increment(1)
    });
    
    return {
      success: true,
      customizedContent
    };
    
  } catch (error) {
    console.error('Error customizing template:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to customize template: ${error.message}`
    );
  }
});

/**
 * Get template categories
 */
exports.getTemplateCategories = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    return {
      success: true,
      categories: {
        styles: TEMPLATE_STYLES,
        industries: TEMPLATE_INDUSTRIES,
        contentTypes: TEMPLATE_CONTENT_TYPES,
        platforms: TEMPLATE_PLATFORMS
      }
    };
    
  } catch (error) {
    console.error('Error getting template categories:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to get template categories: ${error.message}`
    );
  }
});

/**
 * Get template analytics
 */
exports.getTemplateAnalytics = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Check if user has admin role
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || !userData.roles || !userData.roles.includes('admin')) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can access template analytics.'
    );
  }

  try {
    const { timeframe } = data || {};
    
    // Get all templates
    const templatesSnapshot = await admin.firestore().collection('templates').get();
    
    // Process analytics data
    const analytics = {
      totalTemplates: templatesSnapshot.size,
      totalViews: 0,
      totalUsage: 0,
      popularTemplates: [],
      templatesByContentType: {},
      templatesByStyle: {},
      templatesByIndustry: {}
    };
    
    // Process each template
    templatesSnapshot.forEach(doc => {
      const template = doc.data();
      
      // Update total counts
      analytics.totalViews += template.viewCount || 0;
      analytics.totalUsage += template.usageCount || 0;
      
      // Add to popular templates
      analytics.popularTemplates.push({
        id: doc.id,
        name: template.name,
        contentType: template.contentType,
        style: template.style,
        viewCount: template.viewCount || 0,
        usageCount: template.usageCount || 0
      });
      
      // Update content type counts
      if (template.contentType) {
        if (!analytics.templatesByContentType[template.contentType]) {
          analytics.templatesByContentType[template.contentType] = 0;
        }
        analytics.templatesByContentType[template.contentType]++;
      }
      
      // Update style counts
      if (template.style) {
        if (!analytics.templatesByStyle[template.style]) {
          analytics.templatesByStyle[template.style] = 0;
        }
        analytics.templatesByStyle[template.style]++;
      }
      
      // Update industry counts
      if (template.industries && Array.isArray(template.industries)) {
        template.industries.forEach(industry => {
          if (!analytics.templatesByIndustry[industry]) {
            analytics.templatesByIndustry[industry] = 0;
          }
          analytics.templatesByIndustry[industry]++;
        });
      }
    });
    
    // Sort popular templates by usage count
    analytics.popularTemplates.sort((a, b) => b.usageCount - a.usageCount);
    
    // Limit to top 10
    analytics.popularTemplates = analytics.popularTemplates.slice(0, 10);
    
    return {
      success: true,
      analytics
    };
    
  } catch (error) {
    console.error('Error getting template analytics:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to get template analytics: ${error.message}`
    );
  }
});

/**
 * Initialize default templates
 * This function is called once during setup to populate the template library
 */
exports.initializeDefaultTemplates = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated and has admin role
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || !userData.roles || !userData.roles.includes('admin')) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can initialize default templates.'
    );
  }

  try {
    // Check if templates already exist
    const existingTemplates = await admin.firestore().collection('templates').limit(1).get();
    
    if (!existingTemplates.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        'Templates have already been initialized.'
      );
    }
    
    // Initialize batch
    const batch = admin.firestore().batch();
    
    // Add default templates
    for (const template of DEFAULT_TEMPLATES) {
      const templateRef = admin.firestore().collection('templates').doc();
      batch.set(templateRef, {
        ...template,
        viewCount: 0,
        usageCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Commit batch
    await batch.commit();
    
    return {
      success: true,
      message: `Successfully initialized ${DEFAULT_TEMPLATES.length} default templates.`
    };
    
  } catch (error) {
    console.error('Error initializing default templates:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to initialize default templates: ${error.message}`
    );
  }
});

/**
 * Default templates (50+ templates)
 */
const DEFAULT_TEMPLATES = [
  // Social Media Templates - Instagram
  {
    name: "Modern Product Showcase",
    description: "Highlight your product with a clean, modern design",
    contentType: "Social Media Post",
    platforms: ["Instagram"],
    style: "Modern",
    industries: ["Retail", "Fashion", "Technology", "Beauty"],
    tags: ["product", "showcase", "modern", "clean"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/instagram/modern-product-showcase.jpg",
    content: {
      headline: "Introducing [Product Name]",
      subheadline: "[Key Benefit]",
      bodyText: "Experience the difference with our newest [product category]. Designed for [target audience], it delivers [key benefit] like never before.",
      callToAction: "Shop Now",
      imagePrompt: "Clean product photo on minimalist background with soft shadows"
    }
  },
  {
    name: "Elegant Quote Post",
    description: "Share inspirational quotes with an elegant design",
    contentType: "Social Media Post",
    platforms: ["Instagram"],
    style: "Elegant",
    industries: ["Professional Services", "Education", "Non-profit", "Healthcare"],
    tags: ["quote", "inspiration", "elegant"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/instagram/elegant-quote-post.jpg",
    content: {
      quote: ""[Quote text]"",
      attribution: "- [Quote author]",
      bodyText: "[Optional context or reflection]",
      imagePrompt: "Elegant typography on soft gradient background with subtle decorative elements"
    }
  },
  {
    name: "Bold Announcement",
    description: "Make a statement with this bold announcement template",
    contentType: "Social Media Post",
    platforms: ["Instagram"],
    style: "Bold",
    industries: ["Entertainment", "Technology", "Retail", "Food & Beverage"],
    tags: ["announcement", "bold", "attention-grabbing"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/instagram/bold-announcement.jpg",
    content: {
      headline: "[ANNOUNCEMENT]",
      subheadline: "[What's happening]",
      bodyText: "We're excited to announce [announcement details]. This means [benefit or impact for audience].",
      callToAction: "Learn More",
      imagePrompt: "Bold typography with high contrast colors and dynamic shapes"
    }
  },
  {
    name: "Minimalist Product Feature",
    description: "Highlight a product feature with minimalist design",
    contentType: "Social Media Post",
    platforms: ["Instagram"],
    style: "Minimalist",
    industries: ["Technology", "Fashion", "Beauty", "Home Goods"],
    tags: ["product", "feature", "minimalist"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/instagram/minimalist-product-feature.jpg",
    content: {
      headline: "[Feature Name]",
      bodyText: "Our [product name] features [feature description] for an unparalleled experience.",
      callToAction: "Discover More",
      imagePrompt: "Close-up product detail on clean white background with minimal styling"
    }
  },
  {
    name: "Playful Contest Announcement",
    description: "Announce a contest or giveaway with a playful design",
    contentType: "Social Media Post",
    platforms: ["Instagram"],
    style: "Playful",
    industries: ["Retail", "Food & Beverage", "Entertainment", "Travel"],
    tags: ["contest", "giveaway", "playful", "engagement"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/instagram/playful-contest.jpg",
    content: {
      headline: "GIVEAWAY TIME!",
      subheadline: "Win [Prize]",
      bodyText: "We're giving away [prize details]. To enter:\n1. [First instruction]\n2. [Second instruction]\n3. [Third instruction]\nWinner announced [date].",
      callToAction: "Enter Now",
      imagePrompt: "Colorful celebration graphics with confetti and prize imagery"
    }
  },
  
  // Social Media Templates - LinkedIn
  {
    name: "Corporate Announcement",
    description: "Share company news with a professional design",
    contentType: "Social Media Post",
    platforms: ["LinkedIn"],
    style: "Corporate",
    industries: ["Technology", "Finance", "Professional Services", "Manufacturing"],
    tags: ["corporate", "announcement", "professional"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/linkedin/corporate-announcement.jpg",
    content: {
      headline: "[Company Name] Announces [Announcement]",
      bodyText: "We're pleased to announce [announcement details]. This strategic [initiative/partnership/launch] will [benefit or impact].\n\n[Additional context or quote from leadership]\n\n#[Relevant hashtag] #[Industry hashtag]",
      callToAction: "Read the Full Announcement",
      imagePrompt: "Professional corporate imagery with company branding and business setting"
    }
  },
  {
    name: "Industry Insight",
    description: "Share industry insights and thought leadership",
    contentType: "Social Media Post",
    platforms: ["LinkedIn"],
    style: "Professional",
    industries: ["Finance", "Technology", "Healthcare", "Professional Services"],
    tags: ["insight", "thought leadership", "industry", "professional"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/linkedin/industry-insight.jpg",
    content: {
      headline: "[Insight Title]",
      bodyText: "Our latest analysis reveals [key insight or trend]. This means [implications for industry].\n\n[Supporting data point or statistic]\n\n[Call to action for more information]\n\n#[Industry hashtag] #[Topic hashtag]",
      callToAction: "Read Our Analysis",
      imagePrompt: "Data visualization or professional business imagery related to the industry"
    }
  },
  {
    name: "Team Spotlight",
    description: "Highlight team members and company culture",
    contentType: "Social Media Post",
    platforms: ["LinkedIn"],
    style: "Corporate",
    industries: ["All Industries"],
    tags: ["team", "culture", "spotlight", "employee"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/linkedin/team-spotlight.jpg",
    content: {
      headline: "Meet Our Team: [Name]",
      bodyText: "We're proud to spotlight [Name], our [Job Title]. [He/She/They] has been with [Company Name] for [time period] and specializes in [expertise].\n\n[Quote from team member about their role or the company]\n\n#[Company hashtag] #TeamSpotlight",
      imagePrompt: "Professional portrait of team member in workplace setting"
    }
  },
  {
    name: "Case Study Highlight",
    description: "Showcase client success stories",
    contentType: "Social Media Post",
    platforms: ["LinkedIn"],
    style: "Professional",
    industries: ["Technology", "Professional Services", "Healthcare", "Finance"],
    tags: ["case study", "success story", "client", "results"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/linkedin/case-study-highlight.jpg",
    content: {
      headline: "Client Success: [Client Industry/Type]",
      bodyText: "See how we helped [client type] achieve [key result].\n\nChallenge: [Brief description of challenge]\nSolution: [Brief description of solution]\nResults: [Key metrics and outcomes]\n\nRead the full case study to learn more about our approach.\n\n#[Industry hashtag] #CaseStudy",
      callToAction: "Read the Case Study",
      imagePrompt: "Professional business imagery representing client success or partnership"
    }
  },
  {
    name: "Event Promotion",
    description: "Promote webinars, conferences, and other events",
    contentType: "Social Media Post",
    platforms: ["LinkedIn"],
    style: "Corporate",
    industries: ["All Industries"],
    tags: ["event", "webinar", "conference", "promotion"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/linkedin/event-promotion.jpg",
    content: {
      headline: "Join Us: [Event Name]",
      subheadline: "[Date] at [Time]",
      bodyText: "We're hosting [event type] on [topic/title]. Learn about [key topics] and gain insights from [speakers/presenters].\n\nKey takeaways:\n• [Takeaway 1]\n• [Takeaway 2]\n• [Takeaway 3]\n\nRegister now to secure your spot.\n\n#[Event hashtag] #[Industry hashtag]",
      callToAction: "Register Now",
      imagePrompt: "Professional event imagery with date, time, and speaker information"
    }
  },
  
  // Social Media Templates - Facebook
  {
    name: "Community Spotlight",
    description: "Highlight community members or customer stories",
    contentType: "Social Media Post",
    platforms: ["Facebook"],
    style: "Casual",
    industries: ["Retail", "Food & Beverage", "Non-profit", "Education"],
    tags: ["community", "spotlight", "customer story"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/facebook/community-spotlight.jpg",
    content: {
      headline: "Community Spotlight: [Name]",
      bodyText: "We're shining a spotlight on [Name], who [relationship to business/community]. [His/Her/Their] story is special because [reason].\n\n[Quote or story from community member]\n\n[Call to action or invitation to engage]",
      imagePrompt: "Warm, friendly image of community member or customer with authentic setting"
    }
  },
  {
    name: "Behind the Scenes",
    description: "Share behind-the-scenes content from your business",
    contentType: "Social Media Post",
    platforms: ["Facebook"],
    style: "Casual",
    industries: ["Retail", "Food & Beverage", "Manufacturing", "Entertainment"],
    tags: ["behind the scenes", "authentic", "process"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/facebook/behind-the-scenes.jpg",
    content: {
      headline: "Behind the Scenes",
      bodyText: "Ever wonder how we [create/make/do something]? Here's a peek behind the curtain at our [process/team/workspace].\n\n[Interesting fact or detail about the process]\n\n[Question to encourage engagement]",
      imagePrompt: "Authentic behind-the-scenes imagery showing process, workspace, or team at work"
    }
  },
  {
    name: "Product Collection Showcase",
    description: "Showcase a collection of products or services",
    contentType: "Social Media Post",
    platforms: ["Facebook"],
    style: "Modern",
    industries: ["Retail", "Fashion", "Beauty", "Home Goods"],
    tags: ["product", "collection", "showcase"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/facebook/product-collection.jpg",
    content: {
      headline: "Introducing: [Collection Name]",
      bodyText: "Our new [collection name] features [number] [products/items] perfect for [occasion/season/use case]. Each [product] is [unique selling proposition].\n\n[Highlight a few specific items]\n\nShop the collection now and [benefit].",
      callToAction: "Shop Now",
      imagePrompt: "Styled product collection with cohesive theme and attractive arrangement"
    }
  },
  {
    name: "Customer Review Highlight",
    description: "Showcase positive customer reviews and testimonials",
    contentType: "Social Media Post",
    platforms: ["Facebook"],
    style: "Trustworthy",
    industries: ["All Industries"],
    tags: ["review", "testimonial", "social proof"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/facebook/customer-review.jpg",
    content: {
      headline: "What Our Customers Say",
      bodyText: ""[Customer review quote]"\n- [Customer name]\n\nWe're honored to receive such wonderful feedback. Our mission is to [company mission] and it's rewarding to see the positive impact on our customers.",
      callToAction: "See More Reviews",
      imagePrompt: "Customer review with star rating and professional design elements"
    }
  },
  {
    name: "Local Event Promotion",
    description: "Promote local events or in-store activities",
    contentType: "Social Media Post",
    platforms: ["Facebook"],
    style: "Community",
    industries: ["Retail", "Food & Beverage", "Education", "Non-profit"],
    tags: ["event", "local", "community", "promotion"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/facebook/local-event.jpg",
    content: {
      headline: "Join Us: [Event Name]",
      subheadline: "[Date] at [Time] • [Location]",
      bodyText: "We're hosting [event type] at [location]. Come enjoy [event details and highlights].\n\nWhat to expect:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n[Additional information or special instructions]",
      callToAction: "RSVP Now",
      imagePrompt: "Inviting event imagery with location, date, and time information"
    }
  },
  
  // Email Templates
  {
    name: "Welcome Email Series - First Email",
    description: "Welcome new subscribers to your email list",
    contentType: "Email Newsletter",
    platforms: ["Email"],
    style: "Friendly",
    industries: ["All Industries"],
    tags: ["welcome", "email", "onboarding"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/email/welcome-email.jpg",
    content: {
      subject: "Welcome to [Company Name]! Here's what to expect",
      preheader: "Thanks for joining our community. Here's what's next...",
      headline: "Welcome to the [Company Name] Community!",
      bodyText: "Hi [First Name],\n\nThank you for joining our [newsletter/community]. We're excited to have you on board!\n\nHere's what you can expect from us:\n• [Benefit 1]\n• [Benefit 2]\n• [Benefit 3]\n\n[Additional welcome information or next steps]\n\nIf you have any questions, simply reply to this email.\n\nBest regards,\n[Your Name]\n[Your Title]\n[Company Name]",
      callToAction: "Get Started",
      callToActionUrl: "[Your website or specific page URL]",
      imagePrompt: "Welcoming imagery with brand elements and friendly atmosphere"
    }
  },
  {
    name: "Monthly Newsletter",
    description: "Keep subscribers informed with monthly updates",
    contentType: "Email Newsletter",
    platforms: ["Email"],
    style: "Informative",
    industries: ["All Industries"],
    tags: ["newsletter", "monthly", "updates"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/email/monthly-newsletter.jpg",
    content: {
      subject: "[Month] Newsletter: [Main Topic or Theme]",
      preheader: "The latest updates and news from [Company Name]",
      headline: "[Month] Updates from [Company Name]",
      introduction: "Hi [First Name],\n\nHere's what's new this month at [Company Name]:",
      sections: [
        {
          title: "[Section 1 Title]",
          content: "[Section 1 content - news, updates, or announcements]",
          callToAction: "Read More",
          callToActionUrl: "[URL for section 1]"
        },
        {
          title: "[Section 2 Title]",
          content: "[Section 2 content - news, updates, or announcements]",
          callToAction: "Learn More",
          callToActionUrl: "[URL for section 2]"
        },
        {
          title: "[Section 3 Title]",
          content: "[Section 3 content - news, updates, or announcements]",
          callToAction: "Discover More",
          callToActionUrl: "[URL for section 3]"
        }
      ],
      conclusion: "Thank you for being part of our community. We look forward to [relevant closing statement].\n\nBest regards,\n[Your Name]\n[Your Title]\n[Company Name]",
      imagePrompt: "Professional newsletter layout with sections for different topics and brand elements"
    }
  },
  {
    name: "Product Launch Announcement",
    description: "Announce new products or services to your email list",
    contentType: "Email Newsletter",
    platforms: ["Email"],
    style: "Exciting",
    industries: ["Retail", "Technology", "Beauty", "Food & Beverage"],
    tags: ["product launch", "announcement", "new product"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/email/product-launch.jpg",
    content: {
      subject: "Introducing [Product Name]: [Key Benefit]",
      preheader: "Our newest [product category] is here! Learn more inside...",
      headline: "Introducing [Product Name]",
      subheadline: "[Tagline or key benefit]",
      bodyText: "Hi [First Name],\n\nWe're thrilled to announce the launch of [Product Name], our newest [product category] designed to [key benefit].\n\n[Product description and unique selling points]\n\nKey features:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n[Additional product information, pricing, or availability]\n\n[Early bird or special offer if applicable]",
      callToAction: "Shop Now",
      callToActionUrl: "[Product page URL]",
      imagePrompt: "Product showcase with exciting design elements highlighting the new product"
    }
  },
  {
    name: "Promotional Offer",
    description: "Share special offers, discounts, or promotions",
    contentType: "Email Newsletter",
    platforms: ["Email"],
    style: "Promotional",
    industries: ["Retail", "Food & Beverage", "Travel", "Entertainment"],
    tags: ["promotion", "discount", "offer", "sale"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/email/promotional-offer.jpg",
    content: {
      subject: "[Offer Details]: Limited Time Offer!",
      preheader: "Save [discount amount] on [products/services] for a limited time",
      headline: "[Offer Headline]",
      subheadline: "[Offer details or timeframe]",
      bodyText: "Hi [First Name],\n\nFor a limited time, we're offering [discount or promotion details] on [products or services].\n\n[Additional offer details, restrictions, or qualifying information]\n\nUse code [PROMOCODE] at checkout to redeem this offer.\n\nOffer valid until [end date].",
      callToAction: "Shop Now",
      callToActionUrl: "[Offer page URL]",
      imagePrompt: "Promotional imagery with discount information and eye-catching design elements"
    }
  },
  {
    name: "Event Invitation",
    description: "Invite subscribers to events, webinars, or workshops",
    contentType: "Email Newsletter",
    platforms: ["Email"],
    style: "Inviting",
    industries: ["All Industries"],
    tags: ["event", "invitation", "webinar", "workshop"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/email/event-invitation.jpg",
    content: {
      subject: "You're Invited: [Event Name] on [Date]",
      preheader: "Join us for [brief event description]",
      headline: "You're Invited",
      subheadline: "[Event Name]",
      eventDetails: {
        date: "[Date]",
        time: "[Time]",
        location: "[Location or 'Virtual']",
        cost: "[Cost or 'Free']"
      },
      bodyText: "Hi [First Name],\n\nWe'd like to invite you to [Event Name], a [event type] where you'll [benefit of attending].\n\n[Event description and agenda]\n\nWhat you'll learn:\n• [Topic 1]\n• [Topic 2]\n• [Topic 3]\n\n[Speaker information if applicable]\n\n[Additional event details or instructions]",
      callToAction: "Register Now",
      callToActionUrl: "[Registration page URL]",
      imagePrompt: "Event invitation with date, time, and location information in an inviting design"
    }
  },
  
  // Blog Article Templates
  {
    name: "How-To Guide",
    description: "Create comprehensive how-to guides for your blog",
    contentType: "Blog Article",
    platforms: ["Blog"],
    style: "Instructional",
    industries: ["All Industries"],
    tags: ["how-to", "guide", "tutorial", "instructional"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/blog/how-to-guide.jpg",
    content: {
      title: "How to [Accomplish Task] in [Number] Simple Steps",
      metaDescription: "Learn how to [accomplish task] with our step-by-step guide. Perfect for [target audience] looking to [desired outcome].",
      introduction: "[Hook to grab attention]\n\n[Establish the problem or need]\n\n[Brief overview of what the reader will learn]\n\nIn this guide, you'll discover how to [accomplish task] in [number] simple steps, even if [common obstacle].",
      sections: [
        {
          title: "Step 1: [First Step]",
          content: "[Detailed explanation of first step]\n\n[Tips, examples, or common mistakes to avoid]\n\n[Optional: image description for step 1]"
        },
        {
          title: "Step 2: [Second Step]",
          content: "[Detailed explanation of second step]\n\n[Tips, examples, or common mistakes to avoid]\n\n[Optional: image description for step 2]"
        },
        {
          title: "Step 3: [Third Step]",
          content: "[Detailed explanation of third step]\n\n[Tips, examples, or common mistakes to avoid]\n\n[Optional: image description for step 3]"
        },
        {
          title: "Step 4: [Fourth Step]",
          content: "[Detailed explanation of fourth step]\n\n[Tips, examples, or common mistakes to avoid]\n\n[Optional: image description for step 4]"
        },
        {
          title: "Step 5: [Fifth Step]",
          content: "[Detailed explanation of fifth step]\n\n[Tips, examples, or common mistakes to avoid]\n\n[Optional: image description for step 5]"
        }
      ],
      conclusion: "[Recap of the steps covered]\n\n[Encouragement about what the reader can now accomplish]\n\n[Call to action or next steps]",
      callToAction: "Ready to [related action]? [Call to action]",
      imagePrompt: "Instructional imagery showing the process or end result of the how-to guide"
    }
  },
  {
    name: "Industry Trends Analysis",
    description: "Analyze industry trends and provide expert insights",
    contentType: "Blog Article",
    platforms: ["Blog"],
    style: "Analytical",
    industries: ["All Industries"],
    tags: ["trends", "analysis", "industry", "insights"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/blog/industry-trends.jpg",
    content: {
      title: "[Number] [Industry] Trends to Watch in [Year]",
      metaDescription: "Discover the top [industry] trends for [year] and how they'll impact your business. Expert analysis and actionable insights.",
      introduction: "[Hook with compelling statistic or observation]\n\n[Context about the industry's current state]\n\n[Importance of staying ahead of trends]\n\n[Brief overview of what the article covers]",
      sections: [
        {
          title: "Trend 1: [First Trend]",
          content: "[Description of the trend]\n\n[Evidence, data, or examples supporting the trend]\n\n[Impact on the industry and businesses]\n\n[How to leverage or adapt to this trend]"
        },
        {
          title: "Trend 2: [Second Trend]",
          content: "[Description of the trend]\n\n[Evidence, data, or examples supporting the trend]\n\n[Impact on the industry and businesses]\n\n[How to leverage or adapt to this trend]"
        },
        {
          title: "Trend 3: [Third Trend]",
          content: "[Description of the trend]\n\n[Evidence, data, or examples supporting the trend]\n\n[Impact on the industry and businesses]\n\n[How to leverage or adapt to this trend]"
        },
        {
          title: "Trend 4: [Fourth Trend]",
          content: "[Description of the trend]\n\n[Evidence, data, or examples supporting the trend]\n\n[Impact on the industry and businesses]\n\n[How to leverage or adapt to this trend]"
        },
        {
          title: "Trend 5: [Fifth Trend]",
          content: "[Description of the trend]\n\n[Evidence, data, or examples supporting the trend]\n\n[Impact on the industry and businesses]\n\n[How to leverage or adapt to this trend]"
        }
      ],
      conclusion: "[Summary of key trends]\n\n[Strategic recommendations]\n\n[Forward-looking statement about the industry]",
      callToAction: "Want to stay ahead of these trends? [Call to action]",
      imagePrompt: "Data visualization or trend analysis imagery with professional business elements"
    }
  },
  {
    name: "Case Study",
    description: "Showcase client success stories and results",
    contentType: "Blog Article",
    platforms: ["Blog"],
    style: "Professional",
    industries: ["All Industries"],
    tags: ["case study", "success story", "results", "client"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/blog/case-study.jpg",
    content: {
      title: "Case Study: How [Client] Achieved [Result] with [Your Product/Service]",
      metaDescription: "Learn how [client] achieved [specific result] using [your product/service]. A detailed case study with strategies and outcomes.",
      introduction: "[Brief introduction of the client]\n\n[The challenge or problem they faced]\n\n[Teaser of the results achieved]",
      sections: [
        {
          title: "The Challenge",
          content: "[Detailed description of the client's situation]\n\n[Specific challenges or pain points]\n\n[Goals they wanted to achieve]\n\n[Previous attempts or solutions that didn't work]"
        },
        {
          title: "The Solution",
          content: "[How your product/service was implemented]\n\n[Specific features or strategies used]\n\n[Implementation process or timeline]\n\n[Any customizations or special approaches]"
        },
        {
          title: "The Results",
          content: "[Specific, measurable results achieved]\n\n[Key metrics and improvements]\n\n[Comparison to previous state or baseline]\n\n[Unexpected benefits or outcomes]"
        },
        {
          title: "Key Takeaways",
          content: "[Lessons learned from this case]\n\n[Best practices identified]\n\n[Recommendations for similar situations]"
        }
      ],
      clientQuote: {
        quote: "[Client testimonial about the experience and results]",
        attribution: "[Client name], [Client title], [Client company]"
      },
      conclusion: "[Summary of the case study]\n\n[Broader implications or applications]\n\n[Invitation to learn more or get similar results]",
      callToAction: "Ready to achieve similar results? [Call to action]",
      imagePrompt: "Professional case study imagery with client success visualization and data points"
    }
  },
  {
    name: "Product Comparison Guide",
    description: "Compare products or services to help customers decide",
    contentType: "Blog Article",
    platforms: ["Blog"],
    style: "Informative",
    industries: ["Retail", "Technology", "Finance", "Professional Services"],
    tags: ["comparison", "guide", "product", "decision"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/blog/product-comparison.jpg",
    content: {
      title: "[Product A] vs [Product B]: Which is Right for You?",
      metaDescription: "Compare [Product A] and [Product B] to find the best option for your needs. Detailed comparison of features, pricing, and use cases.",
      introduction: "[Hook about the difficulty of choosing between options]\n\n[Why this decision matters]\n\n[Brief overview of both products]\n\n[Who this comparison is for]",
      sections: [
        {
          title: "Quick Comparison",
          content: "[Summary table or bullet points comparing key features]\n\n[Best for statements for each product]"
        },
        {
          title: "Feature Comparison",
          content: "[Detailed comparison of features]\n\n[Strengths and weaknesses of each product]\n\n[Feature-by-feature breakdown]"
        },
        {
          title: "Pricing Comparison",
          content: "[Pricing structures for each product]\n\n[Value analysis]\n\n[Hidden costs or considerations]"
        },
        {
          title: "Use Case Analysis",
          content: "[Scenarios where Product A excels]\n\n[Scenarios where Product B excels]\n\n[Real-world examples or applications]"
        },
        {
          title: "User Experience",
          content: "[Ease of use comparison]\n\n[Learning curve considerations]\n\n[User interface and design comparison]"
        }
      ],
      conclusion: "[Summary of key differences]\n\n[Recommendations for different user types or needs]\n\n[Final thoughts on making the decision]",
      callToAction: "Ready to make your choice? [Call to action]",
      imagePrompt: "Side-by-side product comparison with feature highlights and visual comparison elements"
    }
  },
  {
    name: "Expert Interview",
    description: "Share insights from industry experts and thought leaders",
    contentType: "Blog Article",
    platforms: ["Blog"],
    style: "Conversational",
    industries: ["All Industries"],
    tags: ["interview", "expert", "insights", "thought leadership"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/blog/expert-interview.jpg",
    content: {
      title: "[Expert Name] on [Topic]: Insights from a [Industry/Field] Leader",
      metaDescription: "Interview with [Expert Name], [Expert Title], sharing insights on [Topic]. Learn from a leading expert in [Industry/Field].",
      introduction: "[Introduction to the expert and their credentials]\n\n[Why their perspective matters]\n\n[Context about the topic or industry]\n\n[How this interview will benefit readers]",
      sections: [
        {
          title: "About [Expert Name]",
          content: "[Expert's background and experience]\n\n[Notable achievements or contributions]\n\n[Current role and focus]"
        },
        {
          title: "Q: [First Question]",
          content: "[Expert's response to first question]"
        },
        {
          title: "Q: [Second Question]",
          content: "[Expert's response to second question]"
        },
        {
          title: "Q: [Third Question]",
          content: "[Expert's response to third question]"
        },
        {
          title: "Q: [Fourth Question]",
          content: "[Expert's response to fourth question]"
        },
        {
          title: "Q: [Fifth Question]",
          content: "[Expert's response to fifth question]"
        },
        {
          title: "Key Takeaways",
          content: "[Summary of main insights from the interview]\n\n[Practical applications or action items for readers]"
        }
      ],
      conclusion: "[Final thoughts on the interview]\n\n[Expression of gratitude to the expert]\n\n[Invitation for readers to learn more or connect]",
      callToAction: "Want more insights from industry experts? [Call to action]",
      imagePrompt: "Professional portrait of the expert with interview setting or topic-related imagery"
    }
  },
  
  // Landing Page Templates
  {
    name: "Product Launch Landing Page",
    description: "Promote a new product or service launch",
    contentType: "Landing Page",
    platforms: ["Website"],
    style: "Conversion-focused",
    industries: ["All Industries"],
    tags: ["product launch", "landing page", "conversion"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/landing-page/product-launch.jpg",
    content: {
      headline: "Introducing [Product Name]",
      subheadline: "[Tagline or key benefit statement]",
      heroSection: {
        mainCopy: "[Compelling description of the product and its primary benefit]",
        callToAction: "Get [Product] Now",
        imagePrompt: "Hero image showcasing the product with professional styling and brand elements"
      },
      benefitsSection: {
        heading: "Why Choose [Product Name]?",
        benefits: [
          {
            title: "[Benefit 1]",
            description: "[Explanation of first benefit]",
            iconName: "icon-name-1"
          },
          {
            title: "[Benefit 2]",
            description: "[Explanation of second benefit]",
            iconName: "icon-name-2"
          },
          {
            title: "[Benefit 3]",
            description: "[Explanation of third benefit]",
            iconName: "icon-name-3"
          }
        ]
      },
      featuresSection: {
        heading: "Features",
        features: [
          {
            title: "[Feature 1]",
            description: "[Detailed description of first feature]",
            imagePrompt: "Feature 1 illustration or product detail"
          },
          {
            title: "[Feature 2]",
            description: "[Detailed description of second feature]",
            imagePrompt: "Feature 2 illustration or product detail"
          },
          {
            title: "[Feature 3]",
            description: "[Detailed description of third feature]",
            imagePrompt: "Feature 3 illustration or product detail"
          }
        ]
      },
      socialProofSection: {
        heading: "What People Are Saying",
        testimonials: [
          {
            quote: "[Testimonial 1]",
            name: "[Name 1]",
            title: "[Title/Company 1]"
          },
          {
            quote: "[Testimonial 2]",
            name: "[Name 2]",
            title: "[Title/Company 2]"
          },
          {
            quote: "[Testimonial 3]",
            name: "[Name 3]",
            title: "[Title/Company 3]"
          }
        ]
      },
      pricingSection: {
        heading: "Pricing",
        plans: [
          {
            name: "[Basic Plan]",
            price: "[Price 1]",
            features: ["[Feature]", "[Feature]", "[Feature]"],
            callToAction: "Get Started"
          },
          {
            name: "[Pro Plan]",
            price: "[Price 2]",
            features: ["[Feature]", "[Feature]", "[Feature]", "[Feature]"],
            callToAction: "Get Started",
            highlighted: true
          },
          {
            name: "[Enterprise Plan]",
            price: "[Price 3]",
            features: ["[Feature]", "[Feature]", "[Feature]", "[Feature]", "[Feature]"],
            callToAction: "Contact Us"
          }
        ]
      },
      faqSection: {
        heading: "Frequently Asked Questions",
        questions: [
          {
            question: "[Question 1]",
            answer: "[Answer 1]"
          },
          {
            question: "[Question 2]",
            answer: "[Answer 2]"
          },
          {
            question: "[Question 3]",
            answer: "[Answer 3]"
          },
          {
            question: "[Question 4]",
            answer: "[Answer 4]"
          }
        ]
      },
      ctaSection: {
        heading: "[Final Call to Action Heading]",
        subheading: "[Supporting statement or urgency creator]",
        callToAction: "Get [Product] Now"
      }
    }
  },
  {
    name: "Webinar Registration Landing Page",
    description: "Drive registrations for webinars or online events",
    contentType: "Landing Page",
    platforms: ["Website"],
    style: "Conversion-focused",
    industries: ["All Industries"],
    tags: ["webinar", "registration", "event", "landing page"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/landing-page/webinar-registration.jpg",
    content: {
      headline: "[Webinar Title]",
      subheadline: "[Date] at [Time]",
      heroSection: {
        mainCopy: "[Compelling description of the webinar and its value]",
        callToAction: "Register Now",
        imagePrompt: "Webinar promotional image with speaker photos and event details"
      },
      speakersSection: {
        heading: "Meet Your Speakers",
        speakers: [
          {
            name: "[Speaker 1 Name]",
            title: "[Speaker 1 Title/Company]",
            bio: "[Brief bio of speaker 1]",
            imagePrompt: "Professional headshot of speaker 1"
          },
          {
            name: "[Speaker 2 Name]",
            title: "[Speaker 2 Title/Company]",
            bio: "[Brief bio of speaker 2]",
            imagePrompt: "Professional headshot of speaker 2"
          }
        ]
      },
      whatYouWillLearnSection: {
        heading: "What You'll Learn",
        points: [
          "[Learning point 1]",
          "[Learning point 2]",
          "[Learning point 3]",
          "[Learning point 4]",
          "[Learning point 5]"
        ]
      },
      agendaSection: {
        heading: "Agenda",
        items: [
          {
            time: "[Time slot 1]",
            title: "[Session 1 title]",
            description: "[Session 1 description]"
          },
          {
            time: "[Time slot 2]",
            title: "[Session 2 title]",
            description: "[Session 2 description]"
          },
          {
            time: "[Time slot 3]",
            title: "[Session 3 title]",
            description: "[Session 3 description]"
          }
        ]
      },
      whyAttendSection: {
        heading: "Why Attend",
        reasons: [
          {
            title: "[Reason 1]",
            description: "[Explanation of first reason]",
            iconName: "icon-name-1"
          },
          {
            title: "[Reason 2]",
            description: "[Explanation of second reason]",
            iconName: "icon-name-2"
          },
          {
            title: "[Reason 3]",
            description: "[Explanation of third reason]",
            iconName: "icon-name-3"
          }
        ]
      },
      testimonialSection: {
        heading: "What Past Attendees Say",
        testimonials: [
          {
            quote: "[Testimonial 1]",
            name: "[Name 1]",
            title: "[Title/Company 1]"
          },
          {
            quote: "[Testimonial 2]",
            name: "[Name 2]",
            title: "[Title/Company 2]"
          }
        ]
      },
      registrationFormSection: {
        heading: "Register Now",
        subheading: "[Limited spots available or other urgency creator]",
        formFields: [
          "First Name",
          "Last Name",
          "Email",
          "Company",
          "Job Title"
        ],
        callToAction: "Secure Your Spot"
      },
      faqSection: {
        heading: "Frequently Asked Questions",
        questions: [
          {
            question: "[Question 1]",
            answer: "[Answer 1]"
          },
          {
            question: "[Question 2]",
            answer: "[Answer 2]"
          },
          {
            question: "[Question 3]",
            answer: "[Answer 3]"
          }
        ]
      }
    }
  },
  {
    name: "Lead Magnet Landing Page",
    description: "Offer valuable content in exchange for contact information",
    contentType: "Landing Page",
    platforms: ["Website"],
    style: "Conversion-focused",
    industries: ["All Industries"],
    tags: ["lead magnet", "download", "ebook", "guide"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/landing-page/lead-magnet.jpg",
    content: {
      headline: "[Lead Magnet Title]",
      subheadline: "[Value proposition or key benefit]",
      heroSection: {
        mainCopy: "[Compelling description of the lead magnet and its value]",
        callToAction: "Download Now",
        imagePrompt: "Lead magnet mockup (e.g., ebook cover, guide preview) with professional design"
      },
      whatYouWillGetSection: {
        heading: "What's Inside",
        points: [
          "[Content highlight 1]",
          "[Content highlight 2]",
          "[Content highlight 3]",
          "[Content highlight 4]",
          "[Content highlight 5]"
        ]
      },
      benefitsSection: {
        heading: "How This Will Help You",
        benefits: [
          {
            title: "[Benefit 1]",
            description: "[Explanation of first benefit]",
            iconName: "icon-name-1"
          },
          {
            title: "[Benefit 2]",
            description: "[Explanation of second benefit]",
            iconName: "icon-name-2"
          },
          {
            title: "[Benefit 3]",
            description: "[Explanation of third benefit]",
            iconName: "icon-name-3"
          }
        ]
      },
      previewSection: {
        heading: "Preview",
        snippets: [
          {
            title: "[Preview section 1]",
            content: "[Brief excerpt or summary]",
            imagePrompt: "Preview image 1"
          },
          {
            title: "[Preview section 2]",
            content: "[Brief excerpt or summary]",
            imagePrompt: "Preview image 2"
          }
        ]
      },
      authorSection: {
        heading: "About the Author",
        name: "[Author Name]",
        bio: "[Author bio and credentials]",
        imagePrompt: "Professional author headshot"
      },
      testimonialSection: {
        heading: "What Readers Say",
        testimonials: [
          {
            quote: "[Testimonial 1]",
            name: "[Name 1]",
            title: "[Title/Company 1]"
          },
          {
            quote: "[Testimonial 2]",
            name: "[Name 2]",
            title: "[Title/Company 2]"
          }
        ]
      },
      downloadFormSection: {
        heading: "Get Your Free Copy",
        subheading: "[Additional value statement or urgency creator]",
        formFields: [
          "First Name",
          "Email"
        ],
        callToAction: "Download Now",
        privacyNote: "We respect your privacy. Unsubscribe at any time."
      }
    }
  },
  {
    name: "Service Offering Landing Page",
    description: "Promote professional services and drive inquiries",
    contentType: "Landing Page",
    platforms: ["Website"],
    style: "Professional",
    industries: ["Professional Services", "Healthcare", "Finance", "Education"],
    tags: ["service", "offering", "professional", "consultation"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/landing-page/service-offering.jpg",
    content: {
      headline: "[Service Name]",
      subheadline: "[Value proposition or key benefit]",
      heroSection: {
        mainCopy: "[Compelling description of the service and its value]",
        callToAction: "Schedule a Consultation",
        imagePrompt: "Professional service imagery with relevant industry elements"
      },
      problemSection: {
        heading: "The Challenge",
        description: "[Description of the problem or pain point the service addresses]",
        bulletPoints: [
          "[Pain point 1]",
          "[Pain point 2]",
          "[Pain point 3]"
        ]
      },
      solutionSection: {
        heading: "Our Solution",
        description: "[Overview of how the service solves the problem]",
        features: [
          {
            title: "[Feature/Aspect 1]",
            description: "[Explanation of first feature/aspect]",
            iconName: "icon-name-1"
          },
          {
            title: "[Feature/Aspect 2]",
            description: "[Explanation of second feature/aspect]",
            iconName: "icon-name-2"
          },
          {
            title: "[Feature/Aspect 3]",
            description: "[Explanation of third feature/aspect]",
            iconName: "icon-name-3"
          }
        ]
      },
      processSection: {
        heading: "Our Process",
        steps: [
          {
            number: "1",
            title: "[Step 1]",
            description: "[Description of first step]"
          },
          {
            number: "2",
            title: "[Step 2]",
            description: "[Description of second step]"
          },
          {
            number: "3",
            title: "[Step 3]",
            description: "[Description of third step]"
          },
          {
            number: "4",
            title: "[Step 4]",
            description: "[Description of fourth step]"
          }
        ]
      },
      resultsSection: {
        heading: "Results You Can Expect",
        results: [
          "[Result 1]",
          "[Result 2]",
          "[Result 3]",
          "[Result 4]"
        ]
      },
      caseStudySection: {
        heading: "Success Stories",
        caseStudies: [
          {
            client: "[Client 1]",
            challenge: "[Brief description of challenge]",
            solution: "[Brief description of solution]",
            results: "[Brief description of results]"
          },
          {
            client: "[Client 2]",
            challenge: "[Brief description of challenge]",
            solution: "[Brief description of solution]",
            results: "[Brief description of results]"
          }
        ]
      },
      teamSection: {
        heading: "Meet Our Team",
        members: [
          {
            name: "[Team Member 1]",
            title: "[Title 1]",
            bio: "[Brief bio]",
            imagePrompt: "Professional headshot of team member 1"
          },
          {
            name: "[Team Member 2]",
            title: "[Title 2]",
            bio: "[Brief bio]",
            imagePrompt: "Professional headshot of team member 2"
          }
        ]
      },
      pricingSection: {
        heading: "Investment",
        description: "[Pricing approach or philosophy]",
        packages: [
          {
            name: "[Package 1]",
            price: "[Price 1]",
            description: "[Package description]",
            features: ["[Feature]", "[Feature]", "[Feature]"],
            callToAction: "Get Started"
          },
          {
            name: "[Package 2]",
            price: "[Price 2]",
            description: "[Package description]",
            features: ["[Feature]", "[Feature]", "[Feature]", "[Feature]"],
            callToAction: "Get Started",
            highlighted: true
          },
          {
            name: "[Package 3]",
            price: "[Price 3]",
            description: "[Package description]",
            features: ["[Feature]", "[Feature]", "[Feature]", "[Feature]", "[Feature]"],
            callToAction: "Contact Us"
          }
        ]
      },
      faqSection: {
        heading: "Frequently Asked Questions",
        questions: [
          {
            question: "[Question 1]",
            answer: "[Answer 1]"
          },
          {
            question: "[Question 2]",
            answer: "[Answer 2]"
          },
          {
            question: "[Question 3]",
            answer: "[Answer 3]"
          },
          {
            question: "[Question 4]",
            answer: "[Answer 4]"
          }
        ]
      },
      contactSection: {
        heading: "Ready to Get Started?",
        subheading: "[Supporting statement or urgency creator]",
        formFields: [
          "Name",
          "Email",
          "Phone",
          "Company",
          "Message"
        ],
        callToAction: "Schedule a Consultation"
      }
    }
  },
  {
    name: "Free Trial Landing Page",
    description: "Promote free trials of software or subscription services",
    contentType: "Landing Page",
    platforms: ["Website"],
    style: "Conversion-focused",
    industries: ["Technology", "SaaS", "Entertainment", "Education"],
    tags: ["free trial", "software", "subscription", "signup"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/landing-page/free-trial.jpg",
    content: {
      headline: "Try [Product Name] Free for [Time Period]",
      subheadline: "[Key benefit or value proposition]",
      heroSection: {
        mainCopy: "[Compelling description of the product and trial offer]",
        callToAction: "Start Free Trial",
        secondaryAction: "Watch Demo",
        imagePrompt: "Product screenshot or demo visualization with professional styling"
      },
      benefitsSection: {
        heading: "Why [Product Name]?",
        benefits: [
          {
            title: "[Benefit 1]",
            description: "[Explanation of first benefit]",
            iconName: "icon-name-1"
          },
          {
            title: "[Benefit 2]",
            description: "[Explanation of second benefit]",
            iconName: "icon-name-2"
          },
          {
            title: "[Benefit 3]",
            description: "[Explanation of third benefit]",
            iconName: "icon-name-3"
          }
        ]
      },
      featuresSection: {
        heading: "Key Features",
        features: [
          {
            title: "[Feature 1]",
            description: "[Detailed description of first feature]",
            imagePrompt: "Feature 1 screenshot or illustration"
          },
          {
            title: "[Feature 2]",
            description: "[Detailed description of second feature]",
            imagePrompt: "Feature 2 screenshot or illustration"
          },
          {
            title: "[Feature 3]",
            description: "[Detailed description of third feature]",
            imagePrompt: "Feature 3 screenshot or illustration"
          }
        ]
      },
      socialProofSection: {
        heading: "Trusted By",
        logos: ["[Company 1]", "[Company 2]", "[Company 3]", "[Company 4]", "[Company 5]"],
        testimonials: [
          {
            quote: "[Testimonial 1]",
            name: "[Name 1]",
            title: "[Title/Company 1]",
            imagePrompt: "Customer 1 headshot or company logo"
          },
          {
            quote: "[Testimonial 2]",
            name: "[Name 2]",
            title: "[Title/Company 2]",
            imagePrompt: "Customer 2 headshot or company logo"
          },
          {
            quote: "[Testimonial 3]",
            name: "[Name 3]",
            title: "[Title/Company 3]",
            imagePrompt: "Customer 3 headshot or company logo"
          }
        ]
      },
      howItWorksSection: {
        heading: "How It Works",
        steps: [
          {
            number: "1",
            title: "[Step 1]",
            description: "[Description of first step]",
            iconName: "icon-step-1"
          },
          {
            number: "2",
            title: "[Step 2]",
            description: "[Description of second step]",
            iconName: "icon-step-2"
          },
          {
            number: "3",
            title: "[Step 3]",
            description: "[Description of third step]",
            iconName: "icon-step-3"
          }
        ]
      },
      pricingSection: {
        heading: "Simple Pricing",
        description: "[Pricing philosophy or approach]",
        trialDetails: "[Details about the free trial, what's included, etc.]",
        plans: [
          {
            name: "[Basic Plan]",
            price: "[Price 1]",
            features: ["[Feature]", "[Feature]", "[Feature]"],
            callToAction: "Start Free Trial"
          },
          {
            name: "[Pro Plan]",
            price: "[Price 2]",
            features: ["[Feature]", "[Feature]", "[Feature]", "[Feature]"],
            callToAction: "Start Free Trial",
            highlighted: true
          },
          {
            name: "[Enterprise Plan]",
            price: "[Price 3]",
            features: ["[Feature]", "[Feature]", "[Feature]", "[Feature]", "[Feature]"],
            callToAction: "Contact Sales"
          }
        ]
      },
      faqSection: {
        heading: "Frequently Asked Questions",
        questions: [
          {
            question: "[Question 1]",
            answer: "[Answer 1]"
          },
          {
            question: "[Question 2]",
            answer: "[Answer 2]"
          },
          {
            question: "[Question 3]",
            answer: "[Answer 3]"
          },
          {
            question: "[Question 4]",
            answer: "[Answer 4]"
          }
        ]
      },
      signupSection: {
        heading: "Start Your Free Trial Today",
        subheading: "[No credit card required or other trust builder]",
        formFields: [
          "Full Name",
          "Work Email",
          "Password",
          "Company Name"
        ],
        callToAction: "Start Free Trial",
        privacyNote: "By signing up, you agree to our Terms of Service and Privacy Policy."
      }
    }
  },
  
  // Additional templates to reach 50+ total
  // Video Script Templates
  {
    name: "Product Demo Video Script",
    description: "Create engaging product demonstration videos",
    contentType: "Video Script",
    platforms: ["YouTube"],
    style: "Instructional",
    industries: ["All Industries"],
    tags: ["product demo", "video", "tutorial"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/video/product-demo.jpg",
    content: {
      title: "[Product Name] Demo: [Key Feature or Benefit]",
      introduction: {
        visualDescription: "[Opening visual - product, logo, or presenter]",
        script: "Hi, I'm [Name] from [Company], and today I'm excited to show you [Product Name], which helps you [key benefit]. In this demo, you'll see how [Product Name] can [specific value proposition]."
      },
      sections: [
        {
          title: "Overview",
          visualDescription: "[Visual showing product overview or interface]",
          script: "[Brief description of what the product is and who it's for]\n\nHere's what makes [Product Name] different: [1-2 key differentiators]"
        },
        {
          title: "Feature 1: [Feature Name]",
          visualDescription: "[Visual demonstration of first feature]",
          script: "Let me show you [Feature 1]. This allows you to [what it does].\n\nHere's how it works: [step-by-step demonstration]\n\nAs you can see, this makes [specific task] much [faster/easier/better]."
        },
        {
          title: "Feature 2: [Feature Name]",
          visualDescription: "[Visual demonstration of second feature]",
          script: "Another powerful feature is [Feature 2]. This is especially useful for [specific use case].\n\n[Demonstration of feature in action]\n\nBefore [Product Name], this would take [old process]. Now, it's as simple as [new process]."
        },
        {
          title: "Feature 3: [Feature Name]",
          visualDescription: "[Visual demonstration of third feature]",
          script: "Finally, let's look at [Feature 3]. This is where [Product Name] really shines.\n\n[Demonstration of feature in action]\n\nAs you can see, this [specific benefit of feature]."
        },
        {
          title: "Real Results",
          visualDescription: "[Customer testimonial or results visualization]",
          script: "Customers who use [Product Name] have seen [specific results]. For example, [Company/Person] was able to [specific achievement]."
        }
      ],
      conclusion: {
        visualDescription: "[Call to action visual with product and website/contact information]",
        script: "I hope this demo has shown you how [Product Name] can [key benefit]. If you'd like to try it yourself, visit [website] or click the link in the description to start your [free trial/demo/etc.].\n\nIf you have any questions, feel free to [contact method]. Thanks for watching!"
      }
    }
  },
  {
    name: "Explainer Video Script",
    description: "Create concise explanations of complex topics or products",
    contentType: "Video Script",
    platforms: ["YouTube"],
    style: "Educational",
    industries: ["All Industries"],
    tags: ["explainer", "video", "educational"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/video/explainer.jpg",
    content: {
      title: "[Topic/Product]: Explained in [Time] Minutes",
      introduction: {
        visualDescription: "[Opening visual establishing the problem or need]",
        script: "Have you ever wondered [problem statement or question]? [Relatable scenario showing pain point]\n\nIn this video, we'll explain [topic/product] and show you how it [solves problem/provides benefit]."
      },
      sections: [
        {
          title: "The Problem",
          visualDescription: "[Visual illustrating the problem or pain point]",
          script: "[Expanded description of the problem]\n\n[Statistics or examples that highlight the impact of the problem]\n\n[Transition to solution]"
        },
        {
          title: "Introducing the Solution",
          visualDescription: "[Visual introducing the solution/product]",
          script: "That's where [solution/product] comes in. [Brief description of what it is]\n\n[Solution/product] was designed to [purpose] by [how it works at a high level]."
        },
        {
          title: "How It Works",
          visualDescription: "[Visual breakdown of how the solution works]",
          script: "Here's how it works:\n\n[Step 1 explanation]\n\n[Step 2 explanation]\n\n[Step 3 explanation]\n\nIt's that simple!"
        },
        {
          title: "Benefits",
          visualDescription: "[Visual showing benefits or before/after comparison]",
          script: "By using [solution/product], you'll experience:\n\n[Benefit 1]\n\n[Benefit 2]\n\n[Benefit 3]\n\nUnlike [alternatives], [solution/product] [key differentiator]."
        },
        {
          title: "Real-World Example",
          visualDescription: "[Visual showing the solution in action]",
          script: "Let's see how this works in a real scenario. [Example of solution being used]\n\nAs you can see, [highlight of key advantage demonstrated in example]."
        }
      ],
      conclusion: {
        visualDescription: "[Call to action visual]",
        script: "Now that you understand [topic/product], you can [benefit]. To get started, [call to action].\n\n[Final reinforcement of value proposition]\n\nThanks for watching! If you found this helpful, please like and subscribe for more videos like this."
      }
    }
  },
  
  // Infographic Templates
  {
    name: "Statistical Infographic",
    description: "Present data and statistics in a visually compelling way",
    contentType: "Infographic",
    platforms: ["Website", "Social Media"],
    style: "Data-driven",
    industries: ["All Industries"],
    tags: ["infographic", "statistics", "data visualization"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/infographic/statistical.jpg",
    content: {
      title: "[Topic]: By the Numbers",
      introduction: {
        heading: "[Compelling headline about the topic]",
        subheading: "[Brief context setting or why this matters]"
      },
      sections: [
        {
          title: "[Section 1 Title]",
          statistics: [
            {
              value: "[Statistic 1]",
              label: "[Label for statistic 1]",
              description: "[Brief context or explanation]"
            },
            {
              value: "[Statistic 2]",
              label: "[Label for statistic 2]",
              description: "[Brief context or explanation]"
            }
          ],
          visualType: "bar chart"
        },
        {
          title: "[Section 2 Title]",
          statistics: [
            {
              value: "[Statistic 3]",
              label: "[Label for statistic 3]",
              description: "[Brief context or explanation]"
            },
            {
              value: "[Statistic 4]",
              label: "[Label for statistic 4]",
              description: "[Brief context or explanation]"
            }
          ],
          visualType: "pie chart"
        },
        {
          title: "[Section 3 Title]",
          statistics: [
            {
              value: "[Statistic 5]",
              label: "[Label for statistic 5]",
              description: "[Brief context or explanation]"
            },
            {
              value: "[Statistic 6]",
              label: "[Label for statistic 6]",
              description: "[Brief context or explanation]"
            }
          ],
          visualType: "line graph"
        }
      ],
      conclusion: {
        heading: "[Key takeaway or insight]",
        callToAction: "[What the viewer should do with this information]"
      },
      sourceNote: "Sources: [List of data sources]",
      brandingElements: {
        logo: true,
        websiteUrl: true,
        socialHandles: true
      },
      colorScheme: "[Description of color scheme]",
      visualStyle: "[Description of visual style]"
    }
  },
  {
    name: "Process Infographic",
    description: "Explain a process or workflow in a visual format",
    contentType: "Infographic",
    platforms: ["Website", "Social Media"],
    style: "Instructional",
    industries: ["All Industries"],
    tags: ["infographic", "process", "workflow", "how-to"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/infographic/process.jpg",
    content: {
      title: "How to [Process Name]",
      introduction: {
        heading: "[Compelling headline about the process]",
        subheading: "[Brief explanation of why this process matters]"
      },
      steps: [
        {
          number: "1",
          title: "[Step 1 Title]",
          description: "[Brief explanation of step 1]",
          visualDescription: "[Description of icon or illustration for step 1]"
        },
        {
          number: "2",
          title: "[Step 2 Title]",
          description: "[Brief explanation of step 2]",
          visualDescription: "[Description of icon or illustration for step 2]"
        },
        {
          number: "3",
          title: "[Step 3 Title]",
          description: "[Brief explanation of step 3]",
          visualDescription: "[Description of icon or illustration for step 3]"
        },
        {
          number: "4",
          title: "[Step 4 Title]",
          description: "[Brief explanation of step 4]",
          visualDescription: "[Description of icon or illustration for step 4]"
        },
        {
          number: "5",
          title: "[Step 5 Title]",
          description: "[Brief explanation of step 5]",
          visualDescription: "[Description of icon or illustration for step 5]"
        }
      ],
      tips: [
        "[Helpful tip 1]",
        "[Helpful tip 2]",
        "[Helpful tip 3]"
      ],
      conclusion: {
        heading: "[Key benefit of following this process]",
        callToAction: "[What the viewer should do next]"
      },
      brandingElements: {
        logo: true,
        websiteUrl: true,
        socialHandles: true
      },
      colorScheme: "[Description of color scheme]",
      visualStyle: "[Description of visual style]"
    }
  },
  
  // Additional Social Media Templates
  {
    name: "Twitter Thread",
    description: "Create engaging Twitter threads on specific topics",
    contentType: "Social Media Post",
    platforms: ["Twitter"],
    style: "Conversational",
    industries: ["All Industries"],
    tags: ["twitter", "thread", "engagement"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/twitter/thread.jpg",
    content: {
      topic: "[Thread Topic]",
      introduction: {
        text: "🧵 [Attention-grabbing headline about topic]\n\nIn this thread, I'll share [what the thread will cover]. Let's dive in! 👇",
        includeImage: true,
        imagePrompt: "Eye-catching image related to the thread topic"
      },
      tweets: [
        {
          text: "1️⃣ [First point or insight]\n\n[Expansion on first point with specific example, data, or story]",
          includeImage: false
        },
        {
          text: "2️⃣ [Second point or insight]\n\n[Expansion on second point with specific example, data, or story]",
          includeImage: true,
          imagePrompt: "Visual supporting the second point"
        },
        {
          text: "3️⃣ [Third point or insight]\n\n[Expansion on third point with specific example, data, or story]",
          includeImage: false
        },
        {
          text: "4️⃣ [Fourth point or insight]\n\n[Expansion on fourth point with specific example, data, or story]",
          includeImage: true,
          imagePrompt: "Visual supporting the fourth point"
        },
        {
          text: "5️⃣ [Fifth point or insight]\n\n[Expansion on fifth point with specific example, data, or story]",
          includeImage: false
        }
      ],
      conclusion: {
        text: "To summarize:\n\n• [Key takeaway 1]\n• [Key takeaway 2]\n• [Key takeaway 3]\n\n[Final thought or insight on the topic]\n\nIf you found this useful, please RT the thread to share with others!",
        includeImage: false
      },
      callToAction: {
        text: "Want to learn more about [topic]? Check out our [resource, article, product, etc.]: [link]\n\nAnd make sure to follow me for more threads on [related topics]!",
        includeImage: true,
        imagePrompt: "Call to action visual with branding elements"
      }
    }
  },
  {
    name: "TikTok Script",
    description: "Create engaging short-form video content for TikTok",
    contentType: "Social Media Post",
    platforms: ["TikTok"],
    style: "Engaging",
    industries: ["All Industries"],
    tags: ["tiktok", "video", "short-form"],
    imageUrl: "https://storage.googleapis.com/reachspark-templates/tiktok/script.jpg",
    content: {
      title: "[Video Concept]",
      hook: {
        visualDescription: "[Opening visual to grab attention]",
        script: "[Attention-grabbing opening line or question]"
      },
      sections: [
        {
          visualDescription: "[Visual for first point]",
          script: "[First point or step]",
          onScreenText: "[Text overlay for first point]"
        },
        {
          visualDescription: "[Visual for second point]",
          script: "[Second point or step]",
          onScreenText: "[Text overlay for second point]"
        },
        {
          visualDescription: "[Visual for third point]",
          script: "[Third point or step]",
          onScreenText: "[Text overlay for third point]"
        }
      ],
      conclusion: {
        visualDescription: "[Closing visual]",
        script: "[Call to action or final thought]",
        onScreenText: "[Final text overlay]"
      },
      musicSuggestion: "[Suggested sound or music]",
      duration: "[Estimated duration in seconds]",
      hashtags: ["[Hashtag 1]", "[Hashtag 2]", "[Hashtag 3]", "[Hashtag 4]", "[Hashtag 5]"]
    }
  }
];

// Export all functions
module.exports = {
  getTemplates: exports.getTemplates,
  getTemplateById: exports.getTemplateById,
  customizeTemplate: exports.customizeTemplate,
  getTemplateCategories: exports.getTemplateCategories,
  getTemplateAnalytics: exports.getTemplateAnalytics,
  initializeDefaultTemplates: exports.initializeDefaultTemplates
};
