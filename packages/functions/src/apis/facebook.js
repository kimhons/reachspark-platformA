// Facebook API Integration for ReachSpark
// Path: /home/ubuntu/reachspark-github-repo/packages/functions/src/apis/facebook.js

const functions = require('firebase-functions');
const axios = require('axios');

// Facebook API credentials
const FB_APP_ID = '1671212783767380';
const FB_APP_SECRET = '824e079f3888a5cc579b272b9ac115e5';

/**
 * Get a Facebook user access token using the app credentials
 * @param {string} userAccessToken - Short-lived user access token from login
 * @returns {Promise<string>} Long-lived user access token
 */
const getLongLivedUserToken = async (userAccessToken) => {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: FB_APP_ID,
        client_secret: FB_APP_SECRET,
        fb_exchange_token: userAccessToken
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting long-lived token:', error.response?.data || error.message);
    throw new Error('Failed to get long-lived Facebook token');
  }
};

/**
 * Get a page access token for a specific Facebook page
 * @param {string} userAccessToken - User access token
 * @param {string} pageId - ID of the Facebook page
 * @returns {Promise<string>} Page access token
 */
const getPageAccessToken = async (userAccessToken, pageId) => {
  try {
    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        fields: 'access_token',
        access_token: userAccessToken
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting page access token:', error.response?.data || error.message);
    throw new Error('Failed to get Facebook page access token');
  }
};

/**
 * Get a list of pages managed by the user
 * @param {string} userAccessToken - User access token
 * @returns {Promise<Array>} List of pages with their IDs and names
 */
const getUserPages = async (userAccessToken) => {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: userAccessToken
      }
    });
    
    return response.data.data.map(page => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token
    }));
  } catch (error) {
    console.error('Error getting user pages:', error.response?.data || error.message);
    throw new Error('Failed to get Facebook pages');
  }
};

/**
 * Post content to a Facebook page
 * @param {string} pageAccessToken - Page access token
 * @param {string} pageId - ID of the Facebook page
 * @param {string} message - Text content to post
 * @param {string} [imageUrl] - Optional URL of image to include
 * @returns {Promise<Object>} Post creation result
 */
const createPagePost = async (pageAccessToken, pageId, message, imageUrl = null) => {
  try {
    const postData = { message };
    
    if (imageUrl) {
      // If image URL is provided, create a post with an image
      postData.link = imageUrl;
    }
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      null,
      {
        params: {
          ...postData,
          access_token: pageAccessToken
        }
      }
    );
    
    return {
      success: true,
      postId: response.data.id,
      url: `https://facebook.com/${response.data.id}`
    };
  } catch (error) {
    console.error('Error creating Facebook post:', error.response?.data || error.message);
    throw new Error('Failed to create Facebook post');
  }
};

/**
 * Schedule a post to be published at a future time
 * @param {string} pageAccessToken - Page access token
 * @param {string} pageId - ID of the Facebook page
 * @param {string} message - Text content to post
 * @param {string} scheduledPublishTime - Unix timestamp when the post should be published
 * @param {string} [imageUrl] - Optional URL of image to include
 * @returns {Promise<Object>} Scheduled post creation result
 */
const schedulePagePost = async (pageAccessToken, pageId, message, scheduledPublishTime, imageUrl = null) => {
  try {
    const postData = {
      message,
      published: false,
      scheduled_publish_time: scheduledPublishTime
    };
    
    if (imageUrl) {
      postData.link = imageUrl;
    }
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      null,
      {
        params: {
          ...postData,
          access_token: pageAccessToken
        }
      }
    );
    
    return {
      success: true,
      postId: response.data.id,
      scheduledTime: scheduledPublishTime
    };
  } catch (error) {
    console.error('Error scheduling Facebook post:', error.response?.data || error.message);
    throw new Error('Failed to schedule Facebook post');
  }
};

/**
 * Get insights for a Facebook page
 * @param {string} pageAccessToken - Page access token
 * @param {string} pageId - ID of the Facebook page
 * @param {string} metrics - Comma-separated list of metrics to retrieve
 * @param {number} [period=30] - Time period in days
 * @returns {Promise<Object>} Page insights data
 */
const getPageInsights = async (pageAccessToken, pageId, metrics, period = 30) => {
  try {
    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/insights`, {
      params: {
        metric: metrics,
        period: 'day',
        date_preset: `last_${period}_days`,
        access_token: pageAccessToken
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error getting page insights:', error.response?.data || error.message);
    throw new Error('Failed to get Facebook page insights');
  }
};

/**
 * Get engagement data for a specific post
 * @param {string} pageAccessToken - Page access token
 * @param {string} postId - ID of the post
 * @returns {Promise<Object>} Post engagement data
 */
const getPostEngagement = async (pageAccessToken, postId) => {
  try {
    const response = await axios.get(`https://graph.facebook.com/v18.0/${postId}`, {
      params: {
        fields: 'likes.summary(true),comments.summary(true),shares',
        access_token: pageAccessToken
      }
    });
    
    return {
      likes: response.data.likes?.summary?.total_count || 0,
      comments: response.data.comments?.summary?.total_count || 0,
      shares: response.data.shares?.count || 0
    };
  } catch (error) {
    console.error('Error getting post engagement:', error.response?.data || error.message);
    throw new Error('Failed to get Facebook post engagement data');
  }
};

module.exports = {
  getLongLivedUserToken,
  getPageAccessToken,
  getUserPages,
  createPagePost,
  schedulePagePost,
  getPageInsights,
  getPostEngagement
};
