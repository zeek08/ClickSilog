const functions = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require("crypto");

// Load environment variables for local development
// Only load dotenv if it's available (not in production)
try {
  // Check if we're in emulator or local development
  if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === "development") {
    // Use dynamic require to avoid errors if dotenv is not installed
    const dotenv = require("dotenv");
    dotenv.config();
  }
} catch (error) {
  // dotenv is optional, continue if it fails
  // This is expected in production where dotenv is not installed
}

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

// PayMongo Configuration
const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

// Security Constants
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
const ALLOWED_ORIGINS = ["*"]; // Allow all origins for now
const MIN_AMOUNT = 1.00; // Minimum amount in PHP (₱1.00 = 100 cents)
const MAX_AMOUNT = 50000.00; // Maximum amount in PHP (₱50,000.00)

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

// Helper Functions
const getClientIP = (req) => {
  return req.headers["x-forwarded-for"]?.split(",")[0] ||
         req.headers["x-real-ip"] ||
         req.connection?.remoteAddress ||
         "unknown";
};

const checkRateLimit = (clientIP) => {
  const now = Date.now();
  const key = `rate_limit_${clientIP}`;
  const requests = rateLimitStore.get(key) || [];

  // Remove old requests outside the window
  const validRequests = requests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);

  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  return true;
};

const validateAmount = (amount) => {
  if (typeof amount !== "number" || isNaN(amount)) {
    return {valid: false, error: "Amount must be a number"};
  }
  if (amount < MIN_AMOUNT) {
    return {valid: false, error: `Amount must be at least ₱${MIN_AMOUNT.toFixed(2)}`};
  }
  if (amount > MAX_AMOUNT) {
    return {valid: false, error: `Amount must not exceed ₱${MAX_AMOUNT.toFixed(2)}`};
  }
  return {valid: true, amount: parseFloat(amount.toFixed(2))};
};

const validateOrderId = (orderId) => {
  if (!orderId || typeof orderId !== "string") {
    return {valid: false, error: "Order ID is required"};
  }
  if (orderId.length > 100) {
    return {valid: false, error: "Order ID is too long"};
  }
  return {valid: true, orderId: orderId.trim()};
};

const validateCurrency = (currency) => {
  const validCurrencies = ["PHP", "USD", "EUR"];
  const upperCurrency = currency?.toUpperCase() || "PHP";
  if (!validCurrencies.includes(upperCurrency)) {
    return {valid: false, error: `Currency must be one of: ${validCurrencies.join(", ")}`};
  }
  return {valid: true, currency: upperCurrency};
};

const sanitizeString = (str, maxLength) => {
  if (!str || typeof str !== "string") {
    return "";
  }
  return str.trim().substring(0, maxLength || 200);
};

const getAuthHeader = (secretKey) => {
  return `Basic ${Buffer.from(secretKey + ":").toString("base64")}`;
};

const getPayMongoSecretKey = async () => {
  if (process.env.PAYMONGO_SECRET_KEY) {
    return process.env.PAYMONGO_SECRET_KEY;
  }
  if (functions.config && functions.config().paymongo?.secret_key) {
    return functions.config().paymongo.secret_key;
  }
  return null;
};

const getPayMongoWebhookSecret = async () => {
  if (process.env.PAYMONGO_WEBHOOK_SECRET) {
    return process.env.PAYMONGO_WEBHOOK_SECRET;
  }
  if (functions.config && functions.config().paymongo?.webhook_secret) {
    return functions.config().paymongo.webhook_secret;
  }
  return null;
};

const verifyPayMongoWebhookSignature = (signature, payload, secret) => {
  if (!signature || !payload || !secret) {
    return false;
  }

  try {
    // Parse signature header: t=timestamp,te=expected_signature
    const parts = signature.split(",");
    let timestamp = null;
    let expectedSignature = null;

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "t") {
        timestamp = value;
      } else if (key === "te") {
        expectedSignature = value;
      }
    }

    if (!timestamp || !expectedSignature) {
      return false;
    }

    // Create signed payload: timestamp + "." + raw_body
    const signedPayload = `${timestamp}.${payload}`;

    // Compute HMAC-SHA256
    const computedSignature = crypto
        .createHmac("sha256", secret)
        .update(signedPayload)
        .digest("hex");

    // Constant-time comparison
    return crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(expectedSignature),
    );
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
};

