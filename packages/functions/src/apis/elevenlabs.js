/**
 * ElevenLabs API Integration
 * 
 * This module provides functions to interact with ElevenLabs API
 * for text-to-speech capabilities in the ReachSpark platform.
 */

const axios = require('axios');
const functions = require('firebase-functions');
const { logger } = require('firebase-functions');

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = functions.config().elevenlabs?.api_key || "sk_d902decf9f04f1c32295cfcc55e5a03e35712e7d39c5e22f";

/**
 * Convert text to speech using ElevenLabs API
 * 
 * @param {Object} params - Text-to-speech parameters
 * @param {string} params.text - The text to convert to speech
 * @param {string} params.voice_id - The voice ID to use (default: "21m00Tcm4TlvDq8ikWAM" - Rachel)
 * @param {number} params.stability - Voice stability (0-1)
 * @param {number} params.similarity_boost - Voice similarity boost (0-1)
 * @returns {Promise<Object>} - Audio data
 */
async function textToSpeech(params) {
    try {
        const options = {
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${params.voice_id || "21m00Tcm4TlvDq8ikWAM"}`,
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            data: {
                text: params.text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: params.stability || 0.5,
                    similarity_boost: params.similarity_boost || 0.75
                }
            },
            responseType: 'arraybuffer'
        };

        const response = await axios.request(options);
        return {
            audio: response.data,
            contentType: response.headers['content-type']
        };
    } catch (error) {
        logger.error('Error converting text to speech with ElevenLabs:', error);
        throw new Error(`Failed to convert text to speech: ${error.message}`);
    }
}

/**
 * Get available voices from ElevenLabs
 * 
 * @returns {Promise<Object>} - List of available voices
 */
async function getVoices() {
    try {
        const options = {
            method: 'GET',
            url: 'https://api.elevenlabs.io/v1/voices',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY
            }
        };

        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        logger.error('Error getting voices from ElevenLabs:', error);
        throw new Error(`Failed to get voices: ${error.message}`);
    }
}

/**
 * Generate audio for marketing content
 * 
 * @param {Object} params - Marketing audio parameters
 * @param {string} params.content - Marketing content to convert to speech
 * @param {string} params.voice_type - Type of voice (professional, friendly, authoritative)
 * @returns {Promise<Object>} - Generated audio
 */
async function generateMarketingAudio(params) {
    // Map voice types to ElevenLabs voice IDs
    const voiceMap = {
        professional: "21m00Tcm4TlvDq8ikWAM", // Rachel
        friendly: "EXAVITQu4vr4xnSDxMaL",     // Bella
        authoritative: "VR6AewLTigWG4xSOukaG" // Adam
    };

    const voiceId = voiceMap[params.voice_type] || "21m00Tcm4TlvDq8ikWAM";
    
    return textToSpeech({
        text: params.content,
        voice_id: voiceId,
        stability: 0.6,
        similarity_boost: 0.8
    });
}

module.exports = {
    textToSpeech,
    getVoices,
    generateMarketingAudio
};
