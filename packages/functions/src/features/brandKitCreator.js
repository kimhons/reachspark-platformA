# Firebase Cloud Function for Brand Kit Creator

/**
 * Firebase Cloud Function to extract brand elements from a website URL
 * This function analyzes a website to extract brand colors, fonts, logo, and brand voice
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const ColorThief = require('colorthief');
const { createCanvas, Image } = require('canvas');
const tinycolor = require('tinycolor2');
const { OpenAI } = require('openai');
const { Claude } = require('../apis/claude');
const { Gemini } = require('../apis/gemini');
const { getModelSelector } = require('../apis');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Claude client
const claude = new Claude({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Initialize Gemini client
const gemini = new Gemini({
  apiKey: process.env.GEMINI_API_KEY
});

// Get model selector
const modelSelector = getModelSelector();

/**
 * Extract brand elements from a website URL
 * @param {string} url - The website URL to analyze
 * @returns {Promise<Object>} - The extracted brand elements
 */
exports.extractBrandElements = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { url } = data;
    
    if (!url) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function requires a "url" parameter.'
      );
    }

    // Normalize URL
    const normalizedUrl = normalizeUrl(url);
    
    // Fetch website content
    const response = await axios.get(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Parse HTML
    const $ = cheerio.load(html);
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Extract domain name for brand name
    const domain = new URL(normalizedUrl).hostname.replace('www.', '');
    const brandName = extractBrandName($, domain);
    
    // Extract colors
    const colors = await extractColors($, document);
    
    // Extract fonts
    const fonts = extractFonts($, document);
    
    // Extract logo
    const logo = extractLogo($, normalizedUrl);
    
    // Extract text content for brand voice analysis
    const textContent = extractTextContent($);
    
    // Analyze brand voice using AI
    const brandVoice = await analyzeBrandVoice(textContent, brandName);
    
    // Return extracted brand elements
    return {
      success: true,
      name: brandName,
      colors,
      fonts,
      logoUrl: logo,
      voice: brandVoice
    };
    
  } catch (error) {
    console.error('Error extracting brand elements:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to extract brand elements: ${error.message}`
    );
  }
});

/**
 * Normalize URL by ensuring it has a protocol
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL
 */
function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Extract brand name from website
 * @param {Object} $ - Cheerio instance
 * @param {string} domain - Domain name as fallback
 * @returns {string} - The extracted brand name
 */
