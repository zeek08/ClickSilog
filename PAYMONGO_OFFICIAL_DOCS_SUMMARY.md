# PayMongo Official Documentation Summary

## 📚 Based on developers.paymongo.com/docs

### ✅ **Confirmed: Current Implementation is WRONG**

**What We're Using (WRONG):**
- Sources API with `type: "gcash"`
- This is for **legacy GCash payments**, not QR PH
- Returns `checkout_url`, not QR code data

**What We Should Use (CORRECT):**
- **Option 1:** Payment Intents API with QR PH Payment Method
- **Option 2:** Checkout API with `payment_method_types: ["qrph"]`

## 🎯 Official PayMongo QR PH API Flow

### **Method 1: Payment Intents API (Recommended for Mobile Apps)**

According to official documentation:

1. **Create Payment Intent**
   ```
   POST /v1/payment_intents
   {
     "data": {
       "attributes": {
         "amount": 10000,
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
           "name": "John Doe",
           "email": "customer@example.com",
           "phone": "+639123456789",
           "address": {
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

3. **Attach Payment Method**
   ```
   POST /v1/payment_intents/:id/attach
   {
     "data": {
       "attributes": {
         "payment_method": "pm_xxxxx",
         "client_key": "client_xxxxx"
       }
     }
   }
   ```

4. **Get QR Code**
   ```javascript
   // QR code is in next_action field
   const qrCodeImageUri = response.data.data.attributes.next_action.qrph.image_uri;
   ```

### **Method 2: Checkout API (Easier, but shows checkout page)**

According to official documentation:

```
POST /v1/checkout_sessions
{
  "data": {
    "attributes": {
      "line_items": [...],
      "payment_method_types": ["qrph"],  // ✅ Include QR PH
      "success_url": "...",
      "cancel_url": "..."
    }
  }
}
```

**Note:** This shows a checkout page with QR PH option, not a direct QR code.

## ✅ Account Setup

**According to Official Documentation:**
- **New PayMongo accounts are automatically configured for QR Ph**
- **All new PayMongo accounts are automatically configured for QR Ph**, allowing immediate testing upon sign-up
- If your account isn't configured, contact **support@paymongo.com**

## 📋 Key Points from Official Docs

1. **QR Code Expiration:** 10 minutes (not 30!)
2. **Billing Details Required:** Name, email, address, phone
3. **QR Code Location:** `next_action.qrph.image_uri` after attach
4. **Test Mode:** QR PH works in test mode
5. **Webhook Event:** `payment.paid` for confirmation

## 🔧 What Needs to Change

### **Current Code Issues:**
1. ❌ Using Sources API instead of Payment Intents API
2. ❌ Using `type: "gcash"` instead of `type: "qrph"`
3. ❌ Not creating Payment Method
4. ❌ Not attaching Payment Method
5. ❌ QR code expiration set to 30 minutes (should be 10)

### **What to Fix:**
1. ✅ Update to use Payment Intents API
2. ✅ Create QR PH Payment Method with billing details
3. ✅ Attach Payment Method to Payment Intent
4. ✅ Extract QR code from `next_action.qrph.image_uri`
5. ✅ Update expiration to 10 minutes
6. ✅ Update Checkout API to include `"qrph"` in `payment_method_types`

## 📞 Official Resources

**Documentation:**
- QR PH API: https://developers.paymongo.com/docs/qr-ph-1
- Payment Intents: https://developers.paymongo.com/docs/payment-intents
- Payment Methods: https://developers.paymongo.com/docs/payment-methods
- Checkout API: https://developers.paymongo.com/docs/checkout-implementation

**Help Articles:**
- How to activate QR PH: https://paymongo.help/en/articles/8679164-how-can-i-activate-qrph-on-my-account
- In-Store QR PH: https://paymongo.help/en/articles/11891703-paymongo-in-store-qr-ph

## 🎯 Next Steps

1. **Verify Account:** Check if QR PH is enabled (new accounts should be pre-configured)
2. **Update Code:** Change from Sources API to Payment Intents API
3. **Test:** Test QR code generation in test mode
4. **Deploy:** Deploy updated functions

