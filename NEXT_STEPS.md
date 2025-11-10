# Next Steps - PayMongo Integration

## ✅ Completed

- [x] Removed all Xendit code and functions
- [x] Configured PayMongo test keys
- [x] Added webhook secret to `functions/.env`
- [x] Fixed all linting errors
- [x] Updated code to handle PayMongo webhook events
- [x] Implemented webhook signature verification

## 🔄 Next Steps

### 1. Deploy Functions to Firebase (REQUIRED)

```bash
firebase deploy --only functions
```

This will deploy all your updated functions with PayMongo integration.

**Expected output:**
- Functions will be deployed successfully
- You'll see URLs for each function
- The `handlePayMongoWebhook` function will be accessible at:
  `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`

### 2. Verify Webhook Configuration in PayMongo Dashboard

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to **Developers** → **Webhooks**
3. Verify your webhook is configured with:
   - **URL:** `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
   - **Events selected:**
     - ✅ `source.chargeable`
     - ✅ `payment.paid`
     - ✅ `payment.failed`
     - ✅ `qrph.expired`
   - **Webhook Secret:** `whsk_ENwMJttQWcRJUuEq9ZEiDBou` (already in your `.env`)

### 3. Test the Payment Flow

#### A. Test Order Creation
1. Start your Expo app:
   ```bash
   npm start
   ```
2. Create a test order
3. Select **GCash** as payment method
4. Tap **Pay**

#### B. Verify QR Code Generation
- You should see a QR code or checkout URL
- Order status should be `pending_payment` in Firestore

#### C. Complete Test Payment
- Use PayMongo test payment simulator
- Or scan QR with GCash test account
- Payment should complete

#### D. Verify Webhook Processing
1. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only handlePayMongoWebhook
   ```
2. Look for:
   - `PayMongo webhook received: payment.paid`
   - `Webhook signature verified successfully`
   - `Order [orderId] marked as paid via PayMongo webhook confirmation`

#### E. Verify Order Status
1. Check Firestore `orders` collection
2. Order should have:
   - `paymentStatus: "paid"`
   - `status: "pending"` (ready for kitchen)
   - `paymentId: "pay_xxxxx"`
   - `paidAt: [timestamp]`

### 4. Monitor and Debug (If Needed)

#### Check Function Logs
```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only handlePayMongoWebhook
firebase functions:log --only createPaymentSource
```

#### Check Firestore Collections
1. **`webhook_events`** - Should show received webhook events
2. **`payment_sources`** - Should show created payment sources
3. **`orders`** - Should show orders with payment status
4. **`security_events`** - Should show any security alerts (if any)

### 5. Production Deployment (When Ready)

#### Option A: Use Environment Variables (Current Setup)
Your current setup with `.env` file works for development. For production:

1. Set environment variables in Firebase Console:
   - Go to Firebase Console → Functions → Configuration
   - Add environment variables:
     - `PAYMONGO_SECRET_KEY=sk_live_xxxxx`
     - `PAYMONGO_WEBHOOK_SECRET=whsk_xxxxx`

2. Redeploy:
   ```bash
   firebase deploy --only functions
   ```

#### Option B: Use Secret Manager (Recommended for Production)
```bash
# Create secrets
gcloud secrets create paymongo-secret-key --project=clicksilog-9a095
echo -n "sk_live_xxxxx" | gcloud secrets versions add paymongo-secret-key --data-file=-

gcloud secrets create paymongo-webhook-secret --project=clicksilog-9a095
echo -n "whsk_xxxxx" | gcloud secrets versions add paymongo-webhook-secret --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding paymongo-secret-key \
  --member="serviceAccount:clicksilog-9a095@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding paymongo-webhook-secret \
  --member="serviceAccount:clicksilog-9a095@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Set USE_SECRET_MANAGER=true in Firebase Console environment variables
# Then redeploy
firebase deploy --only functions
```

## 🧪 Testing Checklist

- [ ] Functions deployed successfully
- [ ] Webhook URL accessible (returns error for GET, but confirms it's deployed)
- [ ] Test order created
- [ ] QR code generated
- [ ] Test payment completed
- [ ] Webhook received (check logs)
- [ ] Order status updated to "paid"
- [ ] Kitchen can see paid order

## 🐛 Troubleshooting

### Webhook not receiving events?
1. Check webhook URL is correct in PayMongo Dashboard
2. Verify webhook secret matches
3. Check function logs for errors
4. Verify events are selected in PayMongo Dashboard

### Payment not confirming?
1. Check `webhook_events` collection in Firestore
2. Verify `payment.paid` event is received
3. Check order status in Firestore
4. Verify amount matches order total
5. Check for idempotency issues

### Signature verification failing?
1. Verify webhook secret is correct
2. Check raw body is being passed correctly
3. Review security_events collection for alerts

## 📝 Summary

**Immediate Next Step:**
```bash
firebase deploy --only functions
```

After deployment, test the payment flow and verify webhook processing works correctly.

