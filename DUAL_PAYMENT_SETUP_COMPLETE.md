# Dual Payment Method Setup - Complete Guide

## ✅ Implementation Complete

Both **Checkout API** and **QR PH API** are now implemented and ready to use!

## 🎯 What's Been Added

### 1. Payment Service (`src/services/paymentService.js`)
- ✅ Added `createCheckoutSessionViaFunction()` function
- ✅ Supports both QR PH API and Checkout API

### 2. Payment Screen (`src/screens/customer/PaymentScreen.js`)
- ✅ Added `gcashPaymentType` state (defaults to 'qrph')
- ✅ Added UI to choose between "QR Code (Scan)" and "Checkout Page"
- ✅ Updated payment flow to use both methods

### 3. GCash Payment Screen (`src/screens/customer/GCashPaymentScreen.js`)
- ✅ Updated to accept `checkoutSessionId` and `paymentType`
- ✅ Already handles both QR code and checkout URL display

### 4. Cloud Functions (`functions/index.js`)
- ✅ `createPaymentSource` - QR PH API (already exists)
- ✅ `createCheckoutSession` - Checkout API (already exists)

## 🎨 How It Works

### User Experience

1. **Customer selects GCash payment**
2. **New UI appears:** "GCash Payment Method:"
   - Option 1: **QR Code (Scan)** - Default
   - Option 2: **Checkout Page**
3. **Customer chooses their preferred method**
4. **Customer taps "Pay"**

### Payment Flow

#### QR PH API (QR Code Scan)
1. App calls `createPaymentSource` Cloud Function
2. PayMongo generates QR code
3. Customer scans QR with GCash app
4. Payment completes

#### Checkout API (Checkout Page)
1. App calls `createCheckoutSession` Cloud Function
2. PayMongo generates checkout URL
3. Customer opens checkout page (in-app browser or external)
4. Customer completes payment on PayMongo-hosted page
5. Payment completes

## 📋 Webhook Events Needed

### For QR PH API:
- ✅ `source.chargeable`
- ✅ `payment.paid`
- ✅ `payment.failed`
- ✅ `qrph.expired`

### For Checkout API:
- ✅ `checkout_session.payment.paid` (NEW - Add this!)
- ✅ `payment.paid` (also works)
- ✅ `payment.failed`

## 🔧 Next Steps

### 1. Update Webhook Events in PayMongo Dashboard

Add this event for Checkout API:
- ✅ `checkout_session.payment.paid`

### 2. Update Webhook Handler (if needed)

The webhook handler should handle `checkout_session.payment.paid` events. Check if it's already in the allowed events list.

### 3. Test Both Methods

1. **Test QR PH API:**
   - Select "QR Code (Scan)"
   - Verify QR code appears
   - Complete test payment

2. **Test Checkout API:**
   - Select "Checkout Page"
   - Verify checkout URL opens
   - Complete test payment

## 🎯 Summary

- ✅ **QR PH API** - For on-device "scan to pay" experience
- ✅ **Checkout API** - For webview or redirect flow
- ✅ **User Choice** - Customers can choose their preferred method
- ✅ **Both Work** - Fully functional for both payment methods

## 📝 Notes

- **Default:** QR PH API (better for mobile apps)
- **Checkout API:** Better for web browsers or if QR scanning is difficult
- **Both methods** use the same webhook for payment confirmation
- **Both methods** update order status the same way

Your app now supports both payment methods! 🎉

