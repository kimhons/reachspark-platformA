/**
 * Gemini API Integration
 * 
 * This module provides functions to interact with Google's Gemini API
 * for AI-powered features in the ReachSpark platform.
 */

const axios = require('axios');
const functions = require('firebase-functions');
const { logger } = require('firebase-functions');

// Gemini API configuration
const GEMINI_API_KEY = functions.config().gemini?.api_key || "AIzaSyDYPL45FyFh48IOriMqnUk4SOw3rdh8ty8";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Generate text using Gemini Pro model
 * 
 * @param {Object} params - Text generation parameters
 * @param {string} params.prompt - The prompt to generate text from
 * @param {number} params.max_tokens - Maximum tokens to generate
 * @param {number} params.temperature - Randomness of the generation
 * @returns {Promise<Object>} - Generated text
 */
async function generateText(params) {
    try {
        const options = {
            method: 'POST',
            url: `${GEMINI_API_URL}/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: params.prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: params.max_tokens || 800,
                    temperature: params.temperature || 0.7,
                    topP: 0.95,
                    topK: 40
                }
            }
        };

        const response = await axios.request(options);
        
        // Extract the generated text from the response
        const generatedText = response.data.candidates[0].content.parts[0].text;
        
        return {
            text: generatedText,
            usage: {
                prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
                completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
                total_tokens: (response.data.usageMetadata?.promptTokenCount || 0) + 
                              (response.data.usageMetadata?.candidatesTokenCount || 0)
            }
        };
    } catch (error) {
        logger.error('Error generating text with Gemini:', error);
        throw new Error(`Failed to generate text: ${error.message}`);
    }
}

/**
 * Generate content with image input using Gemini Pro Vision model
 * 
 * @param {Object} params - Content generation parameters
 * @param {string} params.prompt - The text prompt
 * @param {string} params.image_url - URL of the image to analyze
 * @param {number} params.max_tokens - Maximum tokens to generate
 * @param {number} params.temperature - Randomness of the generation
 * @returns {Promise<Object>} - Generated content
 */
async function generateContentWithImage(params) {
    try {
        // Fetch the image and convert to base64
        const imageResponse = await axios.get(params.image_url, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
        const mimeType = imageResponse.headers['content-type'];
        
        const options = {
            method: 'POST',
            url: `${GEMINI_API_URL}/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: params.prompt
                            },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: params.max_tokens || 800,
                    temperature: params.temperature || 0.7,
                    topP: 0.95,
                    topK: 40
                }
            }
        };

        const response = await axios.request(options);
        
        // Extract the generated text from the response
        const generatedText = response.data.candidates[0].content.parts[0].text;
        
        return {
            text: generatedText,
            usage: {
                prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
                completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
                total_tokens: (response.data.usageMetadata?.promptTokenCount || 0) + 
                              (response.data.usageMetadata?.candidatesTokenCount || 0)
            }
        };
    } catch (error) {
        logger.error('Error generating content with image using Gemini:', error);
        throw new Error(`Failed to generate content with image: ${error.message}`);
    }
}

/**
 * Generate marketing content using Gemini
 * 
 * @param {Object} params - Content generation parameters
 * @param {string} params.type - Content type (email, social, blog, ad)
 * @param {string} params.topic - Topic to generate content about
 * @param {string} params.tone - Tone of the content
 * @param {number} params.length - Approximate length in words
 * @returns {Promise<Object>} - Generated marketing content
 */
async function generateMarketingContent(params) {
    const promptMap = {
        email: `Write a marketing email about ${params.topic}. Tone: ${params.tone}. Length: approximately ${params.length} words.`,
        social: `Write a social media post about ${params.topic}. Tone: ${params.tone}. Length: approximately ${params.length} words.`,
        blog: `Write a blog post about ${params.topic}. Tone: ${params.tone}. Length: approximately ${params.length} words.`,
        ad: `Write ad copy about ${params.topic}. Tone: ${params.tone}. Length: approximately ${params.length} words.`
    };

    const prompt = promptMap[params.type] || `Write marketing content about ${params.topic}. Tone: ${params.tone}. Length: approximately ${params.length} words.`;
    
    return generateText({
        prompt,
        max_tokens: Math.min(4000, params.length * 2),
        temperature: 0.7
    });
}

module.exports = {
    generateText,
    generateContentWithImage,
    generateMarketingContent
};
