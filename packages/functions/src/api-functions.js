/**
 * Firebase Cloud Functions for API integrations
 */

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { openai, elevenlabs, gemini, stripe, tiktok } = require('./apis');

/**
 * Generate content using OpenAI API
 */
exports.generateContent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { type, topic, tone, length, model } = req.body;

      // Validate parameters
      if (!type || !topic || !tone || !length) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      let result;
      
      // Generate content based on selected model
      if (model === 'gemini') {
        result = await gemini.generateMarketingContent({
          type,
          topic,
          tone,
          length
        });
      } else {
        // Default to OpenAI
        result = await openai.generateMarketingContent({
          type,
          topic,
          tone,
          length
        });
      }

      // Return generated content
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error generating content:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate content with image using Gemini API
 */
exports.generateContentWithImage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { prompt, image_url, max_tokens, temperature } = req.body;

      // Validate parameters
      if (!prompt || !image_url) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate content with image
      const result = await gemini.generateContentWithImage({
        prompt,
        image_url,
        max_tokens: max_tokens || 800,
        temperature: temperature || 0.7
      });

      // Return generated content
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error generating content with image:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate audio using ElevenLabs API
 */
exports.generateAudio = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { content, voice_type } = req.body;

      // Validate parameters
      if (!content || !voice_type) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Generate audio
      const result = await elevenlabs.generateMarketingAudio({
        content,
        voice_type
      });

      // Set response headers
      res.set('Content-Type', result.contentType);
      
      // Return generated audio
      return res.status(200).send(result.audio);
    } catch (error) {
      console.error('Error generating audio:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get available voices from ElevenLabs
 */
exports.getVoices = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get voices
      const voices = await elevenlabs.getVoices();

      // Return voices
      return res.status(200).json(voices);
    } catch (error) {
      console.error('Error getting voices:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get Stripe publishable key
 */
exports.getStripePublishableKey = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get publishable key
      const result = stripe.getPublishableKey();

      // Return publishable key
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error getting Stripe publishable key:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Create payment intent for token purchase
 */
exports.createPaymentIntent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { amount, currency, description, customer_id } = req.body;

      // Validate parameters
      if (!amount || !description) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Create payment intent
      const result = await stripe.createPaymentIntent({
        amount,
        currency: currency || 'usd',
        description,
        customer_id
      });

      // Return payment intent
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Generate TikTok authorization URL
 */
exports.getTikTokAuthUrl = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { redirect_uri, state } = req.query;

      // Validate parameters
      if (!redirect_uri) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Define required scopes for content posting
      const scopes = [
        'user.info.basic',
        'video.upload',
        'video.publish',
        'video.list',
        'video.info'
      ];

      // Generate authorization URL
      const authUrl = tiktok.generateAuthUrl(redirect_uri, scopes, state || '');

      // Return authorization URL
      return res.status(200).json({ auth_url: authUrl });
    } catch (error) {
      console.error('Error generating TikTok auth URL:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Exchange TikTok authorization code for access token
 */
exports.getTikTokAccessToken = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { code, redirect_uri } = req.body;

      // Validate parameters
      if (!code || !redirect_uri) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Exchange code for access token
      const tokenData = await tiktok.getAccessToken(code, redirect_uri);

      // Return token data
      return res.status(200).json(tokenData);
    } catch (error) {
      console.error('Error getting TikTok access token:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Create TikTok video post
 */
exports.createTikTokPost = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is POST
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from request body
      const { access_token, video_url, caption, hashtags } = req.body;

      // Validate parameters
      if (!access_token || !video_url || !caption) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Create video post
      const result = await tiktok.createVideoPost(
        access_token,
        video_url,
        caption,
        hashtags || []
      );

      // Return result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error creating TikTok post:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Check TikTok post status
 */
exports.checkTikTokPostStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { access_token, publish_id } = req.query;

      // Validate parameters
      if (!access_token || !publish_id) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Check post status
      const status = await tiktok.checkPostStatus(access_token, publish_id);

      // Return status
      return res.status(200).json(status);
    } catch (error) {
      console.error('Error checking TikTok post status:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get TikTok user videos
 */
exports.getTikTokUserVideos = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { access_token, limit } = req.query;

      // Validate parameters
      if (!access_token) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get user videos
      const videos = await tiktok.getUserVideos(
        access_token,
        limit ? parseInt(limit) : 10
      );

      // Return videos
      return res.status(200).json({ videos });
    } catch (error) {
      console.error('Error getting TikTok user videos:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Get TikTok video insights
 */
exports.getTikTokVideoInsights = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Check if request method is GET
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get parameters from query
      const { access_token, video_id } = req.query;

      // Validate parameters
      if (!access_token || !video_id) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get video insights
      const insights = await tiktok.getVideoInsights(access_token, video_id);

      // Return insights
      return res.status(200).json(insights);
    } catch (error) {
      console.error('Error getting TikTok video insights:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});
