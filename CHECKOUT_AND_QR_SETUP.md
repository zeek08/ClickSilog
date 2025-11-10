# PayMongo Checkout API & QR PH API Setup Guide

## Overview

You can use **both** Checkout API and QR PH API for GCash payments:

1. **QR PH API** (Current) - Generates QR code that users scan in GCash app
2. **Checkout API** (New) - Creates PayMongo-hosted page where users finish payment

## Implementation Plan

### Step 1: Add Checkout Session Function to Cloud Functions

Add a new function `createCheckoutSession` that creates PayMongo Checkout Sessions.

### Step 2: Update Payment Service

Add a function to create checkout sessions from the client app.

### Step 3: Update Payment Screen UI

Add option to choose between:
- **QR Scan** (QR PH API) - "Scan QR code"
- **Checkout Page** (Checkout API) - "Open checkout page"

### Step 4: Update Webhook Handler

Handle both `checkout_session.payment.paid` and `payment.paid` events.

## Current Status

✅ **QR PH API** - Already implemented
- Function: `createPaymentSource`
- Creates QR code for scanning

❌ **Checkout API** - Needs implementation
- Function: `createCheckoutSession` - Need to add
- Creates hosted checkout page

## Next Steps

1. **Restore functions/index.js** (file was corrupted)
2. **Add Checkout Session function**
3. **Update payment service**
4. **Update UI to support both options**

