# Dual Payment Method Setup - Checkout API & QR PH API

## Overview

This guide shows how to set up both **Checkout API** and **QR PH API** for GCash payments.

## Current Implementation

- ✅ **QR PH API** - Already implemented via `createPaymentSource`
- ✅ **Checkout API** - Already implemented via `createCheckoutSession`

## How to Use Both Methods

### Option 1: Update createPaymentSource to Support Both

Modify `createPaymentSource` to accept a `paymentType` parameter:

```javascript
// In createPaymentSource function
const {amount, currency, description, orderId, tableNumber, redirectUrl, paymentType = "qrph"} = req.body;

if (paymentType === "checkout") {
  // Use Checkout API
  // Create checkout session
} else {
  // Use QR PH API (default)
  // Create source with QR code
}
```

### Option 2: Use Separate Functions (Current Setup)

- **QR PH API:** Call `createPaymentSource` (current implementation)
- **Checkout API:** Call `createCheckoutSession` (already exists)

## Client-Side Implementation

### Update Payment Service

Add a function to create checkout session:

```javascript
// In src/services/paymentService.js
export const createCheckoutSessionViaFunction = async ({ amount, currency = 'PHP', description, orderId, redirectUrl }) => {
  // Call createCheckoutSession Cloud Function
  const region = appConfig.firebase.region || 'us-central1';
  const functionsUrl = `https://${region}-${appConfig.firebase.projectId}.cloudfunctions.net/createCheckoutSession`;
  
  const response = await axios.post(functionsUrl, {
    amount,
    currency,
    description,
    orderId,
    redirectUrl
  });
  
  return response.data;
};
```

### Update Payment Screen

Add UI to choose between methods:

```javascript
// In PaymentScreen.js
const [gcashMethod, setGcashMethod] = useState('qrph'); // 'qrph' or 'checkout'

// Add UI option
<View style={styles.gcashMethodRow}>
  <Text>GCash Payment Method:</Text>
  <MethodChip 
    label="QR Code (Scan)" 
    selected={gcashMethod === 'qrph'} 
    onPress={() => setGcashMethod('qrph')} 
  />
  <MethodChip 
    label="Checkout Page" 
    selected={gcashMethod === 'checkout'} 
    onPress={() => setGcashMethod('checkout')} 
  />
</View>

// Update processGCashPayment
const paymentResult = gcashMethod === 'checkout' 
  ? await paymentService.createCheckoutSessionViaFunction({...})
  : await paymentService.processPayment({...});
```

## Quick Setup Steps

### 1. Update Payment Service

Add checkout session function to `src/services/paymentService.js`

### 2. Update Payment Screen

Add UI option to choose between QR PH and Checkout

### 3. Update Payment Flow

Handle both methods in `processGCashPayment`

### 4. Test Both Methods

- Test QR PH: Should show QR code
- Test Checkout: Should open PayMongo checkout page

## Differences

| Feature | QR PH API | Checkout API |
|---------|-----------|--------------|
| **User Experience** | Scan QR code in GCash app | Open PayMongo-hosted page |
| **Best For** | On-device "scan to pay" | Webview or redirect flow |
| **Implementation** | `createPaymentSource` | `createCheckoutSession` |
| **Response** | QR code data | Checkout URL |

## Recommendation

- **Mobile App:** Use **QR PH API** (better UX for mobile)
- **Web App:** Use **Checkout API** (better for web browsers)
- **Both:** Let users choose their preferred method

