/**
 * Yahoo Finance API Integration
 * 
 * This module provides functions to interact with the Yahoo Finance API
 * to get stock data, charts, profiles, and other financial information.
 */

const functions = require('firebase-functions');
const { logger } = require('firebase-functions');
const axios = require('axios');

/**
 * Get stock chart data
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.symbol - Stock symbol (e.g., AAPL)
 * @param {string} params.region - Region (default: US)
 * @param {string} params.interval - Time interval (1m, 2m, 5m, 15m, 30m, 60m, 1d, 1wk, 1mo)
 * @param {string} params.range - Time range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
 * @returns {Promise<Object>} - Stock chart data
 */
async function getStockChart(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('YahooFinance/get_stock_chart', {
            symbol: params.symbol,
            region: params.region || 'US',
            interval: params.interval || '1d',
            range: params.range || '1mo',
            includeAdjustedClose: true
        });
        
        return response;
    } catch (error) {
        logger.error('Error getting stock chart:', error);
        throw new Error(`Failed to get stock chart: ${error.message}`);
    }
}

/**
 * Get stock profile information
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.symbol - Stock symbol (e.g., AAPL)
 * @param {string} params.region - Region (default: US)
 * @returns {Promise<Object>} - Stock profile data
 */
async function getStockProfile(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('YahooFinance/get_stock_profile', {
            symbol: params.symbol,
            region: params.region || 'US'
        });
        
        return response;
    } catch (error) {
        logger.error('Error getting stock profile:', error);
        throw new Error(`Failed to get stock profile: ${error.message}`);
    }
}

/**
 * Get stock holders information
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.symbol - Stock symbol (e.g., AAPL)
 * @param {string} params.region - Region (default: US)
 * @returns {Promise<Object>} - Stock holders data
 */
async function getStockHolders(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('YahooFinance/get_stock_holders', {
            symbol: params.symbol,
            region: params.region || 'US'
        });
        
        return response;
    } catch (error) {
        logger.error('Error getting stock holders:', error);
        throw new Error(`Failed to get stock holders: ${error.message}`);
    }
}

/**
 * Get stock insights
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.symbol - Stock symbol (e.g., AAPL)
 * @returns {Promise<Object>} - Stock insights data
 */
async function getStockInsights(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('YahooFinance/get_stock_insights', {
            symbol: params.symbol
        });
        
        return response;
    } catch (error) {
        logger.error('Error getting stock insights:', error);
        throw new Error(`Failed to get stock insights: ${error.message}`);
    }
}

/**
 * Get stock SEC filings
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.symbol - Stock symbol (e.g., AAPL)
 * @param {string} params.region - Region (default: US)
 * @returns {Promise<Object>} - SEC filing data
 */
async function getStockSecFiling(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('YahooFinance/get_stock_sec_filing', {
            symbol: params.symbol,
            region: params.region || 'US'
        });
        
        return response;
    } catch (error) {
        logger.error('Error getting SEC filings:', error);
        throw new Error(`Failed to get SEC filings: ${error.message}`);
    }
}

/**
 * Get analyst reports for a stock
 * 
 * @param {Object} params - Request parameters
 * @param {string} params.symbol - Stock symbol (e.g., AAPL)
 * @param {string} params.region - Region (default: US)
 * @returns {Promise<Object>} - Analyst reports data
 */
async function getAnalystReports(params) {
    try {
        // Use the built-in datasource API
        const response = await callDataSourceAPI('YahooFinance/get_stock_what_analyst_are_saying', {
            symbol: params.symbol,
            region: params.region || 'US'
        });
        
        return response;
    } catch (error) {
        logger.error('Error getting analyst reports:', error);
        throw new Error(`Failed to get analyst reports: ${error.message}`);
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
    getStockChart,
    getStockProfile,
    getStockHolders,
    getStockInsights,
    getStockSecFiling,
    getAnalystReports
};
