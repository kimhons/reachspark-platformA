/**
 * Stripe API Integration
 * 
 * This module provides functions to interact with Stripe's API
 * for payment processing in the ReachSpark platform.
 */

const stripe = require('stripe');
const functions = require('firebase-functions');
const { logger } = require('firebase-functions');

// Stripe API configuration
const STRIPE_SECRET_KEY = functions.config().stripe?.secret_key || "sk_test_your_secret_key";
const STRIPE_PUBLISHABLE_KEY = functions.config().stripe?.publishable_key || "pk_test_51RCvlW007w8vEw6itGqfGdZhzPYMq1TXj4ho3Gwde5ZQqSOyp16hcwUZENyMko3HAtGWSQk2CXQZNPOLnJ2dUhaN00fAWfqqRB";

// Initialize Stripe
const stripeClient = stripe(STRIPE_SECRET_KEY);

/**
 * Create a payment intent for token purchase
 * 
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in cents
 * @param {string} params.currency - Currency code (default: usd)
 * @param {string} params.description - Payment description
 * @param {string} params.customer_id - Optional Stripe customer ID
 * @returns {Promise<Object>} - Payment intent
 */
async function createPaymentIntent(params) {
    try {
        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: params.amount,
            currency: params.currency || 'usd',
            description: params.description,
            customer: params.customer_id || undefined,
            automatic_payment_methods: {
                enabled: true,
            },
        });
        
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        };
    } catch (error) {
        logger.error('Error creating payment intent:', error);
        throw new Error(`Failed to create payment intent: ${error.message}`);
    }
}

/**
 * Create or update a Stripe customer
 * 
 * @param {Object} params - Customer parameters
 * @param {string} params.email - Customer email
 * @param {string} params.name - Customer name
 * @param {string} params.customer_id - Optional existing Stripe customer ID
 * @returns {Promise<Object>} - Stripe customer
 */
async function createOrUpdateCustomer(params) {
    try {
        if (params.customer_id) {
            // Update existing customer
            const customer = await stripeClient.customers.update(
                params.customer_id,
                {
                    email: params.email,
                    name: params.name
                }
            );
            return customer;
        } else {
            // Create new customer
            const customer = await stripeClient.customers.create({
                email: params.email,
                name: params.name
            });
            return customer;
        }
    } catch (error) {
        logger.error('Error creating/updating customer:', error);
        throw new Error(`Failed to create/update customer: ${error.message}`);
    }
}

/**
 * Create a subscription for recurring token purchases
 * 
 * @param {Object} params - Subscription parameters
 * @param {string} params.customer_id - Stripe customer ID
 * @param {string} params.price_id - Stripe price ID
 * @param {string} params.payment_method_id - Payment method ID
 * @returns {Promise<Object>} - Subscription
 */
async function createSubscription(params) {
    try {
        // Attach payment method to customer
        await stripeClient.paymentMethods.attach(params.payment_method_id, {
            customer: params.customer_id,
        });
        
        // Set as default payment method
        await stripeClient.customers.update(params.customer_id, {
            invoice_settings: {
                default_payment_method: params.payment_method_id,
            },
        });
        
        // Create subscription
        const subscription = await stripeClient.subscriptions.create({
            customer: params.customer_id,
            items: [{ price: params.price_id }],
            expand: ['latest_invoice.payment_intent'],
        });
        
        return subscription;
    } catch (error) {
        logger.error('Error creating subscription:', error);
        throw new Error(`Failed to create subscription: ${error.message}`);
    }
}

/**
 * Get Stripe publishable key
 * 
 * @returns {Object} - Stripe publishable key
 */
function getPublishableKey() {
    return { publishableKey: STRIPE_PUBLISHABLE_KEY };
}

module.exports = {
    createPaymentIntent,
    createOrUpdateCustomer,
    createSubscription,
    getPublishableKey
};
