# Webhook Testing Guide

## ✅ Webhook Configuration Complete!

You've fixed:
- ✅ Endpoint URL: `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
- ✅ Required events enabled

## Testing Your Webhook

### Step 1: Make a Test Payment
1. Open your app
2. Create a new order
3. Pay via GCash QR code
4. Complete the payment in GCash app

### Step 2: Check Webhook Logs
Run this command to see if webhooks are being received:

```bash
firebase functions:log --only handlePayMongoWebhook
```

**Expected Output:**
```
PayMongo webhook received: payment.paid evt_xxxxx
Looking up payment_intent: pi_xxxxx
Found orderId from payment_intent: 1110021
Payment processed successfully
```

### Step 3: Verify Order Status
1. Check your app - order should show as "Paid" instantly
2. Check Firebase Console → Firestore → `orders` collection
3. Order document should have:
   - `paymentStatus: "paid"`
   - `status: "pending"` (ready for kitchen)
   - `paidAt: [timestamp]`

## What Should Happen Now

### ✅ Instant Payment Confirmation
- **Before:** App waited 5 seconds (polling)
- **Now:** App updates instantly when webhook is received

### ✅ Automatic Order Updates
- Order status changes to "paid" automatically
- No manual refresh needed
- Cashier/kitchen screens update automatically

### ✅ Fallback Still Active
- If webhook fails, automatic polling (every 5 seconds) still works
- Best of both worlds: instant updates + reliable fallback

## Monitoring Webhooks

### Check Recent Webhooks
```bash
firebase functions:log --only handlePayMongoWebhook --limit 50
```

### Check All Function Logs
```bash
firebase functions:log
```

### Check Specific Order
1. Go to Firebase Console
2. Navigate to Firestore → `orders` collection
3. Find your order ID
4. Check `paymentStatus` and `paidAt` fields

## Troubleshooting

### If Webhooks Still Don't Work

1. **Verify Endpoint URL**
   - Go to PayMongo Dashboard → Webhooks
   - Check URL: `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
   - Make sure it's exactly this (no typos)

2. **Verify Events Enabled**
   - Check that these events are enabled:
     - `payment.paid`
     - `checkout_session.payment.paid`
     - `qrph.expired`
     - `source.chargeable`

3. **Check Webhook Secret**
   - Verify webhook secret in PayMongo Dashboard
   - Check it matches your `.env` file:
     ```env
     PAYMONGO_WEBHOOK_SECRET=whsk_xxxxx
     ```

4. **Check Firebase Logs**
   ```bash
   firebase functions:log --only handlePayMongoWebhook
   ```
   - Look for errors
   - Look for "PayMongo webhook received" messages

5. **Test Webhook Manually**
   - Make a test payment
   - Check if webhook is received within 1-2 seconds
   - If not, check PayMongo Dashboard → Webhooks → Recent Events

## Success Indicators

✅ **Webhook is working if:**
- Firebase logs show "PayMongo webhook received"
- Order status updates instantly (within 1-2 seconds)
- No need to wait 5 seconds for polling

✅ **Everything is working if:**
- Payment confirms instantly after paying
- Order shows as "Paid" immediately
- Cashier/kitchen screens update automatically

## Next Steps

1. **Test with a real payment** (use ₱1.00 for testing)
2. **Monitor logs** for the first few payments
3. **Verify order updates** in Firebase Console
4. **Check app behavior** - should be instant now!

## Notes

- **Webhooks are faster:** Instant updates vs 5-second polling
- **Polling is backup:** Still active if webhook fails
- **Both work together:** Best reliability with instant updates

## Support

If webhooks still don't work after testing:
1. Check Firebase Functions logs for errors
2. Verify webhook configuration in PayMongo Dashboard
3. Test with a new payment
4. Check webhook secret matches
