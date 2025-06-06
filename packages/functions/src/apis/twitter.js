/**
 * Twitter API Integration
 * 
 * This module provides functions to interact with the Twitter API
 * to search tweets and get user tweets.
 */

const functions = require('firebase-functions');
const { logger } = require('firebase-functions');
const axios = require('axios');

/**
 * Search Twitter for tweets matching a query
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.query - The query to search for
 * @param {number} params.count - Number of tweets to return (default: 20)
 * @param {string} params.type - Type of search (Top, Photos, Videos, People, Latest)
 * @param {string} params.cursor - Cursor for pagination
 * @returns {Promise<Object>} - Search results
 */
async function searchTwitter(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('Twitter/search_twitter', {
            query: params.query,
            count: params.count || 20,
            type: params.type || 'Top',
            cursor: params.cursor || ''
        });
        
        return response;
    } catch (error) {
        logger.error('Error searching Twitter:', error);
        throw new Error(`Failed to search Twitter: ${error.message}`);
    }
}

/**
 * Get tweets from a specific user
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.user - The user ID (rest_id)
 * @param {number} params.count - Number of tweets to return (default: 20)
 * @param {string} params.cursor - Cursor for pagination
 * @returns {Promise<Object>} - User tweets
 */
async function getUserTweets(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('Twitter/get_user_tweets', {
            user: params.user,
            count: params.count || 20,
            cursor: params.cursor || ''
        });
        
        return response;
    } catch (error) {
        logger.error('Error getting user tweets:', error);
        throw new Error(`Failed to get user tweets: ${error.message}`);
    }
}

/**
 * Get user profile by username
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.username - Twitter username
 * @returns {Promise<Object>} - User profile data
 */
async function getUserProfile(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('Twitter/get_user_profile_by_username', {
            username: params.username
        });
        
        return response;
    } catch (error) {
        logger.error('Error getting user profile:', error);
        throw new Error(`Failed to get user profile: ${error.message}`);
    }
}

/**
 * Helper function to call the datasource API
 * 
 * @param {string} apiName - Name of the API to call
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} - API response
 */
async function callDataSourceAPI(apiName, query) {
    try {
        // In a real implementation, this would use the actual datasource API client
        // For now, we'll simulate it with a direct API call
        const url = `https://api.example.com/${apiName}`;
        const response = await axios.get(url, { params: query });
        return response.data;
    } catch (error) {
        logger.error(`Error calling datasource API ${apiName}:`, error);
        throw new Error(`Failed to call datasource API: ${error.message}`);
    }
}

module.exports = {
    searchTwitter,
    getUserTweets,
    getUserProfile
};