function extractBrandName($, domain) {
  // Try to get brand name from title tag
  const title = $('title').text().trim();
  if (title) {
    // Extract first part of title (usually the brand name)
    const titleParts = title.split(/\s*[|\-–—]\s*/);
    if (titleParts.length > 0 && titleParts[0].length > 0) {
      return titleParts[0].trim();
    }
  }
  
  // Try to get from meta tags
  const metaTitle = $('meta[property="og:site_name"]').attr('content') || 
                   $('meta[name="application-name"]').attr('content');
  if (metaTitle) {
    return metaTitle.trim();
  }
  
  // Try to get from logo alt text
  const logoAlt = $('img[src*="logo"], a[href="/"] img').attr('alt');
  if (logoAlt && logoAlt.length > 0 && logoAlt.length < 30) {
    return logoAlt.trim();
  }
  
  // Fallback to domain name
  // Convert domain to title case (e.g., "example.com" -> "Example")
  const domainParts = domain.split('.');
  if (domainParts.length > 0) {
    const name = domainParts[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  return domain;
}

/**
 * Extract colors from website
 * @param {Object} $ - Cheerio instance
 * @param {Object} document - JSDOM document
 * @returns {Promise<Array>} - Array of extracted colors
 */
async function extractColors($, document) {
  const colors = new Set();
  
  // Extract colors from CSS
  const styleElements = $('style');
  styleElements.each((i, element) => {
    const css = $(element).html();
    const colorMatches = css.match(/#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/gi);
    if (colorMatches) {
      colorMatches.forEach(color => {
        const parsedColor = tinycolor(color);
        if (parsedColor.isValid()) {
          colors.add(parsedColor.toHexString());
        }
      });
    }
  });
  
  // Extract colors from inline styles
  $('[style]').each((i, element) => {
    const style = $(element).attr('style');
    const colorMatches = style.match(/#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/gi);
    if (colorMatches) {
      colorMatches.forEach(color => {
        const parsedColor = tinycolor(color);
        if (parsedColor.isValid()) {
          colors.add(parsedColor.toHexString());
        }
      });
    }
  });
  
  // Extract colors from logo and hero images
  try {
    const logoImg = $('img[src*="logo"], a[href="/"] img').first();
    if (logoImg.length > 0) {
      const logoSrc = logoImg.attr('src');
      if (logoSrc) {
        const logoUrl = new URL(logoSrc, document.baseURI).href;
        const logoColors = await extractImageColors(logoUrl);
        logoColors.forEach(color => colors.add(color));
      }
    }
    
    // Extract colors from hero image
    const heroImg = $('header img, .hero img, .banner img').first();
    if (heroImg.length > 0) {
      const heroSrc = heroImg.attr('src');
      if (heroSrc) {
        const heroUrl = new URL(heroSrc, document.baseURI).href;
        const heroColors = await extractImageColors(heroUrl);
        heroColors.forEach(color => colors.add(color));
      }
    }
  } catch (error) {
    console.error('Error extracting image colors:', error);
  }
  
  // Convert Set to Array and filter out similar colors
  let colorArray = Array.from(colors);
  colorArray = filterSimilarColors(colorArray);
  
  // Ensure we have at least 4 colors
  if (colorArray.length < 4) {
    // Add default colors if needed
    const defaultColors = ['#FFFFFF', '#000000', '#4285F4', '#FBBC05'];
    for (let i = colorArray.length; i < 4; i++) {
      colorArray.push(defaultColors[i]);
    }
  }
  
  // Limit to 8 colors maximum
  return colorArray.slice(0, 8);
}

/**
 * Extract colors from an image URL
 * @param {string} imageUrl - The image URL
 * @returns {Promise<Array>} - Array of extracted colors
 */
async function extractImageColors(imageUrl) {
  try {
    // Fetch image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    // Create image from buffer
    const img = new Image();
    const buffer = Buffer.from(response.data, 'binary');
    img.src = buffer;
    
    // Create canvas and draw image
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Extract dominant colors
    const colorThief = new ColorThief();
    const palette = colorThief.getPalette(img, 5);
    
    // Convert RGB to hex
    return palette.map(rgb => {
      return tinycolor({ r: rgb[0], g: rgb[1], b: rgb[2] }).toHexString();
    });
  } catch (error) {
    console.error('Error extracting image colors:', error);
    return [];
  }
}

/**
 * Filter out similar colors
 * @param {Array} colors - Array of colors
 * @returns {Array} - Filtered array of colors
 */
function filterSimilarColors(colors) {
  const result = [];
  const similarityThreshold = 10; // Adjust as needed
  
  for (const color of colors) {
    const colorObj = tinycolor(color);
    
    // Skip very light or very dark colors
    if (colorObj.getLuminance() > 0.9 || colorObj.getLuminance() < 0.1) {
      continue;
    }
    
    // Check if color is similar to any in result
    const isSimilar = result.some(existingColor => {
      const existing = tinycolor(existingColor);
      return colorObj.isValid() && existing.isValid() && 
             tinycolor.readability(colorObj, existing) < similarityThreshold;
    });
    
    if (!isSimilar && colorObj.isValid()) {
      result.push(color);
    }
  }
  
  return result;
}

/**
 * Extract fonts from website
 * @param {Object} $ - Cheerio instance
 * @param {Object} document - JSDOM document
 * @returns {Object} - Object containing heading and body fonts
 */
function extractFonts($, document) {
  const fonts = new Set();
  
  // Extract fonts from CSS
  const styleElements = $('style');
  styleElements.each((i, element) => {
    const css = $(element).html();
    const fontMatches = css.match(/font-family:\s*([^;]+)/gi);
    if (fontMatches) {
      fontMatches.forEach(match => {
        const fontFamily = match.replace(/font-family:\s*/i, '').trim();
        fonts.add(fontFamily);
      });
    }
  });
  
  // Extract fonts from inline styles
  $('[style*="font-family"]').each((i, element) => {
    const style = $(element).attr('style');
    const fontMatch = style.match(/font-family:\s*([^;]+)/i);
    if (fontMatch && fontMatch[1]) {
      fonts.add(fontMatch[1].trim());
    }
  });
  
  // Extract fonts from Google Fonts links
  $('link[href*="fonts.googleapis.com"]').each((i, element) => {
    const href = $(element).attr('href');
    const familyMatch = href.match(/family=([^&]+)/i);
    if (familyMatch && familyMatch[1]) {
      const families = familyMatch[1].split('|');
      families.forEach(family => {
        const fontName = family.split(':')[0].replace(/\+/g, ' ');
        fonts.add(fontName);
      });
    }
  });
  
  // Convert Set to Array
  const fontArray = Array.from(fonts);
  
  // Determine heading and body fonts
  let headingFont = '';
  let bodyFont = '';
  
  // Check for heading fonts
  $('h1, h2, h3').each((i, element) => {
    const computedStyle = window.getComputedStyle(element);
    const fontFamily = computedStyle.getPropertyValue('font-family');
    if (fontFamily) {
      headingFont = fontFamily.trim();
      return false; // Break the loop
    }
  });
  
  // Check for body fonts
  $('p, div, span').each((i, element) => {
    const computedStyle = window.getComputedStyle(element);
    const fontFamily = computedStyle.getPropertyValue('font-family');
    if (fontFamily) {
      bodyFont = fontFamily.trim();
      return false; // Break the loop
    }
  });
  
  // If no specific fonts found, use the first two from the array
  if (!headingFont && fontArray.length > 0) {
    headingFont = fontArray[0];
  }
  
  if (!bodyFont && fontArray.length > 1) {
    bodyFont = fontArray[1];
  } else if (!bodyFont && fontArray.length > 0) {
    bodyFont = fontArray[0];
  }
  
  // Default fonts if none found
  if (!headingFont) {
    headingFont = 'Arial, sans-serif';
  }
  
  if (!bodyFont) {
    bodyFont = 'Helvetica, Arial, sans-serif';
  }
  
  return {
    heading: headingFont,
    body: bodyFont
  };
}

/**
 * Extract logo from website
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL for resolving relative paths
 * @returns {string} - URL of the logo
 */
function extractLogo($, baseUrl) {
  // Common logo selectors
  const logoSelectors = [
    'img[src*="logo"]',
    'a[href="/"] img',
    'header img',
    '.logo img',
    '#logo img',
    '.navbar-brand img',
    '.brand img'
  ];
  
  for (const selector of logoSelectors) {
    const logoImg = $(selector).first();
    if (logoImg.length > 0) {
      const logoSrc = logoImg.attr('src');
      if (logoSrc) {
        // Resolve relative URL
        try {
          return new URL(logoSrc, baseUrl).href;
        } catch (error) {
          console.error('Error resolving logo URL:', error);
        }
      }
    }
  }
  
  return '';
}

/**
 * Extract text content from website for brand voice analysis
 * @param {Object} $ - Cheerio instance
 * @returns {string} - Extracted text content
 */
function extractTextContent($) {
  let content = '';
  
  // Extract text from headings
  $('h1, h2, h3').each((i, element) => {
    content += $(element).text().trim() + '\n';
  });
  
  // Extract text from paragraphs
  $('p').each((i, element) => {
    content += $(element).text().trim() + '\n';
  });
  
  // Extract text from meta description
  const metaDescription = $('meta[name="description"]').attr('content');
  if (metaDescription) {
    content += metaDescription.trim() + '\n';
  }
  
  // Extract text from about page if available
  $('a[href*="about"]').each((i, element) => {
    const aboutUrl = $(element).attr('href');
    if (aboutUrl) {
      try {
        const aboutResponse = axios.get(aboutUrl);
        const aboutHtml = aboutResponse.data;
        const about$ = cheerio.load(aboutHtml);
        about$('p').each((j, aboutElement) => {
          content += about$(aboutElement).text().trim() + '\n';
        });
      } catch (error) {
        console.error('Error fetching about page:', error);
      }
    }
  });
  
  return content;
}

/**
 * Analyze brand voice using AI
 * @param {string} textContent - Text content from website
 * @param {string} brandName - Brand name
 * @returns {Promise<Object>} - Brand voice analysis
 */
async function analyzeBrandVoice(textContent, brandName) {
  try {
    // Prepare prompt for AI
    const prompt = `
      Analyze the following text content from the website of "${brandName}" and extract the brand voice characteristics.
      
      Text content:
      ${textContent.substring(0, 3000)} // Limit text to avoid token limits
      
      Please provide the following brand voice elements:
      1. Purpose: The 'why' of their communication and content
      2. Audience: The primary people they speak to and serve
      3. Tone: The personality of how the brand sounds and feels (e.g., professional, friendly, authoritative)
      4. Emotions: The feelings they aim to inspire (e.g., trust, excitement, confidence)
      5. Character: The role the brand takes on in interactions (e.g., guide, friend, expert)
      
      Format your response as a JSON object with these fields.
    `;
    
    // Select the best model for this task using the model selector
    const selectedModel = await modelSelector.selectModel({
      task: 'brand_voice_analysis',
      content: prompt,
      priority: 'accuracy'
    });
    
    let result;
    
    // Use the selected AI model
    switch (selectedModel.provider) {
      case 'openai':
        result = await openai.chat.completions.create({
          model: selectedModel.model,
          messages: [
            { role: 'system', content: 'You are a brand voice analysis expert. Extract brand voice characteristics from website content and return them in JSON format.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });
        
        return JSON.parse(result.choices[0].message.content);
        
      case 'anthropic':
        result = await claude.messages.create({
          model: selectedModel.model,
          system: 'You are a brand voice analysis expert. Extract brand voice characteristics from website content and return them in JSON format.',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        });
        
        // Extract JSON from Claude's response
        const claudeContent = result.content[0].text;
        const jsonMatch = claudeContent.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : defaultBrandVoice(brandName);
        
      case 'gemini':
        result = await gemini.generateContent({
          model: selectedModel.model,
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.3
          }
        });
        
        // Extract JSON from Gemini's response
        const geminiContent = result.response.candidates[0].content.parts[0].text;
        const geminiJsonMatch = geminiContent.match(/\{[\s\S]*\}/);
        return geminiJsonMatch ? JSON.parse(geminiJsonMatch[0]) : defaultBrandVoice(brandName);
        
      default:
        // Fallback to default brand voice
        return defaultBrandVoice(brandName);
    }
  } catch (error) {
    console.error('Error analyzing brand voice:', error);
    return defaultBrandVoice(brandName);
  }
}

/**
 * Generate default brand voice when analysis fails
 * @param {string} brandName - Brand name
 * @returns {Object} - Default brand voice
 */
function defaultBrandVoice(brandName) {
  return {
    purpose: `Provide valuable products/services as ${brandName}`,
    audience: 'General consumers interested in our offerings',
    tone: ['Professional', 'Informative', 'Helpful'],
    emotions: ['Trust', 'Confidence', 'Satisfaction'],
    character: ['Expert', 'Guide', 'Provider']
  };
}

/**
 * Generate branded content based on brand kit
 * This function is used for preview and content generation
 */
exports.generateBrandedContent = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { brandKit, contentType } = data;
    
    if (!brandKit) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function requires a "brandKit" parameter.'
      );
    }
    
    // Select the best model for this task using the model selector
    const selectedModel = await modelSelector.selectModel({
      task: 'content_generation',
      priority: 'quality'
    });
    
    // Generate content based on brand kit
    let result;
    let content;
    
    // Prepare prompt
    const prompt = `
      Generate ${contentType} content that matches the following brand voice and style:
      
      Brand: ${brandKit.name}
      Purpose: ${brandKit.voice.purpose || 'Not specified'}
      Audience: ${brandKit.voice.audience || 'Not specified'}
      Tone: ${brandKit.voice.tone ? brandKit.voice.tone.join(', ') : 'Professional, Informative'}
      Emotions: ${brandKit.voice.emotions ? brandKit.voice.emotions.join(', ') : 'Trust, Confidence'}
      Character: ${brandKit.voice.character ? brandKit.voice.character.join(', ') : 'Expert, Guide'}
      
      ${contentType === 'preview' ? 'Generate a short preview with heading, subheading, paragraph, and CTA text.' : 'Generate marketing content for the specified purpose.'}
      
      Format your response as a JSON object with appropriate fields.
    `;
    
    // Use the selected AI model
    switch (selectedModel.provider) {
      case 'openai':
        result = await openai.chat.completions.create({
          model: selectedModel.model,
          messages: [
            { role: 'system', content: 'You are a content generation expert that creates branded content matching specific brand voice and style guidelines.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });
        
        content = JSON.parse(result.choices[0].message.content);
        break;
        
      case 'anthropic':
        result = await claude.messages.create({
          model: selectedModel.model,
          system: 'You are a content generation expert that creates branded content matching specific brand voice and style guidelines.',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        });
        
        // Extract JSON from Claude's response
        const claudeContent = result.content[0].text;
        const jsonMatch = claudeContent.match(/\{[\s\S]*\}/);
        content = jsonMatch ? JSON.parse(jsonMatch[0]) : defaultContent(contentType, brandKit.name);
        break;
        
      case 'gemini':
        result = await gemini.generateContent({
          model: selectedModel.model,
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.7
          }
        });
        
        // Extract JSON from Gemini's response
        const geminiContent = result.response.candidates[0].content.parts[0].text;
        const geminiJsonMatch = geminiContent.match(/\{[\s\S]*\}/);
        content = geminiJsonMatch ? JSON.parse(geminiJsonMatch[0]) : defaultContent(contentType, brandKit.name);
        break;
        
      default:
        // Fallback to default content
        content = defaultContent(contentType, brandKit.name);
    }
    
    return {
      success: true,
      content
    };
    
  } catch (error) {
    console.error('Error generating branded content:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to generate branded content: ${error.message}`
    );
  }
});

/**
 * Generate default content when generation fails
 * @param {string} contentType - Type of content to generate
 * @param {string} brandName - Brand name
 * @returns {Object} - Default content
 */
function defaultContent(contentType, brandName) {
  if (contentType === 'preview') {
    return {
      heading: `${brandName} Delivers Excellence`,
      subheading: 'Quality Products and Services for Your Needs',
      paragraph: 'We provide top-notch solutions designed to meet your specific requirements. Our team of experts is dedicated to ensuring your complete satisfaction.',
      ctaText: 'Learn More'
    };
  }
  
  return {
    title: `${brandName} - Your Trusted Partner`,
    content: 'We offer exceptional products and services tailored to your needs. Contact us today to learn how we can help you achieve your goals.'
  };
}
