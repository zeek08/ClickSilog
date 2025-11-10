# PayMongo QR PH API - Complete Setup Guide

## 📚 Official Documentation Reference

Based on **PayMongo's official developer documentation** (developers.paymongo.com/docs), here's the correct implementation:

## 🔍 Research Findings

Based on comprehensive research of PayMongo's official documentation, here's what I discovered:

### ⚠️ **CRITICAL DISCOVERY: Wrong API Being Used**

**Current Implementation (WRONG):**
- Using **Sources API** with `type: "gcash"`
- This is for **legacy GCash payments**, not QR PH
- Returns checkout URL, not QR code data
- **This is why you're not getting QR codes!**

**Correct Implementation (NEEDED):**
- Use **Payment Intents API** with **QR PH Payment Method**
- Flow: Create Payment Intent → Create Payment Method (type: 'qrph') → Attach → Get QR code
- Returns QR code image in `next_action.qrph.image_uri` field

## 📚 Official PayMongo QR PH API Documentation

According to PayMongo's official documentation:

### **QR PH API Flow (Correct Way):**

1. **Create Payment Intent**
   ```
   POST /v1/payment_intents
   {
     "data": {
       "attributes": {
         "amount": 10000,  // in cents
         "currency": "PHP",
         "payment_method_allowed": ["qrph"],  // ✅ Include QR PH
         "description": "Order #123"
       }
     }
   }
   ```

2. **Create QR PH Payment Method**
   ```
   POST /v1/payment_methods
   {
     "data": {
       "attributes": {
         "type": "qrph",  // ✅ QR PH type
         "billing": {
           "name": "John Doe",  // Required
           "email": "customer@example.com",  // Required
           "phone": "+639123456789",  // Optional
           "address": {  // Optional - only include if needed
             "line1": "123 Main St",
             "city": "Manila",
             "state": "Metro Manila",
             "postal_code": "1000",
             "country": "PH"
           }
         }
       }
     }
   }
   ```
   
   **Note:** According to official docs, you only need:
   - `name` (required)
   - `email` (required)
   - `phone` (optional)
   - `address` (optional)

3. **Attach Payment Method to Payment Intent**
   ```
   POST /v1/payment_intents/:id/attach
   {
     "data": {
       "attributes": {
         "payment_method": "pm_xxxxx"
         // Note: client_key is only needed for client-side (public key) usage
         // When using secret key server-side, we don't need it
       }
     }
   }
   ```

4. **Get QR Code from Response**
   ```javascript
   // According to official PayMongo docs:
   // - next_action.code.image_url contains the base64-encoded QR code image
   // - next_action.type is "consume_qr"
   const qrCodeImageUrl = response.data.data.attributes.next_action.code.image_url;
   // This is a base64-encoded string: "data:image/png;base64,iVBORw0KG..."
   // You can display this directly as an image source
   ```

5. **Handle Payment Confirmation**
   - Set up webhook for `payment.paid` event
   - QR code expires after **30 minutes** (PayMongo standard for Online QR Ph)

## ✅ Account Setup Requirements

### **1. Activate QR PH on Your Account**

**According to PayMongo Official Documentation:**
- **New PayMongo accounts are typically pre-configured for QR PH**
- **All new PayMongo accounts are automatically configured for QR Ph**, allowing immediate testing upon sign-up
- If your account isn't configured, contact **support@paymongo.com** to request activation
- Request: "Enable QR PH API for Test Account"

**Check Account Status:**
- Go to PayMongo Dashboard
- Settings → Payment Methods
- Look for "QR PH" option
- Make sure it's enabled

### **2. API Keys (Already Configured)**

You already have these:
- ✅ Test Public Key: `pk_test_xxxxxxxxxxxxxxxxxxxxx`
- ✅ Test Secret Key: `sk_test_xxxxxxxxxxxxxxxxxxxxx`
- ✅ Webhook Secret: `whsk_xxxxxxxxxxxxxxxxxxxxx`

## 🔧 Implementation Changes Needed

### **Current Code (Sources API - WRONG):**

```javascript
// ❌ This is WRONG - Sources API doesn't return QR codes for QR PH
const sourceResponse = await axios.post(
  `${PAYMONGO_API_URL}/sources`,
  {
    data: {
      attributes: {
        type: "gcash",  // ❌ Wrong - this is legacy GCash, not QR PH
        amount: amount * 100,
        currency: "PHP",
        redirect: { ... }
      }
    }
  }
);
// ❌ This returns checkout_url, not QR code
const checkoutUrl = sourceData.attributes.redirect?.checkout_url;
const qrData = sourceData.attributes.qr?.data;  // ❌ This is null!
```

### **Correct Code (Payment Intents + QR PH - NEEDED):**

```javascript
// ✅ Step 1: Create Payment Intent with QR PH allowed
const intentResponse = await axios.post(
  `${PAYMONGO_API_URL}/payment_intents`,
  {
    data: {
      attributes: {
        amount: amount * 100,
        currency: "PHP",
        payment_method_allowed: ["qrph"],  // ✅ Include QR PH
        description: `Order #${orderId}`
      }
    }
  },
  {
    headers: {
      "Authorization": getAuthHeader(secretKey),
      "Content-Type": "application/json"
    }
  }
);

const intentId = intentResponse.data.data.id;
const clientKey = intentResponse.data.data.attributes.client_key;

