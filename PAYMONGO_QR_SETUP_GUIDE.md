# PayMongo QR PH Setup Guide

## 🔍 Issue: No QR Code Returned

If you're seeing a checkout URL instead of a QR code, it means **QR PH API is not enabled** in your PayMongo account.

## ⚠️ Important: Static vs Dynamic QR Codes

**Static In-Store QR Code** (what you created in Dashboard):
- ❌ Fixed merchant QR code
- ❌ Customer enters amount manually
- ❌ Not transaction-specific
- ❌ For physical stores/standees
- ❌ **Won't work for the app**

**Dynamic API QR Code** (what the app needs):
- ✅ Generated per transaction via API
- ✅ Amount pre-filled automatically
- ✅ Transaction-specific
- ✅ Generated when user clicks "Pay with GCash"
- ✅ **This is what we're using**

The app is already configured to generate **dynamic QR codes** via PayMongo Sources API. You don't need the static In-Store QR code for the app.

## ✅ What You Need to Do

### 1. Check PayMongo Dashboard

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Make sure you're in **Test Mode** (toggle in top-right)
3. Navigate to **Settings** → **Payment Methods**
4. Look for **QR PH** or **GCash QR** option
5. Make sure it's **enabled**

### 2. Verify Account Status

QR PH API requires:
- ✅ Account verification (in production)
- ✅ Business information completed
- ✅ QR PH feature enabled in account settings

**For Test Mode:**
- QR PH should work in test mode
- But you need to enable it in your account settings

### 3. Check API Response

The app now logs what PayMongo returns. Check your Firebase Functions logs:

```bash
firebase functions:log --only createPaymentSource
```

Look for:
- `hasQrData: true` → QR code is working ✅
- `hasQrData: false` → QR PH not enabled ❌

### 4. Contact PayMongo Support

If QR PH is not available in your account:

1. **Email:** support@paymongo.com
2. **Subject:** "Enable QR PH API for Test Account"
3. **Message:** Request to enable QR PH API for GCash payments

### 5. Alternative: Use Checkout API

If QR PH is not available, the app will automatically use Checkout API (the "Open Payment Page" button).

**To test Checkout API:**
1. Click "Pay with GCash"
2. You'll see "Open Payment Page" button
3. Click it to open PayMongo checkout page
4. Complete payment there

## 🔧 Current Fixes Applied

1. ✅ Fixed redirect URLs (now use PayMongo defaults)
2. ✅ Added logging to see what PayMongo returns
3. ✅ App automatically shows QR code OR checkout button based on what PayMongo returns

## 📝 Next Steps

1. **Deploy the updated function:**
   ```bash
   firebase deploy --only functions:createPaymentSource
   ```

2. **Test again:**
   - Try creating a payment
   - Check Firebase logs to see what PayMongo returns
   - If `hasQrData: false`, contact PayMongo support

3. **Check PayMongo Dashboard:**
   - Settings → Payment Methods
   - Enable QR PH if available

## 🆘 Still Not Working?

If you still don't see QR codes:

1. Check Firebase Functions logs for the actual PayMongo response
2. Verify your PayMongo account has QR PH enabled
3. Contact PayMongo support to enable QR PH API
4. The app will work with Checkout API as a fallback

