// TikTok API Integration for ReachSpark
// Path: /home/ubuntu/reachspark-github-repo/packages/functions/src/apis/tiktok.js

const functions = require('firebase-functions');
const axios = require('axios');

// TikTok API credentials - These should be set via Firebase config in production
// For development, we'll use placeholder values that should be replaced
const TIKTOK_CLIENT_KEY = functions.config().tiktok?.client_key || 'YOUR_TIKTOK_CLIENT_KEY';
const TIKTOK_CLIENT_SECRET = functions.config().tiktok?.client_secret || 'YOUR_TIKTOK_CLIENT_SECRET';
const TIKTOK_API_BASE_URL = 'https://open.tiktokapis.com/v2';

/**
 * Get a TikTok access token using the authorization code
 * @param {string} authCode - Authorization code from TikTok OAuth flow
 * @param {string} redirectUri - Redirect URI used in the OAuth flow
 * @returns {Promise<Object>} Access token and related data
 */
const getAccessToken = async (authCode, redirectUri) => {
  try {
    const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', null, {
      params: {
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code: authCode,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }
    });
    
    if (response.data.data && response.data.data.access_token) {
      return {
        accessToken: response.data.data.access_token,
        refreshToken: response.data.data.refresh_token,
        openId: response.data.data.open_id,
        expiresIn: response.data.data.expires_in,
        scope: response.data.data.scope
      };
    } else {
      throw new Error('Invalid response from TikTok API');
    }
  } catch (error) {
    console.error('Error getting TikTok access token:', error.response?.data || error.message);
    throw new Error('Failed to get TikTok access token');
  }
};

/**
 * Refresh a TikTok access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token and related data
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post('https://open-api.tiktok.com/oauth/refresh_token/', null, {
      params: {
        client_key: TIKTOK_CLIENT_KEY,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }
    });
    
    if (response.data.data && response.data.data.access_token) {
      return {
        accessToken: response.data.data.access_token,
        refreshToken: response.data.data.refresh_token,
        openId: response.data.data.open_id,
        expiresIn: response.data.data.expires_in,
        scope: response.data.data.scope
      };
    } else {
      throw new Error('Invalid response from TikTok API');
    }
  } catch (error) {
    console.error('Error refreshing TikTok access token:', error.response?.data || error.message);
    throw new Error('Failed to refresh TikTok access token');
  }
};

/**
 * Get user info from TikTok
 * @param {string} accessToken - Access token
 * @param {string} openId - Open ID of the user
 * @returns {Promise<Object>} User information
 */