/**
 * Create PayMongo Payment Source (QR PH API)
 * Endpoint: POST /createPaymentSource
 * This creates a PayMongo Source for GCash QR payment
 *
 * SECURITY MEASURES:
 * - Rate limiting
 * - Input validation
 * - Amount limits
 * - Order ID validation
 * - CORS restrictions
 * - Request size limits
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createPaymentSourceHandler = async (req, res) => {
  // Security: Check request size
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > MAX_REQUEST_SIZE) {
    res.status(413).json({error: "Request too large"});
    return;
  }

  // Security: Rate limiting
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    res.status(429).json({error: "Too many requests. Please try again later."});
    return;
  }

  // Security: CORS configuration
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes("*")) {
    res.set("Access-Control-Allow-Origin", "*");
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else if (origin) {
    res.status(403).json({error: "Origin not allowed"});
    return;
  }

  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  // Security: Enforce HTTPS in production
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    res.status(403).json({error: "HTTPS required"});
    return;
  }

  try {
    // Security: Validate and sanitize inputs
    const {
      amount,
      currency = "PHP",
      description,
      orderId,
      tableNumber,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body;

    // Validate amount
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      res.status(400).json({error: amountValidation.error});
      return;
    }

    // Validate order ID
    const orderIdValidation = validateOrderId(orderId);
    if (!orderIdValidation.valid) {
      res.status(400).json({error: orderIdValidation.error});
      return;
    }

    // Validate currency
    const currencyValidation = validateCurrency(currency);
    if (!currencyValidation.valid) {
      res.status(400).json({error: currencyValidation.error});
      return;
    }

    // Sanitize string inputs
    const sanitizedDescription = sanitizeString(description, 200);
    const sanitizedTableNumber = sanitizeString(tableNumber, 50);

    // Security: Verify order exists
    const orderRef = admin.firestore().collection("orders").doc(orderIdValidation.orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      res.status(404).json({error: "Order not found"});
      return;
    }

    const orderData = orderDoc.data();

    // Security: Verify amount matches order total
    if (Math.abs(orderData.total - amountValidation.amount) > 0.01) {
      res.status(400).json({error: "Amount does not match order total"});
      return;
    }

    const secretKey = await getPayMongoSecretKey();
    if (!secretKey) {
      res.status(500).json({error: "Payment service temporarily unavailable"});
      return;
    }

    // Create PayMongo Payment Intent with QR PH (QR PH API)
    try {
      // Step 1: Create Payment Intent with QR PH allowed
      const intentResponse = await axios.post(
          `${PAYMONGO_API_URL}/payment_intents`,
          {
            data: {
              attributes: {
                amount: Math.round(amountValidation.amount * 100), // Convert to cents
                currency: currencyValidation.currency,
                payment_method_allowed: ["qrph"], // ✅ Include QR PH
                description: sanitizedDescription || `Order #${orderIdValidation.orderId}`,
                metadata: {
                  order_id: orderIdValidation.orderId,
                  table_number: sanitizedTableNumber || "",
                },
              },
            },
          },
          {
            headers: {
              "Authorization": getAuthHeader(secretKey),
              "Content-Type": "application/json",
            },
          },
      );

      if (!intentResponse.data?.data?.id) {
        console.error("Invalid intent response:", JSON.stringify(intentResponse.data, null, 2));
        throw new Error("Invalid response from PayMongo API");
      }

      const intentData = intentResponse.data.data;
      const intentId = intentData.id;

      // Step 2: Create QR PH Payment Method with billing details
      // According to official PayMongo docs:
      // - Only need: address (optional), name, email, phone (optional)
      // - Address fields are optional
      const billingName = customerName || orderData.customerName || "Customer";
      const billingEmail = customerEmail || orderData.customerEmail || "customer@example.com";
      const billingPhone = customerPhone || orderData.customerPhone || null; // Optional

      const methodResponse = await axios.post(
          `${PAYMONGO_API_URL}/payment_methods`,
          {
            data: {
              attributes: {
                type: "qrph", // ✅ QR PH type
                billing: {
                  name: billingName,
                  email: billingEmail,
                  // Phone is optional
                  ...(billingPhone && {phone: billingPhone}),
                  // Address is optional - only include if needed
                  // address: {
                  //   line1: "123 Main St",
                  //   city: "Manila",
                  //   state: "Metro Manila",
                  //   postal_code: "1000",
                  //   country: "PH",
                  // },
                },
              },
            },
          },
          {
            headers: {
              "Authorization": getAuthHeader(secretKey),
              "Content-Type": "application/json",
            },
          },
      );

      if (!methodResponse.data?.data?.id) {
        console.error("Invalid method response:", JSON.stringify(methodResponse.data, null, 2));
        throw new Error("Invalid payment method response from PayMongo API");
      }

      const methodData = methodResponse.data.data;
      const methodId = methodData.id;

      // Step 3: Attach Payment Method to Payment Intent
      // Note: When using secret key, we don't need client_key
      const attachResponse = await axios.post(
          `${PAYMONGO_API_URL}/payment_intents/${intentId}/attach`,
          {
            data: {
              attributes: {
                payment_method: methodId,
                // client_key is only needed for client-side (public key) usage
                // When using secret key server-side, we don't need it
              },
            },
          },
          {
            headers: {
              "Authorization": getAuthHeader(secretKey),
              "Content-Type": "application/json",
            },
          },
      );

      if (!attachResponse.data?.data?.id) {
        console.error("Invalid attach response:", JSON.stringify(attachResponse.data, null, 2));
        throw new Error("Invalid attach response from PayMongo API");
      }

      const attachData = attachResponse.data.data;

      // Step 4: Get QR Code from next_action
      // According to official PayMongo docs:
      // - next_action.code.image_url contains the base64-encoded QR code image
      // - next_action.type is "consume_qr"
      const nextAction = attachData.attributes.next_action;
      const qrCodeImageUrl = nextAction?.code?.image_url || null;
      const paymentIntentId = attachData.id;

      // Log what PayMongo returned for debugging
      console.log("PayMongo QR PH response:", {
        paymentIntentId,
        methodId,
        hasQrCode: !!qrCodeImageUrl,
        nextActionType: nextAction?.type,
        nextActionCode: nextAction?.code ? {
          id: nextAction.code.id,
          amount: nextAction.code.amount,
          label: nextAction.code.label,
          hasImageUrl: !!nextAction.code.image_url,
        } : null,
      });

      if (!qrCodeImageUrl) {
        console.error(
            "PayMongo QR PH missing QR code image:",
            JSON.stringify(attachData, null, 2),
        );
        throw new Error(
            "No QR code received from PayMongo. " +
            "Please check your PayMongo account settings.",
        );
      }

      // QR PH codes expire after 30 minutes (PayMongo standard for Online QR Ph)
      const ttlMinutes = 30;
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      // Store payment intent in Firestore
      await admin.firestore().collection("payment_intents").doc(paymentIntentId).set({
        orderId: orderIdValidation.orderId,
        paymentIntentId,
        methodId,
        amount: amountValidation.amount,
        currency: currencyValidation.currency,
        status: "pending",
        qrCodeImageUrl, // Base64-encoded QR code image
        expiresAt: expiresAt.toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        clientIP,
        metadata: {
          orderId: orderIdValidation.orderId,
          tableNumber: sanitizedTableNumber || "",
        },
      });

      // Update order with payment intent info
      await orderRef.update({
        paymentIntentId,
        methodId,
        paymentStatus: "pending",
        status: "pending_payment",
        sourceExpiresAt: expiresAt.toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        paymentIntentId,
        methodId,
        qrData: qrCodeImageUrl, // Base64-encoded QR code image (data:image/png;base64,...)
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("PayMongo QR PH creation error:", {
        message: error.message,
        orderId: orderId || "unknown",
        clientIP: getClientIP(req),
        status: error.response?.status,
        statusText: error.response?.statusText,
        response: error.response?.data,
        stack: error.stack,
      });

      let errorMessage = "QR PH payment creation failed";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please check your API keys.";
      } else if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.errors?.[0]?.detail || "Invalid request";
        errorMessage = `Invalid request: ${errorDetail}`;
      } else if (error.response?.status === 500) {
        errorMessage = "PayMongo server error. Please try again later.";
      } else if (error.response?.data) {
        errorMessage = error.response.data.errors?.[0]?.detail || error.response.data.error || errorMessage;
      }

      res.status(error.response?.status || 500).json({
        error: errorMessage,
        details: error.response?.data?.errors || null,
      });
    }
  } catch (error) {
    console.error("Payment intent creation error:", error.message);
    res.status(500).json({
      error: "Payment intent creation failed",
    });
  }
};

// Export function
exports.createPaymentSource = onRequest({
  region: "us-central1",
  cors: true,
}, createPaymentSourceHandler);

/**
 * Create PayMongo Checkout Session (Checkout API)
 * Endpoint: POST /createCheckoutSession
 * This creates a PayMongo-hosted checkout page where users finish GCash payment
 *
 * SECURITY MEASURES:
 * - Rate limiting
 * - Input validation
 * - Amount limits
 * - Order ID validation
 * - CORS restrictions
 * - Request size limits
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createCheckoutSessionHandler = async (req, res) => {
  // Security: Check request size
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > MAX_REQUEST_SIZE) {
    res.status(413).json({error: "Request too large"});
    return;
  }

  // Security: Rate limiting
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    res.status(429).json({error: "Too many requests. Please try again later."});
    return;
  }

  // Security: CORS configuration
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes("*")) {
    res.set("Access-Control-Allow-Origin", "*");
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else if (origin) {
    res.status(403).json({error: "Origin not allowed"});
    return;
  }

  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  // Security: Enforce HTTPS in production
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    res.status(403).json({error: "HTTPS required"});
    return;
  }

  try {
    // Security: Validate and sanitize inputs
    const {amount, currency = "PHP", description, orderId, tableNumber, redirectUrl} = req.body;

    // Validate amount
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      res.status(400).json({error: amountValidation.error});
      return;
    }

    // Validate order ID
    const orderIdValidation = validateOrderId(orderId);
    if (!orderIdValidation.valid) {
      res.status(400).json({error: orderIdValidation.error});
      return;
    }

    // Validate currency
    const currencyValidation = validateCurrency(currency);
    if (!currencyValidation.valid) {
      res.status(400).json({error: currencyValidation.error});
      return;
    }

    // Sanitize string inputs
    const sanitizedDescription = sanitizeString(description, 200);
    const sanitizedTableNumber = sanitizeString(tableNumber, 50);

    // Security: Verify order exists
    const orderRef = admin.firestore().collection("orders").doc(orderIdValidation.orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      res.status(404).json({error: "Order not found"});
      return;
    }

    const orderData = orderDoc.data();

    // Security: Verify amount matches order total
    if (Math.abs(orderData.total - amountValidation.amount) > 0.01) {
      res.status(400).json({error: "Amount does not match order total"});
      return;
    }

    const secretKey = await getPayMongoSecretKey();
    if (!secretKey) {
      res.status(500).json({error: "Payment service temporarily unavailable"});
      return;
    }

    // Create PayMongo Checkout Session (Checkout API)
    try {
      const checkoutResponse = await axios.post(
          `${PAYMONGO_API_URL}/checkout_sessions`,
          {
            data: {
              attributes: {
                line_items: [
                  {
                    currency: currencyValidation.currency,
                    amount: Math.round(amountValidation.amount * 100), // Convert to cents
                    name: sanitizedDescription || `Order #${orderIdValidation.orderId}`,
                    quantity: 1,
                  },
                ],
                // Include both GCash and QR PH for Checkout API
                // QR PH will show QR code option on checkout page
                payment_method_types: ["gcash", "qrph"],
                success_url: redirectUrl || "https://paymongo.com/success",
                cancel_url: redirectUrl || "https://paymongo.com/cancel",
                metadata: {
                  order_id: orderIdValidation.orderId,
                  table_number: sanitizedTableNumber || "",
                  description: sanitizedDescription || `Order #${orderIdValidation.orderId}`,
                },
              },
            },
          },
          {
            headers: {
              "Authorization": getAuthHeader(secretKey),
              "Content-Type": "application/json",
            },
          },
      );

      if (!checkoutResponse.data?.data?.id) {
        throw new Error("Invalid response from PayMongo API");
      }

      const checkoutData = checkoutResponse.data.data;
      const checkoutSessionId = checkoutData.id;
      const checkoutUrl = checkoutData.attributes.checkout_url || null;

      if (!checkoutUrl) {
        throw new Error("No checkout URL received from PayMongo");
      }

      const ttlMinutes = 30;
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      // Store checkout session in Firestore
      await admin.firestore().collection("checkout_sessions").doc(checkoutSessionId).set({
        orderId: orderIdValidation.orderId,
        checkoutSessionId,
        amount: amountValidation.amount,
        currency: currencyValidation.currency,
        status: "pending",
        checkoutUrl,
        expiresAt: expiresAt.toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        clientIP,
        metadata: {
          orderId: orderIdValidation.orderId,
          tableNumber: sanitizedTableNumber || "",
        },
      });

      // Update order with checkout session info
      await orderRef.update({
        checkoutSessionId,
        paymentStatus: "pending",
        status: "pending_payment",
        checkoutExpiresAt: expiresAt.toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        checkoutSessionId,
        checkoutUrl,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("PayMongo checkout session creation error:", {
        message: error.message,
        orderId: orderId || "unknown",
        clientIP: getClientIP(req),
      });

      let errorMessage = "Checkout session creation failed";
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed";
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.errors?.[0]?.detail || "Invalid request";
      }

      res.status(error.response?.status || 500).json({
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error("Checkout session creation error:", error.message);
    res.status(500).json({
      error: "Checkout session creation failed",
    });
  }
};

// Export function
exports.createCheckoutSession = onRequest({
  region: "us-central1",
  cors: true,
}, createCheckoutSessionHandler);

/**
 * Handle PayMongo webhook events
 * Endpoint: POST /handlePayMongoWebhook
 * Configure this URL in PayMongo Dashboard > Settings > Webhooks
 *
 * SECURITY MEASURES:
 * - Webhook signature verification
 * - Request size limits
 * - Event structure validation
 * - Idempotency checks
 * - Amount verification
 * - IP logging for audit
 * - Error sanitization
 *
 * Handles:
 * - payment_intent.succeeded: Payment Intent completed (QR PH API)
 * - payment_intent.failed: Payment Intent failed
 * - payment_intent.canceled: Payment Intent canceled/expired
 * - payment.paid: Payment confirmed (triggers when payment is successful)
 * - payment.failed: Payment failed (triggers when payment fails)
 * - checkout_session.payment.paid: Checkout session payment confirmed
 * - source.expired: Source expired (legacy GCash)
 * - qrph.expired: QR PH expired (triggers 30 minutes after QR code generation)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handlePayMongoWebhookHandler = async (req, res) => {
  // Security: Check request size
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > MAX_REQUEST_SIZE) {
    res.status(413).json({error: "Request too large"});
    return;
  }

  // Security: Rate limiting
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    res.status(429).json({error: "Too many requests. Please try again later."});
    return;
  }

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  // Security: Enforce HTTPS in production
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    res.status(403).json({error: "HTTPS required"});
    return;
  }

  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    const signature = req.headers["paymongo-signature"];
    const webhookSecret = await getPayMongoWebhookSecret();

    if (process.env.NODE_ENV === "production" && webhookSecret) {
      if (!signature) {
        console.error("Webhook signature missing", {clientIP});
        res.status(401).json({error: "Signature required"});
        return;
      }

      const isValid = verifyPayMongoWebhookSignature(signature, rawBody, webhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature", {clientIP});
        // Log security event
        await admin.firestore().collection("security_events").add({
          type: "invalid_webhook_signature",
          clientIP,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(401).json({error: "Invalid signature"});
        return;
      }
    }

    // Parse event data
    const event = req.body?.data;
    if (!event || !event.type) {
      res.status(400).json({error: "Invalid webhook payload"});
      return;
    }

    const eventType = event.type;
    const eventId = event.id;

    // Check for duplicate events (idempotency)
    const eventDoc = await admin.firestore()
        .collection("webhook_events")
        .doc(eventId)
        .get();

    if (eventDoc.exists) {
      console.log("Duplicate webhook event ignored", {eventId, eventType});
      res.status(200).json({received: true, duplicate: true});
      return;
    }

    // Log webhook event
    await admin.firestore().collection("webhook_events").doc(eventId).set({
      eventId,
      eventType,
      clientIP,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      processed: false,
    });

    console.log("PayMongo webhook received:", eventType, eventId);

    // Handle different event types
    // Payment Intents API events: payment_intent.succeeded, payment_intent.failed
    // Legacy events: payment.paid, checkout_session.payment.paid
    if (
      eventType === "payment.paid" ||
      eventType === "checkout_session.payment.paid" ||
      eventType === "payment_intent.succeeded"
    ) {
      const paymentData = event.attributes;
      const paymentId = paymentData.id;
      const amount = paymentData.amount / 100; // Convert from cents
      const metadata = paymentData.metadata || {};

      // Get order_id from payment metadata or payment_intent document
      let orderId = metadata.order_id;

      // If order_id not in metadata, try to get it from payment_intent document
      if (!orderId) {
        // For payment.paid events, payment_intent_id is in paymentData.payment_intent_id
        // For payment_intent.succeeded events, the id itself is the payment_intent_id
        const paymentIntentId = paymentData.payment_intent_id ||
                                 paymentData.payment_intent?.id ||
                                 (eventType === "payment_intent.succeeded" ? paymentData.id : null);

        if (paymentIntentId) {
          console.log("Looking up payment_intent:", paymentIntentId);
          const intentDoc = await admin.firestore()
              .collection("payment_intents")
              .doc(paymentIntentId)
              .get();
          if (intentDoc.exists) {
            orderId = intentDoc.data().orderId;
            console.log("Found orderId from payment_intent:", orderId);
          } else {
            console.log("Payment intent document not found:", paymentIntentId);
          }
        }
      }

      if (!orderId) {
        console.error("Payment event missing order_id", {paymentId, eventId, eventType});
        res.status(400).json({error: "Missing order_id in payment metadata"});
        return;
      }

      // Verify order exists
      const orderRef = admin.firestore().collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        console.error("Order not found for payment", {orderId, paymentId});
        res.status(404).json({error: "Order not found"});
        return;
      }

      const orderData = orderDoc.data();

      // Verify amount matches
      if (Math.abs(orderData.total - amount) > 0.01) {
        console.error("Amount mismatch", {orderId, expected: orderData.total, received: amount});
        // Log security event
        await admin.firestore().collection("security_events").add({
          type: "amount_mismatch",
          orderId,
          expectedAmount: orderData.total,
          receivedAmount: amount,
          paymentId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(400).json({error: "Amount mismatch"});
        return;
      }

      // Update order to paid
      await orderRef.update({
        paymentStatus: "paid",
        status: "pending", // Ready for kitchen
        paymentId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Mark webhook event as processed
      await admin.firestore().collection("webhook_events").doc(eventId).update({
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        orderId,
        paymentId,
        amount,
      });

      console.log("Payment processed successfully", {
        orderId,
        paymentId,
        amount,
        eventType,
        eventId,
      });
    } else if (eventType === "payment.failed" || eventType === "payment_intent.failed") {
      const paymentData = event.attributes;
      const metadata = paymentData.metadata || {};
      let orderId = metadata.order_id;

      // For payment_intent events, get order_id from payment_intent document
      if (!orderId && eventType === "payment_intent.failed") {
        const paymentIntentId = paymentData.payment_intent?.id || paymentData.id;
        if (paymentIntentId) {
          const intentDoc = await admin.firestore()
              .collection("payment_intents")
              .doc(paymentIntentId)
              .get();
          if (intentDoc.exists) {
            orderId = intentDoc.data().orderId;
          }
        }
      }

      if (orderId) {
        const orderRef = admin.firestore().collection("orders").doc(orderId);
        await orderRef.update({
          paymentStatus: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else if (
      eventType === "source.expired" ||
      eventType === "qrph.expired" ||
      eventType === "payment_intent.canceled"
    ) {
      const sourceData = event.attributes;
      const metadata = sourceData.metadata || {};
      let orderId = metadata.order_id;

      // For payment_intent events, get order_id from payment_intent document
      if (!orderId && eventType === "payment_intent.canceled") {
        const paymentIntentId = sourceData.payment_intent?.id || sourceData.id;
        if (paymentIntentId) {
          const intentDoc = await admin.firestore()
              .collection("payment_intents")
              .doc(paymentIntentId)
              .get();
          if (intentDoc.exists) {
            orderId = intentDoc.data().orderId;
          }
        }
      }

      if (orderId) {
        const orderRef = admin.firestore().collection("orders").doc(orderId);
        await orderRef.update({
          paymentStatus: "expired",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    res.status(200).json({received: true});
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({error: "Webhook processing failed"});
  }
};

// Export function
exports.handlePayMongoWebhook = onRequest({
  region: "us-central1",
  cors: true,
}, handlePayMongoWebhookHandler);

/**
 * Update order status (for kitchen/cashier)
 * Endpoint: POST /updateOrderStatus
 */
