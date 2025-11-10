# Payment Flow & Account Setup Guide

## 💳 How Payments Work

### Payment Flow (Customer Side)

1. **Customer selects items** and adds to cart
2. **Customer goes to checkout** and selects **GCash** as payment method
3. **Customer taps "Pay"**
4. **App generates QR code** via PayMongo API
5. **Customer scans QR code** with GCash app
6. **Customer completes payment** in GCash app
7. **PayMongo sends webhook** to confirm payment
8. **Order status updates** to "paid" automatically

### Payment Flow (Technical)

```
Customer App → Cloud Function → PayMongo API → QR Code
                                              ↓
Customer scans QR → GCash App → PayMongo → Webhook → Order marked as paid
```

## 🏦 Which Account Receives Payments?

**Payments go to the PayMongo account that owns the API keys you're using.**

### Current Setup (Test Mode)

- **API Keys:** `sk_test_...` and `pk_test_...`
- **Account:** Your PayMongo test account
- **Payments:** Test payments (no real money)

### Production Mode

- **API Keys:** `sk_live_...` and `pk_live_...`
- **Account:** Your PayMongo live account
- **Payments:** Real money goes to your PayMongo account

## 📋 Setting Up Your PayMongo Account

### Step 1: Complete Business Verification

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to **Settings** → **Business Information**
3. Complete business verification:
   - Business name
   - Business address
   - Business registration number
   - Bank account details (for payouts)
   - Identity verification

### Step 2: Add Bank Account for Payouts

1. Go to **Settings** → **Payouts**
2. Add your bank account:
   - Bank name
   - Account number
   - Account name
   - Branch (if required)
3. Verify bank account (PayMongo will send a small test deposit)

### Step 3: Switch to Live Mode

1. Go to **Settings** → **API Keys**
2. Copy your **Live** API keys:
   - **Public Key:** `pk_live_xxxxx`
   - **Secret Key:** `sk_live_xxxxx`
3. Update your configuration:
   - Update `functions/.env` with live secret key
   - Update root `.env` with live public key
   - Update webhook secret (if different for live mode)
4. Redeploy functions:
   ```bash
   firebase deploy --only functions
   ```

## 💰 How Money Flows

### Payment Process

1. **Customer pays** via GCash → Money goes to **PayMongo**
2. **PayMongo holds** the payment (usually 1-3 business days)
3. **PayMongo transfers** to your bank account (automatic payouts)

### Payout Schedule

- **Default:** Automatic payouts every 1-3 business days
- **Custom:** Can be configured in PayMongo Dashboard
- **Minimum payout:** Usually ₱100 (check PayMongo for current minimum)

### Fees

- **PayMongo charges** a transaction fee (usually 3.5% + ₱15 per transaction)
- **Net amount** = Payment amount - PayMongo fees
- **Example:** ₱100 payment → ~₱96.50 after fees

## 🧪 Testing Payments

### Test Mode (Current Setup)

1. **Use test API keys** (`sk_test_...`, `pk_test_...`)
2. **Test payments** don't charge real money
3. **No real transactions** occur
4. **Perfect for development** and testing

### Test Payment Methods

1. **GCash Test Mode:**
   - Use PayMongo test payment simulator
   - Or use GCash test account (if available)

2. **Test Card Numbers:**
   - Use PayMongo test card numbers
   - Cards won't charge real money

### Production Mode

1. **Switch to live API keys** (`sk_live_...`, `pk_live_...`)
2. **Real payments** will be processed
3. **Real money** goes to your PayMongo account
4. **Automatic payouts** to your bank account

## 🔐 Security Notes

### API Keys

- **Secret Key:** Never expose in client-side code (only in Cloud Functions)
- **Public Key:** Safe to use in client app
- **Webhook Secret:** Keep secure (used for signature verification)

### Account Security

- **Enable 2FA** on your PayMongo account
- **Monitor transactions** regularly
- **Set up email notifications** for payments
- **Review payout schedule** and minimums

## 📊 Monitoring Payments

### PayMongo Dashboard

1. Go to **Payments** tab
2. View all transactions:
   - Payment status
   - Amount
   - Customer details
   - Transaction fees
   - Payout status

### Firebase Firestore

Check these collections:
- **`orders`** - Order status and payment info
- **`payment_sources`** - Payment source details
- **`webhook_events`** - Webhook event logs

### Cloud Functions Logs

```bash
# View payment-related logs
firebase functions:log --only createPaymentSource
firebase functions:log --only handlePayMongoWebhook
```

## 🚀 Going Live Checklist

- [ ] Business verification completed in PayMongo
- [ ] Bank account added and verified
- [ ] Live API keys obtained
- [ ] Live API keys configured in `.env` files
- [ ] Webhook configured with live secret
- [ ] Functions deployed with live keys
- [ ] Test payment completed successfully
- [ ] Email notifications enabled
- [ ] Payout schedule reviewed
- [ ] Transaction fees understood

## 📞 Support

- **PayMongo Support:** [support@paymongo.com](mailto:support@paymongo.com)
- **PayMongo Docs:** [https://developers.paymongo.com/](https://developers.paymongo.com/)
- **PayMongo Dashboard:** [https://dashboard.paymongo.com/](https://dashboard.paymongo.com/)

