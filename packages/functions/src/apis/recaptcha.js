/**
 * reCAPTCHA API Integration for ReachSpark
 * 
 * This module provides functions to verify reCAPTCHA tokens for form protection.
 */

const functions = require('firebase-functions');
const axios = require('axios');

// reCAPTCHA credentials
const RECAPTCHA_SITE_KEY = '6LdmqiYrAAAAAI2IaRldvJ9K0FJSEfTCQaqh_k_6';
const RECAPTCHA_SECRET_KEY = '6LdmqiYrAAAAALzwLW7vWAsUJ9jAm5ByyMrXG6Zm';
const SITE_DOMAIN = 'reachspark.ai';

/**
 * Verify a reCAPTCHA token
 * @param {string} token - The reCAPTCHA token to verify
 * @returns {Promise<Object>} Verification result
 */
const verifyRecaptchaToken = async (token) => {
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );
    
    const { success, score, action, hostname } = response.data;
    
    // For v3 reCAPTCHA, check the score (0.0 to 1.0, where 1.0 is very likely a good interaction)
    // For v2 reCAPTCHA, we'll just have success true/false
    if (success) {
      // For v3, we might want to check the score and action
      if (score !== undefined) {
        // Verify the action matches what we expect
        return {
          success: true,
          score,
          action,
          isLegitimate: score > 0.5, // Threshold can be adjusted based on security needs
          message: score > 0.5 ? 'Verification successful' : 'Suspicious activity detected'
        };
      }
      
      return {
        success: true,
        message: 'Verification successful'
      };
    }
    
    return {
      success: false,
      message: 'reCAPTCHA verification failed'
    };
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error.response?.data || error.message);
    throw new Error('Failed to verify reCAPTCHA token');
  }
};

/**
 * Get the reCAPTCHA site key for client-side implementation
 * @returns {Object} Site key and domain information
 */
const getRecaptchaSiteKey = () => {
  return {
    siteKey: RECAPTCHA_SITE_KEY,
    domain: SITE_DOMAIN
  };
};

module.exports = {
  verifyRecaptchaToken,
  getRecaptchaSiteKey
};
