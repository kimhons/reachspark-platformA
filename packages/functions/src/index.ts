import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Stripe } from 'stripe';
import { Configuration, OpenAIApi } from 'openai';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-08-16',
});

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: functions.config().openai.api_key,
});
const openai = new OpenAIApi(configuration);

// User functions
export const createUserRecord = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;
  
  try {
    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email: email || undefined,
      name: displayName || undefined,
      metadata: {
        firebaseUID: uid
      }
    });
    
    // Create user record in Firestore
    await admin.firestore().collection('users').doc(uid).set({
      uid,
      email,
      displayName: displayName || '',
      photoURL: photoURL || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      stripeCustomerId: customer.id,
      tokens: 100, // Free tokens for new users
      role: 'user',
      isActive: true
    });
    
    console.log(`User record created for ${uid}`);
    return null;
  } catch (error) {
    console.error('Error creating user record:', error);
    return null;
  }
});

// Token functions
export const purchaseTokens = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to purchase tokens'
    );
  }
  
  const { planId, paymentMethodId } = data;
  const uid = context.auth.uid;
  
  try {
    // Get user record
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError(
        'not-found',
        'User record not found'
      );
    }
    
    // Get plan details
    const planDoc = await admin.firestore().collection('plans').doc(planId).get();
    const planData = planDoc.data();
    
    if (!planData) {
      throw new functions.https.HttpsError(
        'not-found',
        'Plan not found'
      );
    }
    
    // Process payment with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: planData.price * 100, // Convert to cents
      currency: 'usd',
      customer: userData.stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      description: `Token purchase: ${planData.name} plan`,
      metadata: {
        planId,
        userId: uid,
        tokens: planData.tokens.toString()
      }
    });
    
    if (paymentIntent.status === 'succeeded') {
      // Update user's token balance
      await admin.firestore().collection('users').doc(uid).update({
        tokens: admin.firestore.FieldValue.increment(planData.tokens)
      });
      
      // Record the transaction
      await admin.firestore().collection('transactions').add({
        userId: uid,
        planId,
        planName: planData.name,
        tokens: planData.tokens,
        amount: planData.price,
        paymentIntentId: paymentIntent.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        type: 'purchase'
      });
      
      return {
        success: true,
        tokens: planData.tokens,
        message: `Successfully purchased ${planData.tokens} tokens`
      };
    } else {
      throw new functions.https.HttpsError(
        'aborted',
        'Payment processing failed'
      );
    }
  } catch (error) {
    console.error('Error purchasing tokens:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while purchasing tokens'
    );
  }
});

export const useTokens = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to use tokens'
    );
  }
  
  const { amount, feature, metadata } = data;
  const uid = context.auth.uid;
  
  try {
    // Get user record
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError(
        'not-found',
        'User record not found'
      );
    }
    
    // Check if user has enough tokens
    if (userData.tokens < amount) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Not enough tokens available'
      );
    }
    
    // Deduct tokens from user's balance
    await admin.firestore().collection('users').doc(uid).update({
      tokens: admin.firestore.FieldValue.increment(-amount)
    });
    
    // Record the usage
    await admin.firestore().collection('tokenUsage').add({
      userId: uid,
      amount,
      feature,
      metadata,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      remainingTokens: userData.tokens - amount,
      message: `Successfully used ${amount} tokens for ${feature}`
    };
  } catch (error) {
    console.error('Error using tokens:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while using tokens'
    );
  }
});