// ✅ Step 2: Create QR PH Payment Method
const methodResponse = await axios.post(
  `${PAYMONGO_API_URL}/payment_methods`,
  {
    data: {
      attributes: {
        type: "qrph",  // ✅ QR PH type
        billing: {
          name: customerName || "Customer",
          email: customerEmail || "customer@example.com",
          phone: customerPhone || "+639000000000",
          address: {
            line1: addressLine1 || "123 Main St",
            city: city || "Manila",
            state: state || "Metro Manila",
            postal_code: postalCode || "1000",
            country: "PH"
          }
        }
      }
    }
  },
  {
    headers: {
      "Authorization": getAuthHeader(secretKey),
      "Content-Type": "application/json"
    }
  }
);

const methodId = methodResponse.data.data.id;

// ✅ Step 3: Attach Payment Method to Payment Intent
const attachResponse = await axios.post(
  `${PAYMONGO_API_URL}/payment_intents/${intentId}/attach`,
  {
    data: {
      attributes: {
        payment_method: methodId,
        client_key: clientKey
      }
    }
  },
  {
    headers: {
      "Authorization": getAuthHeader(secretKey),
      "Content-Type": "application/json"
    }
  }
);

// ✅ Step 4: Get QR Code from next_action
const qrCodeImageUri = attachResponse.data.data.attributes.next_action.qrph.image_uri;
// This is the QR code image URL you need to display!
```

## 📋 Complete Setup Checklist

### **1. Account Setup**
- [ ] Contact PayMongo support to enable QR PH API (if not already enabled)
- [ ] Verify QR PH is enabled in Settings → Payment Methods
- [ ] Confirm test API keys are active

### **2. Code Implementation**
- [ ] Update `createPaymentSource` function to use Payment Intents API
- [ ] Implement QR PH Payment Method creation with billing details
- [ ] Implement Payment Method attachment
- [ ] Extract QR code from `next_action.qrph.image_uri` field
- [ ] Update QR code expiration to 10 minutes (not 30)
- [ ] Update frontend to display QR code image from URI

### **3. Testing**
- [ ] Test Payment Intent creation with `payment_method_allowed: ["qrph"]`
- [ ] Test QR PH Payment Method creation
- [ ] Test Payment Method attachment
- [ ] Verify QR code image URI is returned
- [ ] Test QR code scanning with GCash app
- [ ] Test webhook for payment confirmation

### **4. Webhook Setup**
- [ ] Verify webhook URL is correct
- [ ] Enable `payment.paid` event
- [ ] Test webhook signature verification
- [ ] Test payment confirmation flow

## 🚨 Important Notes

1. **QR Code Expiration:** QR PH codes expire after **10 minutes** (not 30!)
2. **Billing Details Required:** QR PH requires billing information (name, email, address, phone)
3. **Payment Intent Flow:** Must use Payment Intents, not Sources API
4. **Test Mode:** QR PH works in test mode, but account must be enabled
5. **QR Code Format:** QR code is returned as an image URI, not raw data

## 📞 Support Contacts

**PayMongo Support:**
- Email: support@paymongo.com
- Subject: "Enable QR PH API for Test Account"
- Request: Enable QR PH API for generating dynamic QR codes via Payment Intents API

**Official Documentation:**
- QR PH API: https://developers.paymongo.com/docs/qr-ph-1
- Payment Intents: https://developers.paymongo.com/docs/payment-intents
- Payment Methods: https://developers.paymongo.com/docs/payment-methods
- Checkout API: https://developers.paymongo.com/docs/checkout-implementation
- In-Store QR PH: https://developers.paymongo.com/docs/in-store-qr-ph

**Official Help Articles:**
- How to activate QR PH: https://paymongo.help/en/articles/8679164-how-can-i-activate-qrph-on-my-account
- In-Store QR PH: https://paymongo.help/en/articles/11891703-paymongo-in-store-qr-ph

## 🎯 Next Steps

1. **Contact PayMongo Support** to enable QR PH API (if not already enabled)
2. **Update Code** to use Payment Intents API instead of Sources API
3. **Test Integration** in test mode
4. **Deploy** updated functions
5. **Monitor** Firebase logs for QR code generation

## 🔄 Alternative: Checkout API (Current Fallback)

If QR PH API is not available, the app currently uses **Checkout API**:
- ✅ Works without QR PH API
- ✅ Shows "Open Payment Page" button
- ✅ Opens PayMongo-hosted checkout page
- ✅ User completes payment there
- ✅ Webhook confirms payment

**According to PayMongo Documentation:**
- For Checkout API, you can add `'qrph'` under `payment_method_types` when creating a checkout session
- This will show QR PH option on the checkout page
- Reference: https://developers.paymongo.com/docs/checkout-implementation

This is a valid fallback, but QR codes are better for mobile apps!

## 💡 Key Findings from Official Documentation

1. **Account Status:** New accounts are **automatically configured** for QR PH
2. **API Flow:** Must use Payment Intents → Payment Method → Attach (not Sources API)
3. **QR Code Location:** QR code is in `next_action.qrph.image_uri` after attach
4. **Expiration:** QR codes expire after **10 minutes** (not 30!)
5. **Billing Required:** QR PH requires billing details (name, email, address, phone)
6. **Checkout API:** Can also use Checkout API with `payment_method_types: ['qrph']`

## 📝 Summary

**The Problem:**
- Current code uses Sources API with `type: "gcash"` (legacy)
- This doesn't return QR codes for QR PH
- Returns checkout URL instead

**The Solution:**
- Use Payment Intents API with QR PH Payment Method
- Follow the 3-step flow: Intent → Method → Attach
- Get QR code from `next_action.qrph.image_uri`

**What You Need to Do:**
1. Contact PayMongo support to enable QR PH API
2. Update code to use Payment Intents API
3. Test and deploy
