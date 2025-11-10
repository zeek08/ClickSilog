# Payment Not Updating - Fix Guide

## Problem
- Payment is **PAID** in PayMongo Dashboard ✅
- Payment status check shows **"succeeded"** ✅
- But order is **NOT updated** in Firestore ❌
- App still shows **"Waiting for payment confirmation..."** ❌

## Root Cause
The payment is confirmed in PayMongo, but:
1. **Webhook might not have been received** (check logs)
2. **Or webhook didn't process correctly** (check logs)
3. **Or order update failed** (check Firestore)

## Solution

### Step 1: Check Webhook Logs

Check if webhooks are being received:

```bash
firebase functions:log --only handlePayMongoWebhook --limit 20
```

**Expected Output (if webhooks are working):**
```
PayMongo webhook received: payment.paid evt_xxxxx
Looking up payment_intent: pi_xxxxx
Found orderId from payment_intent: 1110022
Payment processed successfully
```

**If no webhooks are received:**
- Webhook URL might be incorrect
- Webhook events might not be enabled
- Webhook secret might be wrong

### Step 2: Manually Update Order in Firestore

If webhooks aren't working, manually update the order:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Firestore Database**
3. Go to `orders` collection
4. Find order `1110022`
5. Click **Edit** (pencil icon)
6. Update these fields:
   - `paymentStatus`: `"paid"`
   - `status`: `"pending"` (ready for kitchen)
   - `paidAt`: Current timestamp (or leave as is)
   - `paymentId`: PayMongo payment ID (from dashboard)
7. Click **Update**

### Step 3: Reload App

After updating the order:
1. **Reload the app in emulator:**
   - Press `r` in Metro terminal
   - Or shake emulator and tap "Reload"
   - Or press `Ctrl+M` in emulator and tap "Reload"

2. **The app should detect the payment status immediately**

### Step 4: Check Polling

The app should poll every 5 seconds. If it's not working:

1. **Check Metro Bundler:**
   - Make sure Metro bundler is running
   - Check for errors in Metro terminal

2. **Check App Console:**
   - Open React Native Debugger
   - Check for errors in console
   - Look for "Error polling payment status" messages

3. **Force Reload:**
   - Close and reopen the app
   - Or restart the emulator

## Why This Happened

### Webhook Not Received
- **Webhook URL might be incorrect** (check for typos)
- **Webhook events might not be enabled** (check PayMongo Dashboard)
- **Webhook secret might be wrong** (check `.env` file)

### Webhook Received But Not Processed
- **Order ID not found** (check if order exists in Firestore)
- **Payment intent not found** (check if `paymentIntentId` is stored)
- **Amount mismatch** (check if amounts match)

### Order Update Failed
- **Firestore permissions** (check if function has write access)
- **Network issues** (check Firebase status)
- **Function timeout** (check function logs)

## Prevention

To prevent this in the future:

1. **Verify Webhook Configuration:**
   - ✅ URL: `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
   - ✅ Events: `payment.paid`, `checkout_session.payment.paid`, `qrph.expired`, `source.chargeable`
   - ✅ Secret: Matches `.env` file

2. **Monitor Webhook Logs:**
   ```bash
   firebase functions:log --only handlePayMongoWebhook
   ```

3. **Test Webhooks:**
   - Make a test payment
   - Check logs immediately
   - Verify order updates

4. **Keep Polling Active:**
   - Polling is backup if webhooks fail
   - Checks every 5 seconds
   - Should detect payment within 5 seconds

## Quick Fix Checklist

- [ ] Check webhook logs: `firebase functions:log --only handlePayMongoWebhook --limit 20`
- [ ] Manually update order in Firestore (if needed)
- [ ] Reload app in emulator
- [ ] Verify order updates
- [ ] Check if polling is working
- [ ] Fix webhook configuration (if needed)

## Next Steps

1. **Check webhook logs** to see if webhooks are being received
2. **Manually update order** in Firestore (if webhooks aren't working)
3. **Reload app** to see if it updates
4. **Fix webhook configuration** to prevent future issues

## Support

If nothing works:
1. Check Firebase Functions logs for errors
2. Check PayMongo Dashboard for webhook events
3. Check Firestore for order status
4. Test with a new payment

