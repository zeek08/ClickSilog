# PayMongo GCash Integration - Implementation Summary

This document summarizes the implementation of PayMongo GCash integration following the developer instruction manual.

## ✅ Implementation Status

All phases from the manual have been implemented:

### Phase 1-2: PayMongo Account & Feature Selection
- ✅ Using **QR PH API** (GCash QR code flow)
- ✅ Source creation with `type: "gcash"` generates QR codes

### Phase 3: Server Logic
- ✅ `POST /createPaymentSource` - Creates order and generates QR code
- ✅ `POST /handlePayMongoWebhook` - Handles webhook events
- ✅ Webhook signature verification implemented

### Phase 4-5: Webhook Setup & Verification
- ✅ **HMAC-SHA256 signature verification** implemented
- ✅ Webhook secret key retrieval from Secret Manager or environment
- ✅ Signature verification follows manual's exact process:
  1. Extract timestamp (t) and expected signature (te) from header
  2. Create signed_payload = timestamp + "." + raw_request_body
  3. Compute HMAC-SHA256(signed_payload, webhook_secret)
  4. Compare computed hash with expected signature (te)

### Phase 6: Payment Confirmation Flow
- ✅ Order created with `status: "pending_payment"`
- ✅ QR code generated and returned to frontend
- ✅ Webhook confirms payment and updates order to `status: "paid"`

### Phase 7: Safety Rules (Anti-scam)
- ✅ **Three verification checks** before marking order as paid:
  1. Order ID from source metadata
  2. Total Amount (exact PHP match)
  3. Payment Status = paid (verified by event type)
- ✅ Idempotency checks (prevents duplicate processing)
- ✅ Security event logging for suspicious activities
- ✅ Amount mismatch detection and flagging

## 🔧 Configuration Required

### 1. PayMongo API Keys

**For Local Development (`functions/.env`):**
```env
PAYMONGO_SECRET_KEY=sk_test_xxxxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxx
```

**For Production (Secret Manager):**
```bash
# Create secret for API key
gcloud secrets create paymongo-secret-key --project=YOUR_PROJECT_ID
echo -n "sk_live_xxxxx" | gcloud secrets versions add paymongo-secret-key --data-file=-

# Create secret for webhook secret
gcloud secrets create paymongo-webhook-secret --project=YOUR_PROJECT_ID
echo -n "whsec_xxxxx" | gcloud secrets versions add paymongo-webhook-secret --data-file=-
```

### 2. PayMongo Webhook Configuration

1. Go to **PayMongo Dashboard → Developers → Webhooks**
2. Create webhook with URL:
   ```
   https://[region]-[project-id].cloudfunctions.net/handlePayMongoWebhook
   ```
3. Enable these events:
   - ✅ `source.chargeable`
   - ✅ `source.failed`
   - ✅ `source.expired`
   - ✅ `payment.paid`
   - ✅ `payment.failed`
4. Copy the **Webhook Secret** and store it securely

### 3. Client App Configuration

**In `.env` file:**
```env
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_REGION=us-central1
EXPO_PUBLIC_USE_MOCKS=false
```

## 🔒 Security Features Implemented

1. **Webhook Signature Verification**
   - HMAC-SHA256 verification
   - Constant-time comparison (prevents timing attacks)
   - Mandatory in production, optional in development

2. **Payment Verification**
   - Order ID verification from source metadata
   - Amount matching (exact PHP comparison)
   - Payment status verification

3. **Idempotency**
   - Event ID tracking prevents duplicate processing
   - Webhook events logged in Firestore

4. **Security Event Logging**
   - Invalid signature attempts logged
   - Amount mismatches flagged for review
   - All security events stored in `security_events` collection

5. **Input Validation**
   - Amount limits (min: ₱0.01, max: ₱500.00)
   - Order ID format validation
   - Currency validation
   - Request size limits

## 📋 API Endpoints

### `POST /createPaymentSource`
Creates a PayMongo Source for GCash QR payment.

**Request:**
```json
{
  "amount": 100.00,
  "currency": "PHP",
  "orderId": "1234567",
  "description": "Order #1234567",
  "tableNumber": "5"
}
```

**Response:**
```json
{
  "success": true,
  "sourceId": "src_xxxxx",
  "checkoutUrl": "https://pay.paymongo.com/checkout/xxxxx",
  "qrData": "https://pay.paymongo.com/qr/xxxxx",
  "expiresAt": "2024-01-01T12:30:00.000Z"
}
```

### `POST /handlePayMongoWebhook`
Handles PayMongo webhook events (called by PayMongo automatically).

**Events Handled:**
- `payment.paid` - Marks order as paid
- `payment.failed` - Marks order as failed
- `source.chargeable` - Creates payment from source
- `source.failed` - Marks source as failed
- `source.expired` - Marks source as expired

## 🔄 Payment Flow

1. **Customer selects GCash and taps Pay**
   - Frontend calls `/createPaymentSource`
   - Backend creates order with `status: "pending_payment"`
   - Backend creates PayMongo Source (GCash QR)
   - QR code returned to frontend

2. **Customer scans QR code**
   - Customer opens GCash app
   - Scans QR code
   - Completes payment in GCash

3. **PayMongo sends webhook**
   - PayMongo sends `payment.paid` event
   - Backend verifies webhook signature
   - Backend verifies order ID, amount, and status
   - Backend updates order to `status: "paid"`

4. **Order ready for kitchen**
   - Order status changed to `"pending"` (ready for preparation)
   - Kitchen dashboard shows new order

## 🧪 Testing

### Test Mode Setup
1. Use test API keys (`sk_test_...`, `pk_test_...`)
2. Use test webhook secret from PayMongo Dashboard
3. Configure webhook URL (use ngrok for local testing)

### Test Flow
1. Create test order
2. Generate QR code
3. Use PayMongo test payment simulator
4. Verify webhook received
5. Verify order marked as paid

## 📝 Notes

- **Never mark order as paid without webhook confirmation**
- **Always verify webhook signature in production**
- **Keep webhook secret secure** (use Secret Manager)
- **Monitor security_events collection** for suspicious activities
- **Test thoroughly in test mode** before going live

## 🐛 Troubleshooting

### "Invalid signature" error
- Check webhook secret is correct
- Verify webhook secret matches PayMongo Dashboard
- Check raw body is being passed correctly

### "Webhook verification not configured"
- Set `PAYMONGO_WEBHOOK_SECRET` in environment
- Or create secret in Secret Manager
- Required in production mode

### Payment not confirming
- Check webhook events in Firestore `webhook_events` collection
- Verify webhook URL is correct in PayMongo Dashboard
- Check Cloud Functions logs: `firebase functions:log`

## 📚 References

- [PayMongo API Documentation](https://developers.paymongo.com/)
- [PayMongo Webhook Guide](https://developers.paymongo.com/docs/webhooks)
- [Firebase Secret Manager](https://cloud.google.com/secret-manager/docs)

