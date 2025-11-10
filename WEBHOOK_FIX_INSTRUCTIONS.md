# PayMongo Webhook Configuration Fix

## Issues Found

### 1. ❌ Missing `https://` in Endpoint URL
**Current (Incorrect):**
```
us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
```

**Should be:**
```
https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
```

### 2. ❌ Missing `payment_intent.succeeded` Event
Your webhook is missing the `payment_intent.succeeded` event, which is required for Payment Intents API (used for QR PH).

## How to Fix

### Step 1: Update Endpoint URL
1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Navigate to **Developers → Webhooks**
3. Click **Edit** on your webhook (`hook_kWhHMURHNHafnufh91nCeTDs`)
4. Update the **Endpoint URL** to:
   ```
   https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
   ```
   ⚠️ **Important**: Make sure to include `https://` at the beginning!

### Step 2: Add Missing Event
1. In the same webhook edit page, scroll to **Events**
2. Under **Payment Intent** section, enable:
   - ✅ `payment_intent.succeeded` (required for QR PH)
   - ✅ `payment_intent.failed` (optional, for error handling)
   - ✅ `payment_intent.canceled` (optional, for canceled payments)

### Step 3: Verify All Events
Make sure these events are enabled:

**Payment Intent:**
- ✅ `payment_intent.succeeded` (NEW - required)
- ✅ `payment_intent.failed` (optional)
- ✅ `payment_intent.canceled` (optional)

**Payment:**
- ✅ `payment.paid` (already enabled)
- ✅ `payment.failed` (already enabled)

**QRPh:**
- ✅ `qrph.expired` (already enabled)

**Source:**
- ✅ `source.chargeable` (already enabled)

### Step 4: Save and Test
1. Click **Save** or **Update Webhook**
2. Make a test payment
3. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only handlePayMongoWebhook
   ```
4. You should see logs like:
   ```
   PayMongo webhook received: payment_intent.succeeded evt_xxxxx
   Payment processed successfully
   ```

## Current Configuration

**Webhook ID:** `hook_kWhHMURHNHafnufh91nCeTDs`  
**Status:** ✅ Enabled  
**Endpoint URL:** ❌ Missing `https://`  
**Events:** ⚠️ Missing `payment_intent.succeeded`

## After Fixing

Once you've updated the webhook:
1. The endpoint URL should be: `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
2. All required events should be enabled
3. Webhooks should start working immediately
4. Payments will be confirmed instantly (no need to wait 5 seconds)

## Testing

After fixing, test with a new payment:
1. Create a new order
2. Pay via GCash QR code
3. Check Firebase logs:
   ```bash
   firebase functions:log --only handlePayMongoWebhook
   ```
4. You should see webhook events being received

## Notes

- **Automatic polling is still active**: Even if webhooks work, the app will still poll every 5 seconds as a fallback
- **Webhooks are faster**: Instant updates vs 5-second polling
- **Both work together**: Webhooks for instant updates, polling as backup