// Image generation with DALL-E
export const generateImage = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to generate images'
    );
  }
  
  const { prompt, size = '1024x1024', n = 1 } = data;
  const uid = context.auth.uid;
  
  // Token cost based on size and number of images
  const tokenCost = n * (size === '1024x1024' ? 50 : size === '512x512' ? 25 : 15);
  
  try {
    // Get user record
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError(
        'not-found',
        'User record not found'
      );
    }
    
    // Check if user has enough tokens
    if (userData.tokens < tokenCost) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Not enough tokens available'
      );
    }
    
    // Generate image with DALL-E
    const response = await openai.createImage({
      prompt,
      n,
      size: size as '256x256' | '512x512' | '1024x1024',
    });
    
    // Deduct tokens from user's balance
    await admin.firestore().collection('users').doc(uid).update({
      tokens: admin.firestore.FieldValue.increment(-tokenCost)
    });
    
    // Record the usage
    await admin.firestore().collection('tokenUsage').add({
      userId: uid,
      amount: tokenCost,
      feature: 'image-generation',
      metadata: {
        prompt,
        size,
        n
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Save generated images to Firestore
    const imageUrls = response.data.data.map(item => item.url);
    const imageDoc = await admin.firestore().collection('generatedImages').add({
      userId: uid,
      prompt,
      size,
      n,
      urls: imageUrls,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      imageId: imageDoc.id,
      images: imageUrls,
      tokenCost,
      remainingTokens: userData.tokens - tokenCost
    };
  } catch (error) {
    console.error('Error generating image:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while generating the image'
    );
  }
});

// Social media functions
export const scheduleSocialPost = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to schedule posts'
    );
  }
  
  const { content, platforms, scheduledDate, image } = data;
  const uid = context.auth.uid;
  
  // Token cost based on platforms and content length
  const tokenCost = 15 + (platforms.length * 5);
  
  try {
    // Get user record
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError(
        'not-found',
        'User record not found'
      );
    }
    
    // Check if user has enough tokens
    if (userData.tokens < tokenCost) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Not enough tokens available'
      );
    }
    
    // Create scheduled post
    const postDoc = await admin.firestore().collection('scheduledPosts').add({
      userId: uid,
      content,
      platforms,
      scheduledDate: new Date(scheduledDate),
      image,
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Deduct tokens from user's balance
    await admin.firestore().collection('users').doc(uid).update({
      tokens: admin.firestore.FieldValue.increment(-tokenCost)
    });
    
    // Record the usage
    await admin.firestore().collection('tokenUsage').add({
      userId: uid,
      amount: tokenCost,
      feature: 'social-media-scheduling',
      metadata: {
        postId: postDoc.id,
        platforms
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      postId: postDoc.id,
      tokenCost,
      remainingTokens: userData.tokens - tokenCost
    };
  } catch (error) {
    console.error('Error scheduling post:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while scheduling the post'
    );
  }
});

// Email marketing functions
export const sendEmailCampaign = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to send email campaigns'
    );
  }
  
  const { name, subject, content, recipients } = data;
  const uid = context.auth.uid;
  
  // Token cost based on content length and number of recipients
  const contentLength = content.length;
  const baseTokenCost = 40;
  const additionalCost = Math.floor(contentLength / 500) * 5;
  const tokenCost = baseTokenCost + additionalCost;
  
  try {
    // Get user record
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError(
        'not-found',
        'User record not found'
      );
    }
    
    // Check if user has enough tokens
    if (userData.tokens < tokenCost) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Not enough tokens available'
      );
    }
    
    // Create email campaign
    const campaignDoc = await admin.firestore().collection('emailCampaigns').add({
      userId: uid,
      name,
      subject,
      content,
      recipients,
      status: 'sent',
      sendDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Deduct tokens from user's balance
    await admin.firestore().collection('users').doc(uid).update({
      tokens: admin.firestore.FieldValue.increment(-tokenCost)
    });
    
    // Record the usage
    await admin.firestore().collection('tokenUsage').add({
      userId: uid,
      amount: tokenCost,
      feature: 'email-campaign',
      metadata: {
        campaignId: campaignDoc.id,
        recipients
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      campaignId: campaignDoc.id,
      tokenCost,
      remainingTokens: userData.tokens - tokenCost
    };
  } catch (error) {
    console.error('Error sending email campaign:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while sending the email campaign'
    );
  }
});

// Export all functions
export { createUserRecord, purchaseTokens, useTokens, generateImage, scheduleSocialPost, sendEmailCampaign };