const getUserInfo = async (accessToken, openId) => {
  try {
    const response = await axios.get(`${TIKTOK_API_BASE_URL}/user/info/`, {
      params: {
        fields: 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.data.data) {
      return response.data.data;
    } else {
      throw new Error('Invalid response from TikTok API');
    }
  } catch (error) {
    console.error('Error getting TikTok user info:', error.response?.data || error.message);
    throw new Error('Failed to get TikTok user info');
  }
};

/**
 * Create a video post on TikTok using Content Posting API
 * @param {string} accessToken - Access token
 * @param {string} videoUrl - URL of the video to post
 * @param {string} caption - Caption for the video
 * @param {Array<string>} [hashtags=[]] - Array of hashtags to include
 * @returns {Promise<Object>} Post creation result
 */
const createVideoPost = async (accessToken, videoUrl, caption, hashtags = []) => {
  try {
    // Format hashtags
    const formattedHashtags = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
    const fullCaption = formattedHashtags ? `${caption} ${formattedHashtags}` : caption;
    
    // First, upload the video to TikTok
    const uploadResponse = await axios.post(`${TIKTOK_API_BASE_URL}/post/publish/video/init/`, {
      post_info: {
        title: fullCaption,
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl
      }
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!uploadResponse.data.data || !uploadResponse.data.data.publish_id) {
      throw new Error('Failed to initialize video upload');
    }
    
    const publishId = uploadResponse.data.data.publish_id;
    
    // Check status and finalize the post
    const statusResponse = await axios.post(`${TIKTOK_API_BASE_URL}/post/publish/status/fetch/`, {
      publish_id: publishId
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Return the result with the publish ID for status tracking
    return {
      success: true,
      publishId: publishId,
      status: statusResponse.data.data?.status || 'PROCESSING',
      message: 'Video post initiated successfully'
    };
  } catch (error) {
    console.error('Error creating TikTok video post:', error.response?.data || error.message);
    throw new Error('Failed to create TikTok video post');
  }
};

/**
 * Check the status of a video post
 * @param {string} accessToken - Access token
 * @param {string} publishId - Publish ID from createVideoPost
 * @returns {Promise<Object>} Post status
 */
const checkPostStatus = async (accessToken, publishId) => {
  try {
    const response = await axios.post(`${TIKTOK_API_BASE_URL}/post/publish/status/fetch/`, {
      publish_id: publishId
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.data) {
      return {
        status: response.data.data.status,
        videoId: response.data.data.video_id,
        shareUrl: response.data.data.share_url,
        failReason: response.data.data.fail_reason
      };
    } else {
      throw new Error('Invalid response from TikTok API');
    }
  } catch (error) {
    console.error('Error checking TikTok post status:', error.response?.data || error.message);
    throw new Error('Failed to check TikTok post status');
  }
};

/**
 * Get video insights/analytics
 * @param {string} accessToken - Access token
 * @param {string} videoId - ID of the video
 * @returns {Promise<Object>} Video insights data
 */
const getVideoInsights = async (accessToken, videoId) => {
  try {
    const response = await axios.get(`${TIKTOK_API_BASE_URL}/research/video/query/`, {
      params: {
        fields: 'id,like_count,comment_count,share_count,view_count,engagement_rate',
        video_ids: videoId
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.data.data && response.data.data.videos) {
      return response.data.data.videos[0];
    } else {
      throw new Error('Invalid response from TikTok API');
    }
  } catch (error) {
    console.error('Error getting TikTok video insights:', error.response?.data || error.message);
    throw new Error('Failed to get TikTok video insights');
  }
};

/**
 * Get user's videos
 * @param {string} accessToken - Access token
 * @param {number} [limit=10] - Number of videos to retrieve
 * @returns {Promise<Array>} List of user's videos
 */
const getUserVideos = async (accessToken, limit = 10) => {
  try {
    const response = await axios.get(`${TIKTOK_API_BASE_URL}/video/list/`, {
      params: {
        fields: 'id,create_time,cover_image_url,share_url,video_description,like_count,comment_count,share_count,view_count',
        max_count: limit
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.data.data && response.data.data.videos) {
      return response.data.data.videos;
    } else {
      throw new Error('Invalid response from TikTok API');
    }
  } catch (error) {
    console.error('Error getting TikTok user videos:', error.response?.data || error.message);
    throw new Error('Failed to get TikTok user videos');
  }
};

/**
 * Generate OAuth authorization URL for TikTok
 * @param {string} redirectUri - Redirect URI for the OAuth flow
 * @param {Array<string>} scopes - Array of permission scopes
 * @param {string} [state=''] - Optional state parameter for security
 * @returns {string} Authorization URL
 */
const generateAuthUrl = (redirectUri, scopes, state = '') => {
  const scopeString = scopes.join(',');
  const baseUrl = 'https://www.tiktok.com/v2/auth/authorize/';
  
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    redirect_uri: redirectUri,
    scope: scopeString,
    response_type: 'code',
    state: state
  });
  
  return `${baseUrl}?${params.toString()}`;
};

module.exports = {
  getAccessToken,
  refreshAccessToken,
  getUserInfo,
  createVideoPost,
  checkPostStatus,
  getVideoInsights,
  getUserVideos,
  generateAuthUrl
};