exports.updateOrderStatus = onRequest({
  region: "us-central1",
  cors: true,
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const {orderId, status, userId} = req.body;

    if (!orderId || !status) {
      res.status(400).json({error: "Missing orderId or status"});
      return;
    }

    // Verify user has permission (admin, cashier, or kitchen)
    if (userId) {
      const userDoc = await admin.firestore().collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(403).json({error: "User not found"});
        return;
      }

      const userRole = userDoc.data().role;
      if (!["admin", "cashier", "kitchen"].includes(userRole)) {
        res.status(403).json({error: "Insufficient permissions"});
        return;
      }
    }

    const orderRef = admin.firestore().collection("orders").doc(orderId);
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add timestamps based on status
    if (status === "preparing") {
      updateData.preparationStartTime = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === "ready") {
      updateData.readyTime = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === "completed") {
      updateData.completedTime = admin.firestore.FieldValue.serverTimestamp();
    }

    await orderRef.update(updateData);

    res.json({success: true, orderId, status});
  } catch (error) {
    console.error("Order status update error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * Manually check payment status from PayMongo and update order
 * Endpoint: POST /checkPaymentStatus
 * This is a fallback if webhook fails
 */
exports.checkPaymentStatus = onRequest({
  region: "us-central1",
  cors: true,
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const {orderId, paymentIntentId} = req.body;

    if (!orderId) {
      res.status(400).json({error: "Missing orderId"});
      return;
    }

    // Get order from Firestore
    const orderRef = admin.firestore().collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      res.status(404).json({error: "Order not found"});
      return;
    }

    const orderData = orderDoc.data();
    const intentId = paymentIntentId || orderData.paymentIntentId;

    if (!intentId) {
      res.status(400).json({error: "Missing paymentIntentId"});
      return;
    }

    // Get PayMongo secret key
    const secretKey = await getPayMongoSecretKey();
    if (!secretKey) {
      res.status(500).json({error: "Payment service temporarily unavailable"});
      return;
    }

    // Check payment status from PayMongo API
    const paymentResponse = await axios.get(
        `${PAYMONGO_API_URL}/payment_intents/${intentId}`,
        {
          headers: {
            "Authorization": getAuthHeader(secretKey),
            "Content-Type": "application/json",
          },
        },
    );

    if (!paymentResponse.data?.data?.id) {
      res.status(404).json({error: "Payment intent not found"});
      return;
    }

    const paymentIntentData = paymentResponse.data.data;
    const status = paymentIntentData.attributes.status;
    const payment = paymentIntentData.attributes.payment;

    // If payment is succeeded, update order
    if (status === "succeeded") {
      let paymentId = null;
      let amount = paymentIntentData.attributes.amount / 100; // Convert from cents

      // If payment object exists, use it; otherwise use payment intent data
      if (payment) {
        paymentId = payment.id;
        amount = payment.attributes.amount / 100; // Convert from cents
      } else {
        // Payment object not yet attached, use payment intent ID as payment ID
        paymentId = paymentIntentData.id;
        // Amount is already set from payment intent
      }

      // Verify amount matches
      if (Math.abs(orderData.total - amount) > 0.01) {
        res.status(400).json({
          error: "Amount mismatch",
          expected: orderData.total,
          received: amount,
        });
        return;
      }

      // Update order to paid
      await orderRef.update({
        paymentStatus: "paid",
        status: "pending", // Ready for kitchen
        paymentId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Payment status checked and order updated", {
        orderId,
        paymentIntentId: intentId,
        paymentId,
        amount,
        hasPaymentObject: !!payment,
      });

      res.json({
        success: true,
        orderId,
        paymentIntentId: intentId,
        paymentId,
        status: "paid",
        amount,
      });
    } else {
      res.json({
        success: true,
        orderId,
        paymentIntentId: intentId,
        status,
        message: `Payment status: ${status}`,
      });
    }
  } catch (error) {
    console.error("Payment status check error:", error);
    res.status(500).json({
      error: error.message || "Payment status check failed",
      details: error.response?.data,
    });
  }
});

