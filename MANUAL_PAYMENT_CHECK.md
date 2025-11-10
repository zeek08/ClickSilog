# Manual Payment Status Check

## Problem
- Payment is PAID in PayMongo Dashboard
- App still shows "Waiting for payment confirmation..."
- Order #1110022 and #1110021 are both PAID

## Solution: Manual Payment Status Check

The app has automatic polling (every 5 seconds), but if it's not working, we can manually check the payment status.

### Step 1: Check Firebase Functions Logs

Check if webhooks are being received:

```bash
firebase functions:log --only handlePayMongoWebhook --limit 20
```

**Expected Output:**
```
PayMongo webhook received: payment.paid evt_xxxxx
Looking up payment_intent: pi_xxxxx
Found orderId from payment_intent: 1110022
Payment processed successfully
```

### Step 2: Manually Check Payment Status

If webhooks aren't working, manually check payment status via the Cloud Function:

**Using curl (Windows PowerShell):**
```powershell
$body = @{
    orderId = "1110022"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://us-central1-clicksilog-9a095.cloudfunctions.net/checkPaymentStatus" -Method Post -Body $body -ContentType "application/json"
```

**Or using Postman/Insomnia:**
- URL: `https://us-central1-clicksilog-9a095.cloudfunctions.net/checkPaymentStatus`
- Method: POST
- Body (JSON):
```json
{
  "orderId": "1110022"
}
```

### Step 3: Check Order in Firestore

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Firestore Database**
3. Go to `orders` collection
4. Find order `1110022`
5. Check:
   - `paymentStatus` should be `"paid"`
   - `status` should be `"pending"` (ready for kitchen)
   - `paidAt` should have a timestamp
   - `paymentId` should have the PayMongo payment ID

### Step 4: Reload App

After checking payment status:
1. Reload the app in emulator (press `r` in Metro terminal)
2. Or shake emulator and tap "Reload"
3. The app should detect the payment status

## Troubleshooting

### If Order Status is Still "pending" in Firestore

The webhook might not be working. Check:

1. **Webhook URL in PayMongo Dashboard:**
   - Should be: `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
   - Make sure it's exactly this (no typos)

2. **Webhook Events Enabled:**
   - `payment.paid` ✅
   - `checkout_session.payment.paid` ✅
   - `qrph.expired` ✅
   - `source.chargeable` ✅

3. **Webhook Secret:**
   - Check it matches your `.env` file

### If Polling is Not Working

The app should poll every 5 seconds. If it's not working:

1. **Check Metro Bundler:**
   - Make sure Metro bundler is running
   - Check for errors in Metro terminal

2. **Check App Console:**
   - Open React Native Debugger
   - Check for errors in console
   - Look for "Error polling payment status" messages

3. **Reload App:**
   - Press `r` in Metro terminal
   - Or shake emulator and tap "Reload"

### If Manual Check Works But App Doesn't Update

1. **Check Firestore Subscription:**
   - The app subscribes to order changes
   - Check if subscription is working

2. **Check Polling Interval:**
   - Polling should run every 5 seconds
   - Check if it's actually running

3. **Force Reload:**
   - Close and reopen the app
   - Or restart the emulator

## Quick Fix

If nothing works, manually update the order in Firestore:

1. Go to Firebase Console → Firestore
2. Find order `1110022`
3. Update:
   - `paymentStatus`: `"paid"`
   - `status`: `"pending"`
   - `paidAt`: Current timestamp
   - `paymentId`: PayMongo payment ID (from dashboard)

4. Reload the app

## Next Steps

1. **Check webhook logs** to see if webhooks are being received
2. **Manually check payment status** for order #1110022
3. **Verify order in Firestore** has correct status
4. **Reload app** to see if it updates

## Prevention

To prevent this in the future:
1. ✅ Webhook is configured correctly
2. ✅ Events are enabled
3. ✅ Polling is active as backup
4. ✅ Manual check function is available

The issue is likely that:
- Webhooks aren't being received (check logs)
- Or webhooks are received but not processing correctly (check logs)
- Or order isn't being updated in Firestore (check Firestore)

