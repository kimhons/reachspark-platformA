/**
 * API Integration Module
 * 
 * This module exports all API integrations for the ReachSpark platform.
 */

const streamingAvailability = require('./streamingAvailability');
const twitter = require('./twitter');
const linkedin = require('./linkedin');
const yahooFinance = require('./yahooFinance');
const encryption = require('./encryption');
const openai = require('./openai');
const elevenlabs = require('./elevenlabs');
const gemini = require('./gemini');
const claude = require('./claude');
const stripe = require('./stripe');
const facebook = require('./facebook');
const recaptcha = require('./recaptcha');
const rapidapiTwitter = require('./rapidapi-twitter');
const tiktok = require('./tiktok');

module.exports = {
    streamingAvailability,
    twitter,
    linkedin,
    yahooFinance,
    encryption,
    openai,
    elevenlabs,
    gemini,
    claude,
    stripe,
    facebook,
    recaptcha,
    rapidapiTwitter,
    tiktok
};
