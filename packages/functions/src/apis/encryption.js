/**
 * Encryption API Integration
 * 
 * This module provides functions to interact with the Encryption API
 * from RapidAPI to encrypt and decrypt sensitive data.
 */

const axios = require('axios');
const functions = require('firebase-functions');
const { logger } = require('firebase-functions');

// RapidAPI configuration
const RAPIDAPI_KEY = functions.config().rapidapi?.key || "323a7718e9msh11cc344f3e02f21p13bdb6jsna618ef9f91a4";
const RAPIDAPI_HOST = "encryption-api2.p.rapidapi.com";

/**
 * Encrypt text using the Encryption API
 * 
 * @param {Object} params - Encryption parameters
 * @param {string} params.text - Text to encrypt
 * @param {string} params.encryption_key - Key to use for encryption
 * @returns {Promise<Object>} - Encrypted data
 */
async function encryptText(params) {
    try {
        const options = {
            method: 'POST',
            url: 'https://encryption-api2.p.rapidapi.com/enc.php',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            },
            data: {
                text: params.text,
                encryption_key: params.encryption_key
            }
        };

        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        logger.error('Error encrypting text:', error);
        throw new Error(`Failed to encrypt text: ${error.message}`);
    }
}

/**
 * Decrypt text using the Encryption API
 * 
 * @param {Object} params - Decryption parameters
 * @param {string} params.text - Text to decrypt
 * @param {string} params.encryption_key - Key to use for decryption
 * @returns {Promise<Object>} - Decrypted data
 */
async function decryptText(params) {
    try {
        const options = {
            method: 'POST',
            url: 'https://encryption-api2.p.rapidapi.com/dec.php',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            },
            data: {
                text: params.text,
                encryption_key: params.encryption_key
            }
        };

        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        logger.error('Error decrypting text:', error);
        throw new Error(`Failed to decrypt text: ${error.message}`);
    }
}

module.exports = {
    encryptText,
    decryptText
};
