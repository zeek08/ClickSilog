# Webhook Troubleshooting Guide

## Issue: Payment Confirmed in PayMongo but App Still Waiting

### Problem
- Payment shows as "PAID" in PayMongo Dashboard
- App still shows "Waiting for payment confirmation..."
- No webhook events received in Firebase Functions logs

### Root Cause
Webhooks from PayMongo are not reaching the Firebase Function. This can happen if:
1. Webhook URL is not configured correctly in PayMongo Dashboard
2. Webhook events are not enabled
3. Webhook secret mismatch
4. Network/firewall issues

### Solution Implemented

#### 1. Automatic Payment Status Polling (Fallback)
The app now automatically checks payment status every 5 seconds:
- **Location**: `src/screens/customer/GCashPaymentScreen.js`
- **Function**: `checkPaymentStatusViaFunction` in `src/services/paymentService.js`
- **Cloud Function**: `checkPaymentStatus` (deployed)

**How it works:**
- Polls every 5 seconds while payment is pending
- Checks PayMongo API directly if webhook fails
- Updates order status automatically when payment is confirmed
- Stops polling after 5 minutes or when payment is confirmed

#### 2. Manual Payment Status Check
You can also manually check payment status via the Cloud Function:
```bash
POST https://us-central1-clicksilog-9a095.cloudfunctions.net/checkPaymentStatus
Body: {
  "orderId": "1110021",
  "paymentIntentId": "pi_cxoj2s696G8acrVJbeYEWfVF" // optional
}
```

### Fix Webhook Configuration

#### Step 1: Verify Webhook URL in PayMongo Dashboard
1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Navigate to **Developers → Webhooks**
3. Check if webhook exists with URL:
   ```
   https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
   ```
4. If not, create a new webhook with this URL

#### Step 2: Enable Required Events
Make sure these events are enabled:
- ✅ `payment.paid` (required)
- ✅ `payment_intent.succeeded` (for Payment Intents API)
- ✅ `payment.failed` (optional, for error handling)
- ✅ `qrph.expired` (optional, for expired QR codes)

#### Step 3: Verify Webhook Secret
1. In PayMongo Dashboard → Webhooks, copy the **Webhook Secret**
2. Verify it matches your `.env` file:
   ```env
   PAYMONGO_WEBHOOK_SECRET=whsk_ENwMJttQWcRJUuEq9ZEiDBou
   ```
3. If different, update `.env` and redeploy:
   ```bash
   firebase functions:config:set paymongo.webhook_secret="YOUR_WEBHOOK_SECRET"
   firebase deploy --only functions:handlePayMongoWebhook
   ```

#### Step 4: Test Webhook
1. Make a test payment
2. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only handlePayMongoWebhook
   ```
3. You should see logs like:
   ```
   PayMongo webhook received: payment.paid evt_xxxxx
   Payment processed successfully
   ```

### Current Status

✅ **Automatic Polling**: Active (checks every 5 seconds)
✅ **Manual Check Function**: Deployed
⚠️ **Webhooks**: Not receiving events (needs configuration)

### Next Steps

1. **Immediate**: The app will automatically detect your current payment within 5 seconds
2. **Short-term**: Configure webhooks in PayMongo Dashboard (see above)
3. **Long-term**: Monitor webhook logs to ensure they're working

### Testing

To test the payment status check manually:
```javascript
// In your app or via API client
const response = await fetch(
  'https://us-central1-clicksilog-9a095.cloudfunctions.net/checkPaymentStatus',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: '1110021',
      paymentIntentId: 'pi_cxoj2s696G8acrVJbeYEWfVF'
    })
  }
);
const result = await response.json();
console.log(result);
```

### Monitoring

Check webhook events in Firebase:
```bash
# View webhook logs
firebase functions:log --only handlePayMongoWebhook

# View payment status check logs
firebase functions:log --only checkPaymentStatus

# View all function logs
firebase functions:log
```

### Notes

- **Polling is a fallback**: Webhooks are preferred for real-time updates
- **Polling stops automatically**: After 5 minutes or when payment is confirmed
- **No performance impact**: Polling only happens while payment is pending
- **Webhook is more efficient**: Once configured, webhooks will update orders instantly

