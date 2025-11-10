# PayMongo Settings Check - Where to Enable QR PH

## 🔍 Where to Check for QR PH API

Based on your PayMongo Dashboard screenshots, here's where to look:

### ✅ What You DON'T Need to Do:

1. **❌ Don't create Pages** (Payment Channels → Pages)
   - This is for manual hosted checkout pages
   - Your app uses API to generate checkout sessions automatically
   - Not needed for your app

2. **❌ Don't create Links** (Payment Channels → Links)
   - This is for manual one-time payment links
   - Your app uses API to generate payment sources automatically
   - Not needed for your app

3. **❌ Don't use In-Store QR Ph** (Payment Channels → In-store QR Ph)
   - This is for static merchant QR codes
   - Your app needs dynamic QR codes generated via API
   - Not what you need

### ✅ What You NEED to Check:

1. **Go to Settings → Payment Methods**
   - Look for "QR PH" or "GCash QR" option
   - Make sure it's **enabled**
   - This enables the QR PH API for your account

2. **Alternative: Check Developers → API**
   - Some accounts have QR PH settings here
   - Look for "Payment Methods" or "QR PH" section

3. **Contact PayMongo Support**
   - If you can't find QR PH settings
   - Email: support@paymongo.com
   - Subject: "Enable QR PH API for Test Account"
   - Request: Enable QR PH API for generating dynamic QR codes via API

## 🎯 What Your App Does:

Your app is already configured to:
- ✅ Use PayMongo API to generate dynamic QR codes automatically
- ✅ Create payment sources per transaction via API
- ✅ Handle webhooks for payment confirmation
- ✅ Show QR code OR checkout button based on what PayMongo returns

**You don't need to manually create anything in the dashboard!**

## 📝 Next Steps:

1. **Check Settings → Payment Methods** for QR PH option
2. **Deploy the updated function** (if not already done):
   ```bash
   firebase deploy --only functions:createPaymentSource
   ```
3. **Test a payment** and check Firebase logs:
   ```bash
   firebase functions:log --only createPaymentSource
   ```
4. **Look for `hasQrData: true`** in the logs
   - If `true` → QR codes are working! ✅
   - If `false` → QR PH API not enabled, contact PayMongo support

## 🆘 If QR PH Isn't Available:

The app will automatically use **Checkout API** as a fallback:
- Shows "Open Payment Page" button
- Opens PayMongo checkout page
- User completes payment there
- Webhook confirms payment

This works fine, but QR codes are better for mobile apps!

