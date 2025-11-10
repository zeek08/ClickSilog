# Live Mode Configuration Complete ✅

## Configuration Updated

Your PayMongo configuration has been updated to use **Live API Keys**:

### Updated Files:

#### `functions/.env`:
```env
PAYMONGO_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
PAYMONGO_WEBHOOK_SECRET=whsk_xxxxxxxxxxxxxxxxxxxxx
```

#### `.env` (root):
```env
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
```

## ⚠️ Important Notes

### Before Processing Real Payments:

1. **Business Verification** (May be required):
   - Go to PayMongo Dashboard → Settings → Business Information
   - Complete business verification if prompted
   - This may be required before processing real payments

2. **Bank Account Setup** (Required for payouts):
   - Go to PayMongo Dashboard → Settings → Payouts
   - Add and verify your bank account
   - This is required to receive money from PayMongo

3. **Webhook Configuration**:
   - Check if your webhook secret needs to be updated for live mode
   - Go to PayMongo Dashboard → Developers → Webhooks
   - Verify your webhook URL is correct
   - Make sure `payment.paid` event is enabled

## 🚀 Next Steps

### 1. Deploy Updated Functions

```bash
firebase deploy --only functions
```

This will deploy your functions with the live API keys.

### 2. Test with Small Amount

⚠️ **WARNING:** In live mode, all payments are REAL!

- Test with a small amount first (₱1.00)
- Verify the payment goes through
- Check that webhook is working
- Verify order status updates correctly

### 3. Monitor Transactions

- Check PayMongo Dashboard → Payments
- Monitor Firebase Functions logs
- Check Firestore for order updates

## 💰 How Money Flows (Live Mode)

1. **Customer pays** via GCash → Money goes to **PayMongo**
2. **PayMongo holds** the payment (usually 1-3 business days)
3. **PayMongo transfers** to your bank account (automatic payouts)

### Fees:
- **QR Ph:** 1.5% per transaction
- **Example:** ₱100 payment → ₱98.50 after fees

### Payout Schedule:
- **Default:** Automatic payouts every 1-3 business days
- **Minimum payout:** Usually ₱100

## 🔐 Security Reminders

- ✅ Secret key is only in `functions/.env` (not exposed to client)
- ✅ Public key is safe to use in client app
- ✅ Webhook secret is used for signature verification
- ✅ Never commit `.env` files to git

## 📊 Monitoring

### PayMongo Dashboard:
- View all transactions
- Check payment status
- Monitor payouts
- View transaction fees

### Firebase:
- Check Functions logs for webhook events
- Monitor Firestore for order updates
- Check `webhook_events` collection for webhook logs

## 🆘 Troubleshooting

If payments aren't working:

1. **Check Business Verification:**
   - Some accounts may need verification before processing real payments
   - Contact PayMongo support if needed

2. **Check Bank Account:**
   - Ensure bank account is added and verified
   - Required for payouts

3. **Check Webhook:**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Ensure `payment.paid` event is enabled

4. **Check Logs:**
   ```bash
   firebase functions:log
   ```

## 📞 Support

- **PayMongo Support:** support@paymongo.com
- **PayMongo Docs:** https://developers.paymongo.com/
- **PayMongo Dashboard:** https://dashboard.paymongo.com/

