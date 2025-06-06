/**
 * RapidAPI Twitter Integration for ReachSpark
 * 
 * This module provides Twitter functionality through RapidAPI as an alternative
 * to the official Twitter API while waiting for Developer Agreement approval.
 */

const functions = require('firebase-functions');
const axios = require('axios');

// RapidAPI credentials
const RAPIDAPI_KEY = functions.config().rapidapi?.key || 'e97d7e3f7cmsh2a4804bdc7d4622p1b10a6jsn6266c3123259';
const RAPIDAPI_HOST = functions.config().rapidapi?.host || 'twitter-v1.p.rapidapi.com';
const RAPIDAPI_APP = 'default-application_10517745';

/**
 * Get user profile by username
 * @param {string} username - Twitter username without @
 * @returns {Promise<Object>} User profile data
 */
const getUserProfile = async (username) => {
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/user/details`, {
      params: { username },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting Twitter profile:', error.response?.data || error.message);
    throw new Error('Failed to get Twitter profile');
  }
};

/**
 * Get user tweets
 * @param {string} username - Twitter username without @
 * @param {number} count - Number of tweets to retrieve
 * @returns {Promise<Array>} List of tweets
 */
const getUserTweets = async (username, count = 10) => {
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/user/tweets`, {
      params: { username, count },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting tweets:', error.response?.data || error.message);
    throw new Error('Failed to get tweets');
  }
};

/**
 * Search tweets by keyword
 * @param {string} query - Search query
 * @param {number} count - Number of results to retrieve
 * @returns {Promise<Array>} Search results
 */
const searchTweets = async (query, count = 10) => {
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/search`, {
      params: { query, count },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching tweets:', error.response?.data || error.message);
    throw new Error('Failed to search tweets');
  }
};

/**
 * Get trending topics
 * @param {string} location - Location ID (defaults to worldwide)
 * @returns {Promise<Array>} List of trending topics
 */
const getTrends = async (location = 1) => {
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/trends`, {
      params: { location },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting trends:', error.response?.data || error.message);
    throw new Error('Failed to get trending topics');
  }
};

/**
 * Get tweet details by ID
 * @param {string} id - Tweet ID
 * @returns {Promise<Object>} Tweet details
 */
const getTweetById = async (id) => {
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/tweet/details`, {
      params: { id },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting tweet details:', error.response?.data || error.message);
    throw new Error('Failed to get tweet details');
  }
};

module.exports = {
  getUserProfile,
  getUserTweets,
  searchTweets,
  getTrends,
  getTweetById
};
