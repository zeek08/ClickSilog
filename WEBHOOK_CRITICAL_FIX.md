# ⚠️ CRITICAL: Webhook Configuration Issues

## 🚨 Issue 1: Typo in Endpoint URL

**Current (WRONG):**
```
https://us-centra11-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
```
❌ Notice: `us-centra11` (has two 1's instead of L)

**Should be:**
```
https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
```
✅ Correct: `us-central1` (has L, not 11)

**This typo will cause ALL webhooks to fail!**

## 🚨 Issue 2: Missing Payment Intent Events

Your webhook is missing the **Payment Intent** events section entirely. These are **REQUIRED** for Payment Intents API (QR PH).

**Missing Events:**
- ❌ `payment_intent.succeeded` (REQUIRED)
- ❌ `payment_intent.failed` (optional)
- ❌ `payment_intent.canceled` (optional)

## How to Fix

### Step 1: Fix the URL Typo
1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Navigate to **Developers → Webhooks**
3. Click **Edit** on webhook `hook_kWhHMURHNHafnufh91nCeTDs`
4. In **Endpoint URL**, change:
   - **FROM:** `https://us-centra11-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
   - **TO:** `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
   - ⚠️ **Change `centra11` to `central1`** (replace `11` with `L`)

### Step 2: Add Payment Intent Events
1. In the same webhook edit page, scroll to **Events**
2. Look for **Payment Intent** section (if it doesn't exist, it may be collapsed or you need to scroll)
3. Enable these events:
   - ✅ `payment_intent.succeeded` (REQUIRED - this is critical!)
   - ✅ `payment_intent.failed` (optional, for error handling)
   - ✅ `payment_intent.canceled` (optional, for canceled payments)

### Step 3: Verify All Events
Make sure these events are enabled:

**Payment Intent:** (NEW - must add)
- ✅ `payment_intent.succeeded` (REQUIRED)
- ✅ `payment_intent.failed` (optional)
- ✅ `payment_intent.canceled` (optional)

**Payment:**
- ✅ `payment.paid` (already enabled)
- ✅ `payment.failed` (already enabled)

**QRPh:**
- ✅ `qrph.expired` (already enabled)

**Source:**
- ✅ `source.chargeable` (already enabled)

**Checkout Session:** (optional)
- ✅ `checkout_session.payment.paid` (already enabled)

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

## Why These Are Critical

### URL Typo
- **Current URL:** `us-centra11` → This domain doesn't exist!
- **Correct URL:** `us-central1` → This is your actual Firebase Function URL
- **Impact:** ALL webhooks will fail with "connection refused" or "host not found" errors

### Missing Payment Intent Events
- **Your code uses Payment Intents API** (see `functions/index.js` line 875)
- **Webhook handler listens for:** `payment_intent.succeeded` (line 875)
- **Impact:** Even if URL is fixed, webhooks won't trigger because the event type doesn't match

## Current Status

**Webhook ID:** `hook_kWhHMURHNHafnufh91nCeTDs`  
**Status:** ✅ Enabled  
**Endpoint URL:** ❌ **TYPO** - `us-centra11` should be `us-central1`  
**Events:** ❌ **Missing** `payment_intent.succeeded`

## After Fixing

Once both issues are fixed:
1. ✅ Webhooks will reach your Firebase Function
2. ✅ Payment events will be processed correctly
3. ✅ Payments will be confirmed instantly (no 5-second delay)
4. ✅ Automatic polling will still work as backup

## Testing

After fixing, test with a new payment:
1. Create a new order
2. Pay via GCash QR code
3. Check Firebase logs:
   ```bash
   firebase functions:log --only handlePayMongoWebhook
   ```
4. You should see:
   ```
   PayMongo webhook received: payment_intent.succeeded evt_xxxxx
   Looking up payment_intent: pi_xxxxx
   Found orderId from payment_intent: 1110021
   Payment processed successfully
   ```

## Quick Fix Checklist

- [ ] Fix URL: Change `us-centra11` → `us-central1`
- [ ] Add event: Enable `payment_intent.succeeded`
- [ ] Save webhook
- [ ] Test with new payment
- [ ] Verify logs show webhook received

