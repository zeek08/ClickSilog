const functions = require("firebase-functions");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// PayMongo Configuration
const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

// Helper to create Basic Auth header
const getAuthHeader = (secretKey) => {
  return `Basic ${Buffer.from(secretKey + ":").toString("base64")}`;
};

/**
 * Get PayMongo secret key from environment or Secret Manager
 */
const getPayMongoSecretKey = async () => {
  // First try environment variable (for local dev and new deployments)
  if (process.env.PAYMONGO_SECRET_KEY) {
    return process.env.PAYMONGO_SECRET_KEY;
  }

  // Fallback to legacy config (deprecated, will be removed March 2026)
  if (functions.config && functions.config().paymongo?.secret_key) {
    return functions.config().paymongo.secret_key;
  }

  // For production, use Secret Manager (recommended)
  // Uncomment and configure if using Secret Manager:
  /*
  try {
    const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: 'projects/clicksilog-9a095/secrets/paymongo-secret-key/versions/latest',
    });
    return version.payload.data.toString();
  } catch (error) {
    console.error('Error accessing secret:', error);
  }
  */

  return null;
};

/**
 * Create payment intent (server-side, secure)
 * Endpoint: POST /createPaymentIntent
 */
exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {amount, currency = "PHP", description, orderId} = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({error: "Invalid amount"});
      return;
    }

    const secretKey = await getPayMongoSecretKey();
    if (!secretKey) {
      res.status(500).json({error: "PayMongo secret key not configured. See functions/.env.example"});
      return;
    }

    const response = await axios.post(
        `${PAYMONGO_API_URL}/payment_intents`,
        {
          data: {
            attributes: {
              amount: Math.round(amount * 100), // Convert to cents
              currency: currency.toUpperCase(),
              payment_method_allowed: ["card", "gcash", "paymaya"],
              description: description || `Order #${orderId || "N/A"}`,
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

    const paymentIntentId = response.data.data.id;
    const clientKey = response.data.data.attributes.client_key;

    // Optionally save payment intent to Firestore
    if (orderId) {
      await admin.firestore().collection("payments").add({
        orderId,
        paymentIntentId,
        amount,
        currency,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({
      success: true,
      paymentIntentId,
      clientKey,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({
      error: error.response?.data?.errors?.[0]?.detail || error.message,
    });
  }
});

/**
 * Handle PayMongo webhook events
 * Endpoint: POST /handlePayMongoWebhook
 * Configure this URL in PayMongo Dashboard > Webhooks
 */
exports.handlePayMongoWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const event = req.body.data;

    if (!event || !event.type) {
      res.status(400).json({error: "Invalid webhook payload"});
      return;
    }

    console.log("PayMongo webhook received:", event.type);

    if (event.type === "payment.succeeded") {
      const paymentIntentId = event.attributes.payment_intent_id;
      const paymentId = event.attributes.id;
      const amount = event.attributes.amount / 100; // Convert from cents

      // Find orders with this payment intent ID
      const ordersSnapshot = await admin.firestore()
          .collection("orders")
          .where("paymentIntentId", "==", paymentIntentId)
          .get();

      if (!ordersSnapshot.empty) {
        const batch = admin.firestore().batch();

        ordersSnapshot.docs.forEach((orderDoc) => {
          // Update order payment status
          batch.update(orderDoc.ref, {
            paymentStatus: "paid",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        await batch.commit();
      }

      // Update payment record
      const paymentsSnapshot = await admin.firestore()
          .collection("payments")
          .where("paymentIntentId", "==", paymentIntentId)
          .get();

      if (!paymentsSnapshot.empty) {
        const batch = admin.firestore().batch();
        paymentsSnapshot.docs.forEach((paymentDoc) => {
          batch.update(paymentDoc.ref, {
            status: "succeeded",
            paymongoPaymentId: paymentId,
            amount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }

      console.log("Payment processed successfully:", paymentIntentId);
    } else if (event.type === "payment.failed") {
      const paymentIntentId = event.attributes.payment_intent_id;

      // Update orders and payments to failed status
      const ordersSnapshot = await admin.firestore()
          .collection("orders")
          .where("paymentIntentId", "==", paymentIntentId)
          .get();

      if (!ordersSnapshot.empty) {
        const batch = admin.firestore().batch();
        ordersSnapshot.docs.forEach((orderDoc) => {
          batch.update(orderDoc.ref, {
            paymentStatus: "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }
    }

    res.status(200).json({received: true});
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * Update order status (for kitchen/cashier)
 * Endpoint: POST /updateOrderStatus
 */
exports.updateOrderStatus = functions.https.onRequest(async (req, res) => {
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
