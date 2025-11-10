# Switch to Live Mode Guide

## ⚠️ Important: Before Switching to Live Mode

**You MUST complete these steps first:**
1. ✅ Complete Business Verification in PayMongo Dashboard
2. ✅ Add and Verify Your Bank Account
3. ✅ Understand that real money will be processed

## 🔄 How to Switch to Live Mode

### Step 1: Complete Business Verification

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Navigate to **Settings** → **Business Information**
3. Complete all required fields:
   - Business name
   - Business address
   - Business registration number
   - Identity verification documents

### Step 2: Add Your Bank Account

1. Go to **Settings** → **Payouts**
2. Click **"Add Bank Account"**
3. Enter your bank details:
   - Bank name
   - Account number
   - Account name
   - Branch (if required)
4. Verify your bank account (PayMongo will send a small test deposit)

### Step 3: Switch to Live Mode in Dashboard

1. In the **top right corner** of PayMongo Dashboard, toggle **"Test Mode"** to **"Live Mode"**
2. Confirm the switch

### Step 4: Get Your Live API Keys

1. Go to **Settings** → **API Keys**
2. Copy your **Live** API keys:
   - **Public Key:** `pk_live_xxxxx`
   - **Secret Key:** `sk_live_xxxxx`
   - **Webhook Secret:** `whsk_live_xxxxx` (check in Webhooks section)

### Step 5: Update Your Configuration Files

#### Update `functions/.env`:
```env
PAYMONGO_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
PAYMONGO_WEBHOOK_SECRET=whsk_YOUR_LIVE_WEBHOOK_SECRET_HERE
```

#### Update root `.env`:
```env
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_YOUR_LIVE_PUBLIC_KEY_HERE
```

### Step 6: Update Webhook URL

1. Go to **Settings** → **Webhooks**
2. Update your webhook URL to use live mode (if different)
3. Make sure `payment.paid` event is enabled

### Step 7: Deploy Updated Functions

```bash
firebase deploy --only functions
```

## ⚠️ Important Notes

### Before Going Live:
- ✅ Complete business verification
- ✅ Add and verify bank account
- ✅ Test thoroughly in test mode first
- ✅ Understand PayMongo fees (QR Ph: 1.5% per transaction)
- ✅ Set up email notifications for payments

### After Going Live:
- 💰 Real money will be processed
- 💰 Payments go to your PayMongo account
- 💰 Automatic payouts to your bank account (1-3 business days)
- 📊 Monitor transactions in PayMongo Dashboard
- 📧 Set up email notifications for payments

## 🧪 Testing in Live Mode

**⚠️ WARNING:** In live mode, all payments are REAL!

- Test with small amounts first (₱1.00)
- Verify webhook is working correctly
- Check that orders are updating properly
- Monitor PayMongo Dashboard for transactions

## 📞 Support

If you need help:
- **PayMongo Support:** support@paymongo.com
- **PayMongo Docs:** https://developers.paymongo.com/
- **PayMongo Dashboard:** https://dashboard.paymongo.com/

