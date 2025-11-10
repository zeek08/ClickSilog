# PayMongo Webhook Events to Enable

## ✅ Required Events (Enable These)

Based on your webhook handler code, enable these events:

### Payment
- ✅ **`payment.paid`** (REQUIRED - handles successful payments)
- ✅ **`payment.failed`** (RECOMMENDED - handles failed payments)
- ✅ **`payment.refunded`** (OPTIONAL - handles refunds)
- ✅ **`payment.refund.updated`** (OPTIONAL - handles refund status updates)

### Checkout Session
- ✅ **`checkout_session.payment.paid`** (REQUIRED - handles Checkout API payments)

### QRPh
- ✅ **`qrph.expired`** (REQUIRED - handles expired QR codes)

### Source
- ✅ **`source.chargeable`** (REQUIRED - handles GCash/GrabPay source authorization)

## ❌ Not Needed (Don't Enable)

### Link
- ❌ `link.payment.paid` (not used in your code)

### Platform Onboarding
- ❌ `merchant.activated`
- ❌ `merchant.declined`
- ❌ `consumer.activated`
- ❌ `consumer.declined`

### Subscription
- ❌ All subscription events (not used in your app)

## ⚠️ Important Note: Payment Intent Events

Your code also listens for:
- `payment_intent.succeeded`
- `payment_intent.failed`
- `payment_intent.canceled`

**However, these events are NOT in your available list!**

This means:
1. **Either** your PayMongo account doesn't have Payment Intent events enabled
2. **Or** they're included under the "Payment" events (some accounts combine them)
3. **Or** they're only available in certain account tiers

**Solution:** Enable `payment.paid` and `payment.failed` - these should work for Payment Intents API as well in most cases.

## Recommended Configuration

### Minimum (Required):
```
✅ Payment
   - payment.paid
   - payment.failed

✅ Checkout Session
   - checkout_session.payment.paid

✅ QRPh
   - qrph.expired

✅ Source
   - source.chargeable
```

### Recommended (Full Coverage):
```
✅ Payment
   - payment.paid
   - payment.failed
   - payment.refunded
   - payment.refund.updated

✅ Checkout Session
   - checkout_session.payment.paid

✅ QRPh
   - qrph.expired

✅ Source
   - source.chargeable
```

## How to Enable

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Navigate to **Developers → Webhooks**
3. Click **Edit** on your webhook (`hook_kWhHMURHNHafnufh91nCeTDs`)
4. Scroll to **Events** section
5. Enable the events listed above
6. Click **Save** or **Update Webhook**

## Testing

After enabling events, test with a payment:
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

## Event Flow

### QR PH Payment Flow:
1. User scans QR code → PayMongo processes payment
2. PayMongo sends `payment.paid` event (or `payment_intent.succeeded` if available)
3. Webhook handler receives event
4. Handler looks up order from `payment_intent` document
5. Handler updates order status to "paid"

### Checkout Session Flow:
1. User completes checkout → PayMongo processes payment
2. PayMongo sends `checkout_session.payment.paid` event
3. Webhook handler receives event
4. Handler updates order status to "paid"

### Expired QR Code Flow:
1. QR code expires (30 minutes)
2. PayMongo sends `qrph.expired` event
3. Webhook handler receives event
4. Handler updates order status to "expired"

## Troubleshooting

If webhooks still don't work:
1. ✅ Verify endpoint URL is correct: `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
2. ✅ Verify all required events are enabled
3. ✅ Check webhook secret matches your `.env` file
4. ✅ Check Firebase Functions logs for errors
5. ✅ Test with a new payment after fixing

