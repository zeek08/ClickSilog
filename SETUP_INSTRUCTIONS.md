# PayMongo GCash Integration - Setup Instructions

## 📋 What You Need to Do

Follow these steps to make the PayMongo GCash integration work:

---

## Step 1: Get PayMongo API Keys

1. **Sign up for PayMongo:**
   - Go to https://paymongo.com/
   - Create an account
   - Complete verification

2. **Get your API keys:**
   - Go to **Settings** → **API Keys**
   - Copy your **Test** keys (for development):
     - **Secret Key:** `sk_test_xxxxx` (keep this secret!)
     - **Public Key:** `pk_test_xxxxx` (safe to use in client app)

---

## Step 2: Configure Cloud Functions Secret Key

You have two options:

### Option A: Secret Manager (Recommended for Production)

```bash
# 1. Install Google Cloud SDK if not already installed
# Download from: https://cloud.google.com/sdk/docs/install

# 2. Set your project ID
export PROJECT_ID=your-firebase-project-id

# 3. Create the secret
gcloud secrets create paymongo-secret-key --project=$PROJECT_ID

# 4. Add your secret key value
echo -n "sk_test_xxxxx" | gcloud secrets versions add paymongo-secret-key --data-file=-

# 5. Grant Cloud Functions access to the secret
gcloud secrets add-iam-policy-binding paymongo-secret-key \
  --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Option B: Environment File (For Development)

```bash
# 1. Navigate to functions directory
cd functions

# 2. Create .env file
echo "PAYMONGO_SECRET_KEY=sk_test_xxxxx" > .env

# 3. Install dotenv (if not already installed)
npm install dotenv --save-dev
```

**Note:** The `.env` file is already in `.gitignore`, so it won't be committed.

---

## Step 3: Install Dependencies

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install
```

This will install:
- `@google-cloud/secret-manager` (for Secret Manager)
- `dotenv` (for local development)

---

## Step 4: Deploy Cloud Functions

```bash
# Make sure you're logged in to Firebase
firebase login

# Deploy the functions
firebase deploy --only functions

# Or deploy specific functions:
firebase deploy --only functions:createPaymentSource,functions:handlePayMongoWebhook
```

**After deployment, note your function URLs:**
- `createPaymentSource`: `https://[region]-[project-id].cloudfunctions.net/createPaymentSource`
- `handlePayMongoWebhook`: `https://[region]-[project-id].cloudfunctions.net/handlePayMongoWebhook`

**To find your region and project ID:**
- Region: Check `src/config/appConfig.js` → `firebase.region` (default: `us-central1`)
- Project ID: Check `src/config/appConfig.js` → `firebase.projectId`

---

## Step 5: Configure PayMongo Webhook

1. **Go to PayMongo Dashboard:**
   - Navigate to https://paymongo.com/
   - Login to your account

2. **Add Webhook:**
   - Go to **Settings** → **Webhooks**
   - Click **Add Webhook** or **Create Webhook**

3. **Configure Webhook:**
   - **Webhook URL:** 
     ```
     https://[region]-[project-id].cloudfunctions.net/handlePayMongoWebhook
     ```
     Replace:
     - `[region]` with your Cloud Functions region (e.g., `us-central1`)
     - `[project-id]` with your Firebase project ID
   
   - **Example:**
     ```
     https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
     ```

4. **Select Events:**
   Check these events:
   - ✅ `source.chargeable`
   - ✅ `source.failed`
   - ✅ `source.expired`
   - ✅ `payment.paid`
   - ✅ `payment.failed`

5. **Save the webhook**

6. **Test the webhook:**
   - PayMongo will send a test event
   - Check Cloud Functions logs: `firebase functions:log`
   - Verify the event is received

---

## Step 6: Configure Client App Environment

1. **Update your `.env` file** in the project root:

```env
# Firebase Configuration (if not already set)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_REGION=us-central1

# PayMongo Configuration
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxx

# Mock Mode (set to false to enable real payments)
EXPO_PUBLIC_USE_MOCKS=false
```

2. **Restart Expo:**
   ```bash
   npm start -- --clear
   ```

