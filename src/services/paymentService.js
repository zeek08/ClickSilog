import { appConfig } from '../config/appConfig';
import axios from 'axios';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

// SECURITY WARNING: Secret key should NEVER be used client-side
// This is only for legacy payment intent functions (not used for GCash)
// GCash payments use Cloud Functions which securely handle the secret key
// DO NOT expose secret keys in client-side code
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
 * 
 * SECURITY WARNING: This function uses secret key client-side which is NOT secure
 * This is a legacy function and should NOT be used for GCash payments
 * 
 * For GCash payments, use createPaymentSourceViaFunction() which calls Cloud Functions
 * 
 * @deprecated Use createPaymentIntentViaFunction() or createPaymentSourceViaFunction() instead
 */
export const createPaymentIntent = async ({ amount, currency = 'PHP', description }) => {
  if (appConfig.USE_MOCKS) {
    return mockCharge({ amount, currency, description });
  }

  try {
    // SECURITY WARNING: This uses secret key on client-side which is NOT secure
    // This function should NOT be used for production GCash payments
    // Use Cloud Functions (createPaymentSourceViaFunction) instead
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
 * Create payment intent via Cloud Function (recommended - secure)
 */
export const createPaymentIntentViaFunction = async ({ amount, currency = 'PHP', description, orderId }) => {
  if (appConfig.USE_MOCKS) {
    return {
      success: true,
      paymentIntentId: `mock_pi_${Date.now()}`,
      clientKey: `mock_client_${Date.now()}`,
      status: 'pending'
    };
  }

  try {
    // Get Cloud Function region from config or default to us-central1
    const region = appConfig.firebase.region || process.env.EXPO_PUBLIC_FIREBASE_REGION || 'us-central1';
    const functionsUrl = `https://${region}-${appConfig.firebase.projectId}.cloudfunctions.net/createPaymentIntent`;
    
    const response = await axios.post(functionsUrl, {
      amount,
      currency,
      description,
      orderId
    }, {
      timeout: 30000, // 30 second timeout
    });

    if (response.data.success) {
      return {
        success: true,
        paymentIntentId: response.data.paymentIntentId,
        clientKey: response.data.clientKey,
        status: 'pending'
      };
    } else {
      throw new Error(response.data.error || 'Failed to create payment intent');
    }
  } catch (error) {
    console.error('Cloud Function payment intent error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Attach payment method to payment intent
 */
export const attachPaymentMethod = async (paymentIntentId, paymentMethodId) => {
  if (appConfig.USE_MOCKS) {
    return {
      success: true,
      status: 'succeeded',
      paymentId: `mock_payment_${Date.now()}`
    };
  }

  try {
    const response = await axios.post(
      `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`,
      {
        data: {
          attributes: {
            payment_method: paymentMethodId
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
      status: response.data.data.attributes.status,
      payment: response.data.data.attributes.payment
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.detail || error.message
    };
  }
};

/**
 * Create payment source via Cloud Function (for GCash QR payments)
 * @param {Object} params - Payment source parameters
 * @param {number} params.amount - Amount in PHP
 * @param {string} params.currency - Currency code (default: PHP)
 * @param {string} params.description - Payment description
 * @param {string} params.orderId - Order ID (required)
 * @param {string} params.tableNumber - Table number (optional)
 * @param {string} params.redirectUrl - Redirect URL (optional)
 * @returns {Promise<Object>} Source creation result
 */
export const createPaymentSourceViaFunction = async ({ amount, currency = 'PHP', description, orderId, tableNumber, redirectUrl }) => {
  if (appConfig.USE_MOCKS) {
    // Simulate source creation
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      sourceId: `mock_source_${Date.now()}`,
      checkoutUrl: `https://pay.paymongo.com/checkout/mock_${Date.now()}`,
      qrData: `https://pay.paymongo.com/qr/mock_${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      status: 'pending'
    };
  }

  try {
    if (!orderId) {
      return {
        success: false,
        error: 'Order ID is required'
      };
    }

    // Get Cloud Function region from config or default to us-central1
    const region = appConfig.firebase.region || process.env.EXPO_PUBLIC_FIREBASE_REGION || 'us-central1';
    const functionsUrl = `https://${region}-${appConfig.firebase.projectId}.cloudfunctions.net/createPaymentSource`;
    
    const response = await axios.post(functionsUrl, {
      amount,
      currency,
      description: description || `Order #${orderId}`,
      orderId,
      tableNumber: tableNumber || null,
      redirectUrl: redirectUrl || null
    }, {
      timeout: 30000, // 30 second timeout
    });

    if (response.data.success) {
      return {
        success: true,
        // Support both old (sourceId) and new (paymentIntentId) formats
        sourceId: response.data.sourceId || response.data.paymentIntentId,
        paymentIntentId: response.data.paymentIntentId,
        methodId: response.data.methodId,
        checkoutUrl: response.data.checkoutUrl,
        qrData: response.data.qrData, // QR code image URI
        expiresAt: response.data.expiresAt,
        status: 'pending'
      };
    } else {
      throw new Error(response.data.error || 'Failed to create payment source');
    }
  } catch (error) {
    console.error('Cloud Function payment source error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Process payment with PayMongo (complete flow)
 * For GCash, this creates a Source and returns QR code data
 * For other methods, uses Payment Intent (legacy)
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in PHP
 * @param {string} params.currency - Currency code (default: PHP)
 * @param {string} params.description - Payment description
 * @param {string} params.orderId - Order ID
 * @param {string} params.paymentMethod - Payment method (gcash, card, paymaya)
 * @param {string} params.tableNumber - Table number (for GCash)
 * @returns {Promise<Object>} Payment result
 */
export const processPayment = async ({ amount, currency = 'PHP', description, orderId, paymentMethod = 'gcash', tableNumber }) => {
  if (appConfig.USE_MOCKS) {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (paymentMethod === 'gcash') {
      return {
        success: true,
        sourceId: `mock_source_${Date.now()}`,
        checkoutUrl: `https://pay.paymongo.com/checkout/mock_${Date.now()}`,
        qrData: `https://pay.paymongo.com/qr/mock_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        status: 'pending',
        amount,
        currency
      };
    }
    
    return {
      success: true,
      status: 'paid',
      paymentId: `mock_payment_${Date.now()}`,
      paymentIntentId: `mock_pi_${Date.now()}`,
      amount,
      currency
    };
  }

  try {
    // For GCash, use Source API (QR code flow)
    if (paymentMethod === 'gcash') {
      const sourceResult = await createPaymentSourceViaFunction({
        amount,
        currency,
        description: description || `Order #${orderId}`,
        orderId,
        tableNumber
      });

      if (!sourceResult.success) {
        return sourceResult;
      }

      return {
        success: true,
        // Support both old (sourceId) and new (paymentIntentId) formats
        sourceId: sourceResult.sourceId || sourceResult.paymentIntentId,
        paymentIntentId: sourceResult.paymentIntentId,
        methodId: sourceResult.methodId,
        checkoutUrl: sourceResult.checkoutUrl,
        qrData: sourceResult.qrData, // QR code image URI
        expiresAt: sourceResult.expiresAt,
        status: 'pending',
        amount,
        currency
      };
    }

    // For other payment methods, use Payment Intent (legacy)
    const intentResult = await createPaymentIntentViaFunction({
      amount,
      currency,
      description: description || `Order #${orderId}`,
      orderId
    });

    if (!intentResult.success) {
      return intentResult;
    }
    
    return {
      success: true,
      paymentIntentId: intentResult.paymentIntentId,
      clientKey: intentResult.clientKey,
      status: 'pending',
      amount,
      currency
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error.message || 'Payment processing failed'
    };
  }
};

/**
 * Create checkout session via Cloud Function (Checkout API)
 * This creates a PayMongo-hosted page where users finish GCash payment
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in PHP
 * @param {string} params.currency - Currency code (default: PHP)
 * @param {string} params.description - Payment description
 * @param {string} params.orderId - Order ID
 * @param {string} params.redirectUrl - Redirect URL after payment
 * @returns {Promise<Object>} Checkout session result
 */
export const createCheckoutSessionViaFunction = async ({ amount, currency = 'PHP', description, orderId, redirectUrl }) => {
  if (appConfig.USE_MOCKS) {
    // Simulate checkout session creation
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      checkoutSessionId: `mock_checkout_${Date.now()}`,
      checkoutUrl: `https://pay.paymongo.com/checkout/mock_${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      status: 'pending'
    };
  }

  try {
    if (!orderId) {
      return {
        success: false,
        error: 'Order ID is required'
      };
    }

    // Get Cloud Function region from config or default to us-central1
    const region = appConfig.firebase.region || process.env.EXPO_PUBLIC_FIREBASE_REGION || 'us-central1';
    const functionsUrl = `https://${region}-${appConfig.firebase.projectId}.cloudfunctions.net/createCheckoutSession`;
    
    const response = await axios.post(functionsUrl, {
      amount,
      currency,
      description: description || `Order #${orderId}`,
      orderId,
      redirectUrl: redirectUrl || null
    }, {
      timeout: 30000, // 30 second timeout
    });

    if (response.data.success) {
      return {
        success: true,
        checkoutSessionId: response.data.checkoutSessionId,
        checkoutUrl: response.data.checkoutUrl,
        expiresAt: response.data.expiresAt,
        status: 'pending'
      };
    } else {
      throw new Error(response.data.error || 'Failed to create checkout session');
    }
  } catch (error) {
    console.error('Cloud Function checkout session error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Check payment status via Cloud Function (fallback if webhook fails)
 * @param {Object} params - Payment status check parameters
 * @param {string} params.orderId - Order ID (required)
 * @param {string} params.paymentIntentId - Payment Intent ID (optional, will use from order if not provided)
 * @returns {Promise<Object>} Payment status check result
 */
export const checkPaymentStatusViaFunction = async ({ orderId, paymentIntentId }) => {
  if (appConfig.USE_MOCKS) {
    return {
      success: true,
      status: 'paid',
      orderId,
      paymentIntentId: paymentIntentId || `mock_pi_${Date.now()}`,
    };
  }

  try {
    if (!orderId) {
      return {
        success: false,
        error: 'Order ID is required',
      };
    }

    // Get Cloud Function region from config or default to us-central1
    const region = appConfig.firebase.region || process.env.EXPO_PUBLIC_FIREBASE_REGION || 'us-central1';
    const functionsUrl = `https://${region}-${appConfig.firebase.projectId}.cloudfunctions.net/checkPaymentStatus`;

    const response = await axios.post(functionsUrl, {
      orderId,
      paymentIntentId,
    }, {
      timeout: 30000, // 30 second timeout
    });

    if (response.data.success) {
      return {
        success: true,
        orderId: response.data.orderId,
        paymentIntentId: response.data.paymentIntentId,
        paymentId: response.data.paymentId,
        status: response.data.status,
        amount: response.data.amount,
        message: response.data.message,
      };
    } else {
      throw new Error(response.data.error || 'Failed to check payment status');
    }
  } catch (error) {
    console.error('Cloud Function payment status check error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

export const paymentService = {
  createPaymentIntent,
  createPaymentIntentViaFunction,
  createPaymentSourceViaFunction,
  createCheckoutSessionViaFunction,
  getPaymentIntent,
  attachPaymentMethod,
  processPayment,
  checkPaymentStatusViaFunction,
};

