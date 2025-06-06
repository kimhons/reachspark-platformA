/**
 * LinkedIn API Integration
 * 
 * This module provides functions to interact with the LinkedIn API
 * to search for people and get user profiles.
 */

const functions = require('firebase-functions');
const { logger } = require('firebase-functions');
const axios = require('axios');

/**
 * Get LinkedIn user profile by username
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.username - LinkedIn username
 * @returns {Promise<Object>} - User profile data
 */
async function getUserProfile(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('LinkedIn/get_user_profile_by_username', {
            username: params.username
        });
        
        return response;
    } catch (error) {
        logger.error('Error getting LinkedIn user profile:', error);
        throw new Error(`Failed to get LinkedIn user profile: ${error.message}`);
    }
}

/**
 * Search for people on LinkedIn
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.keywords - Keywords to search for
 * @param {string} params.company - Filter by company
 * @param {string} params.title - Filter by job title
 * @returns {Promise<Object>} - Search results
 */
async function searchPeople(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('LinkedIn/search_people', {
            keywords: params.keywords,
            company: params.company,
            title: params.title
        });
        
        return response;
    } catch (error) {
        logger.error('Error searching LinkedIn people:', error);
        throw new Error(`Failed to search LinkedIn people: ${error.message}`);
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
    getUserProfile,
    searchPeople
};
