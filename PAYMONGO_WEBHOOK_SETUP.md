# PayMongo Webhook Setup Guide

## Required Events to Check

Based on your ClickSilog implementation, you need to select these events:

### ✅ **MUST SELECT (Critical for Payment Flow):**

1. **Under "Source" section:**
   - ✅ `source.chargeable` - **REQUIRED**
     - Triggered when GCash QR code is scanned and ready for payment
     - Your code automatically creates payment from source when this event is received

2. **Under "Payment" section:**
   - ✅ `payment.paid` - **REQUIRED** (Most Important!)
     - Triggered when payment is successfully completed
     - This is the **critical confirmation** that marks your order as paid
     - Your code verifies order ID, amount, and status before marking order as paid
   
   - ✅ `payment.failed` - **REQUIRED**
     - Triggered when payment fails
     - Your code updates order status to "failed"

### ⚠️ **OPTIONAL (Recommended for Better UX):**

3. **Under "QRPh" section:**
   - ✅ `qrph.expired` - **RECOMMENDED**
     - Triggered when QR code expires (usually after 30 minutes)
     - **Note:** Your code expects `source.expired` event, but PayMongo may send `qrph.expired` for QR PH payments
     - You may need to update your code to handle both event types

### ❌ **DO NOT SELECT (Not Used in Your Code):**

- `checkout_session.payment.paid` - Not used (you use Source API, not Checkout API)
- `link.payment.paid` - Not used
- `payment.refund.updated` - Not used
- `payment.refunded` - Not used
- All Subscription events - Not used
- All Platform Onboarding events - Not used

## Summary: Check These Events

```
✅ Source:
   ✅ source.chargeable

✅ Payment:
   ✅ payment.paid
   ✅ payment.failed

✅ QRPh:
   ✅ qrph.expired (recommended)
```

## Important Notes

1. **`payment.paid` is CRITICAL** - This is the only event that marks orders as paid. Without it, orders will never be confirmed.

2. **Event Name Mismatch:** Your code expects `source.expired` but PayMongo may send `qrph.expired` for QR PH payments. You may need to update your code to handle both.

3. **After Creating Webhook:**
   - Copy the **Webhook Secret** (starts with `whsec_`)
   - Add it to `functions/.env`:
     ```
     PAYMONGO_WEBHOOK_SECRET=whsec_your_secret_here
     ```
   - Redeploy functions:
     ```bash
     firebase deploy --only functions
     ```

## Testing

After setting up the webhook:

1. Create a test order
2. Generate GCash QR code
3. Complete test payment
4. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only handlePayMongoWebhook
   ```
5. Verify order status updated in Firestore