---

## Step 7: Test the Integration

### Test Payment Flow:

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Create a test order:**
   - Add items to cart
   - Go to payment screen
   - Select **GCash** as payment method
   - Click **Pay**

3. **Verify QR code appears:**
   - You should see a QR code or checkout URL
   - Order status should be "pending_payment"

4. **Complete test payment:**
   - Use PayMongo test payment simulator
   - Or scan QR with GCash test account
   - Payment should complete

5. **Verify payment confirmation:**
   - Check Firestore `orders` collection
   - Order should have `paymentStatus: 'paid'`
   - Order should have `status: 'pending'` (ready for kitchen)

### Check Logs:

```bash
# View Cloud Functions logs
firebase functions:log

# View specific function logs
firebase functions:log --only handlePayMongoWebhook
```

### Check Firestore:

1. **Open Firebase Console:**
   - Go to https://console.firebase.google.com/
   - Select your project
   - Go to **Firestore Database**

2. **Check these collections:**
   - `webhook_events` - Should show received webhook events
   - `payment_sources` - Should show created payment sources
   - `orders` - Should show orders with payment status

---

## Step 8: Production Deployment (When Ready)

1. **Switch to Production Keys:**
   ```bash
   # Update Secret Manager with live key
   echo -n "sk_live_xxxxx" | gcloud secrets versions add paymongo-secret-key --data-file=-
   ```

2. **Update Webhook in PayMongo:**
   - Use production Cloud Functions URL
   - Ensure HTTPS is enabled

3. **Update Client App:**
   ```env
   EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_xxxxx
   ```

4. **Deploy to Production:**
   ```bash
   firebase deploy --only functions --project your-production-project
   ```

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] Cloud Functions deployed successfully
- [ ] Webhook URL configured in PayMongo Dashboard
- [ ] Webhook events selected (source.chargeable, payment.paid, etc.)
- [ ] Secret key configured (Secret Manager or .env file)
- [ ] Client app environment variables set
- [ ] Test payment completed successfully
- [ ] Webhook events received (check Firestore `webhook_events`)
- [ ] Order status updated to "paid" after payment
- [ ] Kitchen dashboard shows paid orders only

---

## 🐛 Troubleshooting

### "PayMongo secret key not configured"

**Solution:**
- Check Secret Manager secret exists: `gcloud secrets list`
- OR check `functions/.env` file has `PAYMONGO_SECRET_KEY`
- Verify service account has access to Secret Manager

### "Webhook not receiving events"

**Solution:**
1. Verify webhook URL in PayMongo Dashboard
2. Check Cloud Functions logs: `firebase functions:log`
3. Verify HTTPS is enabled (production)
4. Check Firestore `webhook_events` collection

### "Payment not confirming"

**Solution:**
1. Check `webhook_events` collection in Firestore
2. Verify `payment.paid` event is received
3. Check order status in Firestore
4. Verify amount matches order total
5. Check for idempotency issues

### "Function deployment failed"

**Solution:**
1. Check Node.js version (should be 22)
2. Install dependencies: `cd functions && npm install`
3. Check Firebase CLI is up to date: `npm install -g firebase-tools`
4. Verify Firebase project is selected: `firebase use your-project-id`

---

## 📚 Additional Resources

- **Quick Start Guide:** See `QUICK_START.md`
- **Detailed Setup:** See `docs/PAYMONGO_SETUP_GUIDE.md`
- **Security Guide:** See `docs/PAYMONGO_SECURITY.md`
- **PayMongo Docs:** https://developers.paymongo.com/

---

## 🎯 Quick Command Reference

```bash
# Install dependencies
cd functions && npm install

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log

# Create secret in Secret Manager
gcloud secrets create paymongo-secret-key --project=YOUR_PROJECT_ID
echo -n "sk_test_xxxxx" | gcloud secrets versions add paymongo-secret-key --data-file=-

# Check secret exists
gcloud secrets list

# View function URLs
firebase functions:list
```

---

**Need Help?** Check the troubleshooting section or review the detailed guides in the `docs/` folder.



