/**
 * Streaming Availability API Integration
 * 
 * This module provides functions to interact with the Streaming Availability API
 * from RapidAPI to get information about movies and TV shows available on
 * various streaming platforms.
 */

const axios = require('axios');
const functions = require('firebase-functions');
const { logger } = require('firebase-functions');

// RapidAPI configuration
const RAPIDAPI_KEY = functions.config().rapidapi?.key || "323a7718e9msh11cc344f3e02f21p13bdb6jsna618ef9f91a4";
const RAPIDAPI_HOST = "streaming-availability.p.rapidapi.com";

/**
 * Search for movies and TV shows by basic criteria
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.country - Country code (e.g., "us", "uk", "ca")
 * @param {string} params.service - Streaming service (e.g., "netflix", "prime", "disney", "hbo", "hulu", "peacock", "paramount", "starz", "showtime", "apple", "mubi")
 * @param {string} params.type - Content type ("movie" or "series")
 * @param {string} params.genre - Genre ID (see API documentation for IDs)
 * @param {number} params.page - Page number for pagination
 * @param {string} params.language - Language for results
 * @param {string} params.output_language - Language for output
 * @returns {Promise<Object>} - Search results
 */
async function searchBasic(params) {
    try {
        const options = {
            method: 'GET',
            url: 'https://streaming-availability.p.rapidapi.com/search/basic',
            params: {
                country: params.country || 'us',
                service: params.service || 'netflix',
                type: params.type || 'movie',
                genre: params.genre || '18',
                page: params.page || '1',
                output_language: params.output_language || 'en',
                language: params.language || 'en'
            },
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            }
        };

        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        logger.error('Error searching streaming availability:', error);
        throw new Error(`Failed to search streaming availability: ${error.message}`);
    }
}

/**
 * Get detailed information about a specific title by ID
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.tmdb_id - TMDB ID of the title
 * @param {string} params.country - Country code (e.g., "us", "uk", "ca")
 * @returns {Promise<Object>} - Title details
 */
async function getTitleDetails(params) {
    try {
        const options = {
            method: 'GET',
            url: 'https://streaming-availability.p.rapidapi.com/get/title',
            params: {
                tmdb_id: params.tmdb_id,
                country: params.country || 'us'
            },
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            }
        };

        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        logger.error('Error getting title details:', error);
        throw new Error(`Failed to get title details: ${error.message}`);
    }
}

/**
 * Search for movies and TV shows by advanced criteria
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.country - Country code
 * @param {string} params.services - Comma-separated list of services
 * @param {string} params.type - Content type
 * @param {string} params.order_by - Ordering criteria
 * @param {string} params.year_min - Minimum year
 * @param {string} params.year_max - Maximum year
 * @param {string} params.min_price - Minimum price
 * @param {string} params.max_price - Maximum price
 * @param {string} params.genres - Comma-separated list of genre IDs
 * @param {string} params.keywords - Keywords to search for
 * @param {string} params.language - Language for results
 * @param {string} params.output_language - Language for output
 * @returns {Promise<Object>} - Search results
 */
async function searchAdvanced(params) {
    try {
        const options = {
            method: 'GET',
            url: 'https://streaming-availability.p.rapidapi.com/search/filters',
            params: {
                country: params.country || 'us',
                services: params.services || 'netflix,prime,disney,hbo',
                type: params.type || 'movie',
                order_by: params.order_by || 'popularity',
                year_min: params.year_min || '2000',
                year_max: params.year_max || '2023',
                min_price: params.min_price,
                max_price: params.max_price,
                genres: params.genres,
                keywords: params.keywords,
                language: params.language || 'en',
                output_language: params.output_language || 'en'
            },
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            }
        };

        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        logger.error('Error performing advanced search:', error);
        throw new Error(`Failed to perform advanced search: ${error.message}`);
    }
}

module.exports = {
    searchBasic,
    getTitleDetails,
    searchAdvanced
};
