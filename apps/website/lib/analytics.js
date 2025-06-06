// Google Analytics utility for ReachSpark
// Path: /home/ubuntu/reachspark-github-repo/apps/website/lib/analytics.js

// Log page views
export const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-0806D5TNHK', {
      page_path: url,
    });
  }
};

// Log specific events
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track user token usage
export const trackTokenUsage = (tokenAmount, feature) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'token_usage', {
      event_category: 'Tokens',
      event_label: feature,
      value: tokenAmount,
    });
  }
};

// Track AI content generation
export const trackContentGeneration = (contentType, modelUsed, tokensCost) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'content_generation', {
      event_category: 'AI Content',
      content_type: contentType,
      model_used: modelUsed,
      tokens_cost: tokensCost,
    });
  }
};

// Track social media actions
export const trackSocialAction = (platform, actionType) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'social_action', {
      event_category: 'Social Media',
      platform: platform,
      action_type: actionType,
    });
  }
};
