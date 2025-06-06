/**
 * Feature Integration Module
 * 
 * This module exports all the killer features implemented for the ReachSpark platform.
 */

const aiMarketingCopilot = require('./aiMarketingCopilot');
const aiMarketingCopilotAutonomous = require('./aiMarketingCopilotAutonomous');
const predictiveCustomerJourney = require('./predictiveCustomerJourney');
const integratedInfluencerMarketplace = require('./integratedInfluencerMarketplace');
const semanticContentIntelligence = require('./semanticContentIntelligence');
const revenueAttributionAI = require('./revenueAttributionAI');
const omnichannelPersonalizationEngine = require('./omnichannelPersonalizationEngine');

module.exports = {
  aiMarketingCopilot,
  aiMarketingCopilotAutonomous,
  predictiveCustomerJourney,
  integratedInfluencerMarketplace,
  semanticContentIntelligence,
  revenueAttributionAI,
  omnichannelPersonalizationEngine
};
