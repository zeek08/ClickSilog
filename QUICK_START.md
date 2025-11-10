# PayMongo GCash Integration - Quick Start

## 🚀 Quick Setup (5 Steps)

### Step 1: Get PayMongo Keys
1. Sign up at [PayMongo](https://paymongo.com/)
2. Go to **Settings** → **API Keys**
3. Copy your **Test** keys:
   - Secret Key: `sk_test_xxxxx` (for Cloud Functions)
   - Public Key: `pk_test_xxxxx` (for client app)

### Step 2: Configure Cloud Functions Secret

**Option A: Secret Manager (Production - Recommended)**
```bash
# Create secret
gcloud secrets create paymongo-secret-key --project=YOUR_PROJECT_ID

# Add secret value
echo -n "sk_test_xxxxx" | gcloud secrets versions add paymongo-secret-key --data-file=-

# Grant access to Cloud Functions
gcloud secrets add-iam-policy-binding paymongo-secret-key \
  --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Option B: Environment Variable (Development)**
```bash
# Create functions/.env file
cd functions
echo "PAYMONGO_SECRET_KEY=sk_test_xxxxx" > .env
```

### Step 3: Deploy Cloud Functions
```bash
# Install dependencies
cd functions
npm install

# Deploy functions
firebase deploy --only functions:createPaymentSource,functions:handlePayMongoWebhook
```

**Note your function URLs:**
- `createPaymentSource`: `https://[region]-[project-id].cloudfunctions.net/createPaymentSource`
- `handlePayMongoWebhook`: `https://[region]-[project-id].cloudfunctions.net/handlePayMongoWebhook`

### Step 4: Configure PayMongo Webhook
1. Go to PayMongo Dashboard → **Settings** → **Webhooks**
2. Click **Add Webhook**
3. **Webhook URL:** `https://[region]-[project-id].cloudfunctions.net/handlePayMongoWebhook`
   - Replace `[region]` with your Cloud Functions region (e.g., `us-central1`)
   - Replace `[project-id]` with your Firebase project ID
4. **Select Events:**
   - ✅ `source.chargeable`
   - ✅ `source.failed`
   - ✅ `source.expired`
   - ✅ `payment.paid`
   - ✅ `payment.failed`
5. Click **Save**

### Step 5: Configure Client App
1. Update `.env` file in project root:
   ```env
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_REGION=us-central1
   EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
   EXPO_PUBLIC_USE_MOCKS=false
   ```

2. Restart Expo:
   ```bash
   npm start -- --clear
   ```

## ✅ Test the Integration

1. **Create an order** in the app
2. **Select GCash** as payment method
3. **QR code should appear** on the payment screen
4. **Use PayMongo test simulator** to complete payment
5. **Verify order status** updates to "paid" in Firestore

## 🔍 Verify It's Working

### Check Cloud Functions Logs:
```bash
firebase functions:log --only handlePayMongoWebhook
```

### Check Firestore Collections:
- `webhook_events` - Should show received webhook events
- `payment_sources` - Should show created payment sources
- `orders` - Should show orders with `paymentStatus: 'paid'`

## 🐛 Common Issues

### Issue: "PayMongo secret key not configured"
**Solution:** 
- Check Secret Manager secret exists OR
- Check `functions/.env` file has `PAYMONGO_SECRET_KEY`

### Issue: Webhook not receiving events
**Solution:**
- Verify webhook URL in PayMongo Dashboard
- Check Cloud Functions logs
- Verify HTTPS is enabled (production)

### Issue: Payment not confirming
**Solution:**
- Check `webhook_events` collection in Firestore
- Verify `payment.paid` event is received
- Check order status in Firestore

## 📚 Full Documentation

See `docs/PAYMONGO_SETUP_GUIDE.md` for detailed setup instructions.

See `docs/PAYMONGO_SECURITY.md` for security best practices.

---

**Need Help?** Check the troubleshooting section in `docs/PAYMONGO_SETUP_GUIDE.md`