/**
 * Clean up old orders (scheduled function)
 * Runs daily at 2 AM UTC
 */
exports.cleanupOldOrders = onSchedule({
  schedule: "0 2 * * *",
  timeZone: "UTC",
}, async (event) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldOrdersSnapshot = await admin.firestore()
        .collection("orders")
        .where("createdAt", "<", thirtyDaysAgo)
        .where("status", "==", "completed")
        .limit(100)
        .get();

    const batch = admin.firestore().batch();
    oldOrdersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldOrdersSnapshot.docs.length} old orders`);
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});

/**
 * Send order notification (triggered when order status changes)
 * Note: Region set to asia-southeast1 to match Firestore database location
 */
exports.onOrderStatusChange = onDocumentUpdated(
    {
      document: "orders/{orderId}",
      region: "asia-southeast1",
    },
    async (event) => {
      const newData = event.data.after.data();
      const oldData = event.data.before.data();

      // Only send notification if status changed
      if (newData.status !== oldData.status) {
        const orderId = event.params.orderId;
        console.log(`Order ${orderId} status changed from ${oldData.status} to ${newData.status}`);

        // Here you can add push notification logic
        // For example, using FCM (Firebase Cloud Messaging)
        // await admin.messaging().send(...);
      }
    });

/**
 * Auto-cancel expired payments (scheduled function)
 * Runs every 5 minutes to cancel expired payment sources
 */
exports.autoCancelExpiredPayments = onSchedule({
  schedule: "*/5 * * * *", // Every 5 minutes
  timeZone: "UTC",
}, async (event) => {
  try {
    const now = new Date();
    const expiredSourcesSnapshot = await admin.firestore()
        .collection("payment_sources")
        .where("status", "==", "pending")
        .where("expiresAt", "<", now.toISOString())
        .limit(50)
        .get();

    const batch = admin.firestore().batch();
    expiredSourcesSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "expired",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update associated order if exists
      const sourceData = doc.data();
      if (sourceData.orderId) {
        const orderRef = admin.firestore().collection("orders").doc(sourceData.orderId);
        batch.update(orderRef, {
          paymentStatus: "expired",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    await batch.commit();
    console.log(`Cancelled ${expiredSourcesSnapshot.docs.length} expired payments`);
  } catch (error) {
    console.error("Auto-cancel expired payments error:", error);
  }
});
