import { appConfig } from '../config/appConfig';
import axios from 'axios';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_SECRET_KEY = process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY || appConfig.paymongo.secretKey;

// Helper to create Basic Auth header (compatible with React Native)
const getAuthHeader = (secretKey) => {
  // Use btoa if available (web), otherwise use base64 encoding
  const credentials = secretKey + ':';
  let base64;
  if (typeof btoa !== 'undefined') {
    base64 = btoa(credentials);
  } else {
    // React Native compatible base64 encoding
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < credentials.length) {
      const a = credentials.charCodeAt(i++);
      const b = i < credentials.length ? credentials.charCodeAt(i++) : 0;
      const c = i < credentials.length ? credentials.charCodeAt(i++) : 0;
      const bitmap = (a << 16) | (b << 8) | c;
      result += base64Chars.charAt((bitmap >> 18) & 63) +
                base64Chars.charAt((bitmap >> 12) & 63) +
                (i - 2 < credentials.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=') +
                (i - 1 < credentials.length ? base64Chars.charAt(bitmap & 63) : '=');
    }
    base64 = result;
  }
  return `Basic ${base64}`;
};

const mockCharge = async ({ amount, currency = 'PHP', description }) => {
  return {
    id: `mock-ch_${Date.now()}`,
    status: 'paid',
    amount,
    currency,
    description,
    paymentIntentId: `mock_pi_${Date.now()}`
  };
};

/**
 * Create a payment intent (client-side, uses public key)
 * Note: For production, this should be done server-side via Cloud Functions
 */
export const createPaymentIntent = async ({ amount, currency = 'PHP', description }) => {
  if (appConfig.USE_MOCKS) {
    return mockCharge({ amount, currency, description });
  }

  try {
    // Note: This uses secret key on client-side which is NOT secure
    // In production, call your Cloud Function instead
    if (!PAYMONGO_SECRET_KEY || PAYMONGO_SECRET_KEY.includes('_XXXX')) {
      throw new Error('PayMongo secret key not configured. Use Cloud Functions for secure payment processing.');
    }

    const response = await axios.post(
      `${PAYMONGO_API_URL}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toUpperCase(),
            payment_method_allowed: ['card', 'gcash', 'paymaya'],
            description: description || 'ClickSilog Order'
          }
        }
      },
      {
        headers: {
          'Authorization': getAuthHeader(PAYMONGO_SECRET_KEY),
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      paymentIntentId: response.data.data.id,
      clientKey: response.data.data.attributes.client_key,
      data: response.data.data
    };
  } catch (error) {
    console.error('Payment intent creation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.detail || error.message
    };
  }
};

/**
 * Retrieve payment intent status
 */
export const getPaymentIntent = async (paymentIntentId) => {
  if (appConfig.USE_MOCKS) {
    return {
      success: true,
      status: 'succeeded',
      payment: { id: `mock_payment_${Date.now()}` }
    };
  }

  try {
    const response = await axios.get(
      `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`,
      {
        headers: {
          'Authorization': getAuthHeader(PAYMONGO_SECRET_KEY)
        }
      }
    );

    return {
      success: true,
      status: response.data.data.attributes.status,
      payment: response.data.data.attributes.payment,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.detail || error.message
    };
  }
};

/**
 * Create payment intent via Cloud Function (recommended)
 */
export const createPaymentIntentViaFunction = async ({ amount, currency = 'PHP', description, orderId }) => {
  if (appConfig.USE_MOCKS) {
    return mockCharge({ amount, currency, description });
  }

  try {
    // Call your Cloud Function endpoint
    const functionsUrl = `https://us-central1-${appConfig.firebase.projectId}.cloudfunctions.net/createPaymentIntent`;
    
    const response = await axios.post(functionsUrl, {
      amount,
      currency,
      description,
      orderId
    });

    return {
      success: true,
      paymentIntentId: response.data.paymentIntentId,
      clientKey: response.data.clientKey
    };
  } catch (error) {
    console.error('Cloud Function payment intent error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

export const paymentService = {
  createPaymentIntent,
  createPaymentIntentViaFunction,
  getPaymentIntent
};

