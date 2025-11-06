# Firebase & PayMongo Integration Setup Guide

Complete step-by-step guide for setting up Firebase authentication, Firestore database, and secure PayMongo payment integration for ClickSilog.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Firebase SDK Installation](#firebase-sdk-installation)
4. [Firebase Configuration](#firebase-configuration)
5. [Authentication Setup](#authentication-setup)
6. [Firestore Database Setup](#firestore-database-setup)
7. [PayMongo Integration](#paymongo-integration)
8. [Security Best Practices](#security-best-practices)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- Firebase account (https://console.firebase.google.com/)
- PayMongo account (https://paymongo.com/)
- Git repository initialized

---

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `clicksilog` (or your preferred name)
4. Enable Google Analytics (optional but recommended)
5. Click **"Create project"** and wait for initialization

### Step 2: Enable Firebase Services

#### Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Enable **Email/Password** provider:
   - Click on **Email/Password**
   - Toggle **Enable** and **Save**
3. Enable **Google Sign-In** provider:
   - Click on **Google**
   - Toggle **Enable**
   - Enter a **Project support email** (usually your email)
   - Click **"Save"**

#### Configure Google Sign-In in Google Cloud Console

**Important:** After enabling Google Sign-In in Firebase, you need to configure it in Google Cloud Console.

**Quick Access Method (Recommended):**

1. **Go to Firebase Console:**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `clicksilog-9a095`
   - Click the **gear icon** (⚙️) → **Project Settings**
   - Scroll down and click **"Open in Google Cloud Console"** or **"Go to Cloud Console"**
   - This will automatically sign you in and take you to the correct project

2. **Or Access Directly:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - **Sign in** with the same Google account you used for Firebase
   - If prompted to sign in, enter your Google account credentials
   - At the top, click the **project dropdown** (shows "Select a project")
   - Select your project: `clicksilog-9a095` (or search for it)

3. **Navigate to OAuth Consent Screen:**
   - In the left sidebar, go to **APIs & Services** → **OAuth consent screen**
   - If you don't see it, make sure you're signed in and have selected the correct project
4. Configure the OAuth consent screen:
   - **User Type:** Choose "External" (unless you have a Google Workspace account)
   - Click **"Create"**
   - **App name:** Enter `ClickSilog` (or your app name)
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
   - Click **"Save and Continue"**
   - **Scopes:** Click **"Save and Continue"** (default scopes are fine)
   - **Test users:** (Optional) Add test users if testing in development mode
   - Click **"Save and Continue"**
   - Review and click **"Back to Dashboard"**

5. **Get OAuth 2.0 Client ID (Optional):**
   - Go to **APIs & Services** → **Credentials**
   - Find your **Web client** (auto-created by Firebase)
   - You'll see your **Client ID** and **Client Secret**
   - **Important:** 
     - **Client Secret:** NEVER commit this to Git or use it in client-side code (it's server-side only)
     - **Client ID:** You typically don't need this manually - Firebase handles OAuth automatically
     - These credentials are only needed if you're implementing custom OAuth flows outside Firebase

6. **Authorized domains (usually auto-configured):**
   - Firebase automatically adds your Firebase project domain
   - For production, ensure your custom domain is added if using one

**Note:** For Expo/React Native apps using Firebase Web SDK:
- **Firebase handles OAuth configuration automatically** - you don't need to manually use Client ID/Secret
- You can use `signInWithPopup` or `signInWithRedirect` from Firebase Auth
- The Client ID and Secret you see are managed by Firebase internally
- **Do NOT** put these credentials in your `.env` file or code - Firebase uses them automatically
- For native apps, you may need additional setup (see below)

#### Enable Firestore Database

1. Go to **Firestore Database** → **Create database**
2. **Select Edition:**
   - Choose **Standard edition** (unless you need MongoDB compatibility)
   - Standard edition supports documents up to 1 MiB (sufficient for most apps)
   - Enterprise edition is only needed for MongoDB compatibility or 4 MiB documents
3. **Database ID & Location:**
   - **Database ID:** Leave as `(default)` (unless you have a specific reason to change it)
   - **Location:** Choose based on where your users are:
     - **Philippines/Southeast Asia:** `asia-southeast1` (Singapore) - Recommended for ClickSilog
     - **East Asia:** `asia-east1` (Taiwan) or `asia-northeast1` (Tokyo)
     - **United States:** `us-central1` (Iowa) - Default
     - **Europe:** `eur3` (Belgium) or `europe-west1` (Belgium)
     - **⚠️ Important:** Location cannot be changed after creation - choose carefully!
4. Click **"Enable"** and wait for database creation

**Recommendation for ClickSilog:** Choose `asia-southeast1` (Singapore) for best performance with Filipino users.

#### Enable Cloud Functions (Optional but Recommended)

1. Go to **Functions** → **Get started**
2. Follow the setup instructions to enable Cloud Functions
3. Install Firebase CLI: `npm install -g firebase-tools`
4. Login: `firebase login`
5. Initialize: `firebase init functions`

---

## Firebase SDK Installation

### For Expo/React Native

```bash
npm install firebase
```

**Note:** For Expo, use the standard Firebase JS SDK. For bare React Native, you may need `@react-native-firebase/app`.

### Install Additional Dependencies

```bash
npm install @react-native-async-storage/async-storage
```

---

## Firebase Configuration

### Step 1: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **"Add app"** button (or the **Web** icon `</>`)
4. **Select Platform:**
   - ✅ **Choose "Web"** (the `</>` icon)
   - ❌ Do NOT select iOS, Android, Unity, or Flutter
   - **Why Web?** Expo/React Native uses the Firebase JavaScript SDK, which is the same SDK used for web apps. Even though your app runs on mobile devices, you use the Web configuration.
5. **In the "Add Firebase to your web app" dialog:**
   - Enter app nickname: `ClickSilog Web` (or any name you prefer)
   - **Leave "Also set up Firebase Hosting" unchecked** (not needed for Expo/React Native)
   - Click **"Register app"**
6. **Copy the Firebase configuration object** - You'll see a config object that looks like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
7. **Copy these values** - You'll need them for the next step

**Important:** For Expo/React Native apps, always select **Web** platform, even though your app runs on iOS/Android. This is correct because Expo uses the Firebase JavaScript SDK, not the native iOS/Android SDKs.

### Step 2: Update Firebase Config File

Update `src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
```

### Step 3: Environment Variables (Recommended)

Create `.env` file in project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
EXPO_PUBLIC_PAYMONGO_SECRET_KEY=sk_test_xxxxx
```

Install env package:

```bash
npm install dotenv
```

Update `src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

**Important:** Add `.env` to `.gitignore` to keep secrets safe!

---

## Authentication Setup

### Step 1: Update Auth Service

Create/update `src/services/authService.js`:

```javascript
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Register a new user
 */
export const registerUser = async (email, password, userData = {}) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    if (userData.displayName) {
      await updateProfile(user, { displayName: userData.displayName });
    }

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: userData.displayName || '',
      role: userData.role || 'customer',
      createdAt: new Date().toISOString(),
      ...userData
    });

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

/**
 * Sign in existing user
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

/**
 * Sign out current user
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { data: userDoc.data(), error: null };
    }
    return { data: null, error: 'User not found' };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Sign in with Google
 * Note: For Expo/React Native, you may need to use signInWithRedirect
 * or install @react-native-google-signin/google-signin for native flow
 */
export const signInWithGoogle = async () => {
  try {
    const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = require('firebase/auth');
    const provider = new GoogleAuthProvider();
    
    // For web/Expo web: use signInWithPopup
    // For React Native: you may need native Google Sign-In library
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user exists in Firestore, create if not
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || '',
        role: 'customer',
        createdAt: new Date().toISOString(),
        photoURL: user.photoURL || ''
      });
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};
```

### Step 2: Update AuthContext

Update `src/contexts/AuthContext.js` to use Firebase:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getUserData } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user data from Firestore
        const { data, error } = await getUserData(firebaseUser.uid);
        if (!error && data) {
          setUserData(data);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## Firestore Database Setup

### Step 1: Design Collections Structure

**Collections:**

1. **users** - User profiles
   ```
   userId: {
     email: string,
     displayName: string,
     role: 'customer' | 'cashier' | 'kitchen' | 'admin',
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

2. **orders** - Order records
   ```
   orderId: {
     userId: string,
     items: array,
     total: number,
     status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled',
     paymentMethod: 'cash' | 'gcash' | 'card',
     paymentStatus: 'pending' | 'paid' | 'failed',
     paymentIntentId: string, // PayMongo payment intent ID
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

3. **payments** - Payment records
   ```
   paymentId: {
     orderId: string,
     userId: string,
     amount: number,
     paymentMethod: string,
     paymentIntentId: string,
     status: 'pending' | 'succeeded' | 'failed',
     paymongoPaymentId: string,
     createdAt: timestamp
   }
   ```

4. **menu** - Menu items (already exists)
5. **add_ons** - Add-ons (already exists)
6. **menu_categories** - Categories (already exists)

### Step 2: Firestore Security Rules

Go to **Firestore Database** → **Rules** and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Orders: Users can create, read their own orders
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'cashier', 'kitchen']);
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'cashier', 'kitchen'];
    }

    // Payments: Users can read their own payments
    match /payments/{paymentId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Menu: Read-only for authenticated users, write for admin
    match /menu/{itemId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Add-ons: Same as menu
    match /add_ons/{addOnId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

Click **"Publish"** to save rules.

---

## PayMongo Integration

### Step 1: Register PayMongo Account

1. Go to [PayMongo](https://paymongo.com/)
2. Sign up for an account
3. Navigate to **Developers** → **API Keys** in the dashboard
4. You'll see two sets of keys:
   - **TEST API Keys** - Use these for development (`pk_test_...`, `sk_test_...`)
   - **LIVE API Keys** - Use these for production (`pk_live_...`, `sk_live_...`)

**⚠️ Security Warning:** 
- **Public Key** (`pk_test_` or `pk_live_`) - Safe to use in client-side code
- **Secret Key** (`sk_test_` or `sk_live_`) - NEVER expose in client-side code! Use only in Cloud Functions or backend

**Your PayMongo Keys:**
- **Test Public Key:** `pk_test_xxxxx`
- **Test Secret Key:** `sk_test_xxxxx` (Keep secret!)
- **Live Public Key:** `pk_live_xxxxx`
- **Live Secret Key:** `sk_live_xxxxx` (Keep secret!)

**Important:** 
- Use **TEST keys** during development
- Switch to **LIVE keys** for production
- Store secret keys securely (Cloud Functions config, not in `.env` file!)

### Step 2: Install PayMongo SDK

```bash
npm install axios
```

### Step 3: Update Payment Service

Update `src/services/paymentService.js`:

```javascript
import axios from 'axios';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_SECRET_KEY = process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY || 'sk_test_xxxxx';

/**
 * Create a payment intent
 */
export const createPaymentIntent = async ({ amount, currency = 'PHP', description }) => {
  try {
    const response = await axios.post(
      `${PAYMONGO_API_URL}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toUpperCase(),
            payment_method_allowed: ['card', 'gcash', 'paymaya'],
            description: description || 'ClickSilog Order'
          }
        }
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      paymentIntentId: response.data.data.id,
      clientKey: response.data.data.attributes.client_key,
      data: response.data.data
    };
  } catch (error) {
    console.error('Payment intent creation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.detail || error.message
    };
  }
};

/**
 * Retrieve payment intent status
 */
export const getPaymentIntent = async (paymentIntentId) => {
  try {
    const response = await axios.get(
      `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`
        }
      }
    );

    return {
      success: true,
      status: response.data.data.attributes.status,
      payment: response.data.data.attributes.payment,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.detail || error.message
    };
  }
};

/**
 * Record payment in Firestore
 */
export const recordPayment = async (paymentData) => {
  try {
    const paymentRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      createdAt: new Date().toISOString()
    });
    return { success: true, paymentId: paymentRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update order payment status
 */
export const updateOrderPaymentStatus = async (orderId, paymentStatus, paymentIntentId) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      paymentStatus,
      paymentIntentId,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Step 4: Configure Environment Variables

Update your `.env` file with your PayMongo keys:

```env
# PayMongo Configuration - TEST keys (for development)
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
EXPO_PUBLIC_PAYMONGO_SECRET_KEY=sk_test_xxxxx
```

**⚠️ Important for Production:**
- Remove `EXPO_PUBLIC_PAYMONGO_SECRET_KEY` from `.env` in production
- Configure secret key in Cloud Functions instead:
  ```bash
  firebase functions:config:set paymongo.secret_key="sk_live_xxxxx"
  ```

### Step 5: Configure Cloud Functions for Secure Payment Processing

**Install dependencies in functions directory:**

```bash
cd functions
npm install axios
```

**Configure PayMongo secret key in Cloud Functions:**

⚠️ **Important:** The `functions.config()` API is deprecated and will be removed in March 2026. Use one of these methods:

**Option 1: Environment Variables (Recommended for now)**

For local development, create a `.env` file in the `functions` directory:
```bash
# functions/.env
PAYMONGO_SECRET_KEY=sk_test_xxxxx
```

For production deployment, set environment variables in Firebase Console:
1. Go to Firebase Console → Functions → Configuration
2. Add environment variable: `PAYMONGO_SECRET_KEY` = `sk_live_xxxxx`

**Option 2: Google Cloud Secret Manager (Recommended for production)**

1. Create secret:
   ```bash
   echo -n "sk_live_xxxxx" | gcloud secrets create paymongo-secret-key --data-file=-
   ```

2. Grant access to Cloud Functions service account:
   ```bash
   gcloud secrets add-iam-policy-binding paymongo-secret-key \
     --member="serviceAccount:clicksilog-9a095@appspot.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

3. Update `functions/index.js` to uncomment the Secret Manager code (lines 35-46)

**Option 3: Legacy Config (Deprecated, works until March 2026)**

```bash
firebase functions:config:set paymongo.secret_key="sk_test_xxxxx"
```

**Note:** The code supports all three methods for backward compatibility, but environment variables are recommended.

### Step 6: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

After deployment, you'll get URLs like:
- `https://us-central1-clicksilog-9a095.cloudfunctions.net/createPaymentIntent`
- `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`

### Step 7: Configure PayMongo Webhook

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/) → **Developers** → **Webhooks**
2. Click **"Add Webhook"**
3. Enter webhook URL: `https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook`
4. Select events:
   - ✅ `payment.succeeded`
   - ✅ `payment.failed`
   - ✅ `payment.pending`
5. Click **"Save"**

**Note:** Replace `us-central1` with your Cloud Functions region if different.

### Step 8: Payment Flow Integration

**Recommended:** Use Cloud Functions for secure payment processing:

```javascript
// In orderService.js or PaymentScreen.js
import { createPaymentIntentViaFunction, getPaymentIntent } from '../services/paymentService';
import { firestoreService } from '../services/firestoreService';

const handlePayment = async (orderData, paymentMethod) => {
  try {
    // Create payment intent via Cloud Function (SECURE)
    const paymentIntent = await createPaymentIntentViaFunction({
      amount: orderData.total,
      description: `Order #${orderData.id}`,
      orderId: orderData.id
    });

    if (!paymentIntent.success) {
      throw new Error(paymentIntent.error);
    }

    // Record payment in Firestore
    await firestoreService.addDocument('payments', {
      orderId: orderData.id,
      userId: orderData.userId,
      amount: orderData.total,
      paymentMethod,
      paymentIntentId: paymentIntent.paymentIntentId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // Update order with payment intent
    await firestoreService.updateDocument('orders', orderData.id, {
      paymentStatus: 'pending',
      paymentIntentId: paymentIntent.paymentIntentId,
      updatedAt: new Date().toISOString()
    });

    // Return payment intent for client-side payment processing
    return {
      success: true,
      paymentIntentId: paymentIntent.paymentIntentId,
      clientKey: paymentIntent.clientKey
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

---

## Security Best Practices

### 1. Never Trust Client-Side Payment Confirmation

**CRITICAL:** Always verify payment status server-side using:

- **PayMongo Webhooks** (recommended)
- **Firebase Cloud Functions** to verify payment status
- **Server-side verification** before marking order as paid

### 2. Implement PayMongo Webhook Handler

Create Cloud Function to handle webhooks:

```javascript
// cloud-functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

exports.handlePayMongoWebhook = functions.https.onRequest(async (req, res) => {
  // Verify webhook signature (recommended)
  const signature = req.headers['paymongo-signature'];
  
  // Parse webhook event
  const event = req.body.data;
  
  if (event.type === 'payment.succeeded') {
    const paymentIntentId = event.attributes.payment_intent_id;
    
    // Update order status in Firestore
    const ordersRef = admin.firestore().collection('orders');
    const orderSnapshot = await ordersRef
      .where('paymentIntentId', '==', paymentIntentId)
      .get();
    
    if (!orderSnapshot.empty) {
      const orderDoc = orderSnapshot.docs[0];
      await orderDoc.ref.update({
        paymentStatus: 'paid',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
  
  res.status(200).send('OK');
});
```

### 3. Secure API Keys

- **Never** commit API keys to Git
- Use environment variables (`.env` file)
- Add `.env` to `.gitignore`
- Use Firebase Functions environment config for production:
  ```bash
  firebase functions:config:set paymongo.secret_key="sk_live_xxxxx"
  ```

### 4. Validate All Inputs

```javascript
// Example validation
const validateOrderData = (orderData) => {
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new Error('Order must have at least one item');
  }
  if (!orderData.total || orderData.total <= 0) {
    throw new Error('Invalid order total');
  }
  return true;
};
```

### 5. Implement Audit Logs

```javascript
// Log all payment and order status changes
const logAuditEvent = async (eventType, data) => {
  await addDoc(collection(db, 'audit_logs'), {
    eventType,
    data,
    userId: auth.currentUser?.uid,
    timestamp: new Date().toISOString()
  });
};
```

---

## Testing

### Step 1: Test Authentication

```javascript
// Test register
const { user, error } = await registerUser('test@example.com', 'password123', {
  displayName: 'Test User',
  role: 'customer'
});

// Test login
const { user, error } = await loginUser('test@example.com', 'password123');

// Test logout
await logoutUser();
```

### Step 2: Test Payment Flow

1. Create a test order
2. Create payment intent
3. Complete payment in PayMongo test mode
4. Verify payment status update in Firestore
5. Verify order status update

### Step 3: Use Firebase Emulator Suite (Optional)

```bash
# Install emulator
npm install -g firebase-tools

# Start emulators
firebase emulators:start
```

---

## Deployment

### Step 1: Update to Production Keys

1. Switch PayMongo to **Live Mode**
2. Get live API keys
3. Update environment variables
4. Update Firebase config if needed

### Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Step 3: Deploy Cloud Functions (if using)

```bash
firebase deploy --only functions
```

### Step 4: Configure PayMongo Webhook

1. In PayMongo dashboard, go to **Webhooks**
2. Add webhook URL: `https://your-region-your-project.cloudfunctions.net/handlePayMongoWebhook`
3. Select events: `payment.succeeded`, `payment.failed`
4. Save webhook

---

## Troubleshooting

### Firebase Authentication Errors

- **Error: "auth/network-request-failed"**
  - Check internet connection
  - Verify Firebase config is correct
  - Check if Firebase project is active

- **Error: "auth/email-already-in-use"**
  - Email already registered
  - Use login instead or handle error gracefully

### Google Sign-In Errors

- **Error: "auth/popup-blocked"**
  - Browser blocked the popup
  - Use `signInWithRedirect` instead of `signInWithPopup`
  - Check browser popup settings

- **Error: "auth/operation-not-allowed"**
  - Google Sign-In not enabled in Firebase Console
  - Go to Firebase Console → Authentication → Sign-in method → Enable Google

- **Error: "OAuth consent screen" or "redirect_uri_mismatch"**
  - Go to Google Cloud Console → APIs & Services → Credentials
  - Check authorized redirect URIs include your app's domain
  - For Expo: Add `https://auth.expo.io` and your custom domain
  - Verify OAuth consent screen is configured (see Google Sign-In setup section)

- **Error: "Access blocked: This app's request is invalid"**
  - OAuth consent screen not configured properly
  - Complete the OAuth consent screen setup in Google Cloud Console
  - App might be in "Testing" mode - add test users or publish the app

### Firestore Permission Errors

- **Error: "Missing or insufficient permissions"**
  - Check Firestore security rules
  - Verify user is authenticated
  - Check user role permissions

### PayMongo Payment Errors

- **Error: "Invalid API key"**
  - Verify API keys are correct
  - Check if using test keys in test mode
  - Verify key format (pk_test_xxx or sk_test_xxx)

- **Error: "Payment intent not found"**
  - Verify payment intent ID
  - Check if payment intent was created successfully

### Common Issues

1. **Environment variables not loading**
   - Ensure `.env` file exists
   - Restart Expo/Metro bundler
   - Verify variable names start with `EXPO_PUBLIC_`

2. **Firestore rules blocking access**
   - Test rules in Firebase Console Rules Playground
   - Verify user authentication status
   - Check user role in Firestore

3. **Payment webhook not triggering**
   - Verify webhook URL is accessible
   - Check webhook configuration in PayMongo dashboard
   - Verify Cloud Function is deployed

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [PayMongo API Documentation](https://developers.paymongo.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)

---

## Checklist

- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Security rules configured
- [ ] Firebase SDK installed and configured
- [ ] PayMongo account created
- [ ] PayMongo API keys obtained
- [ ] Payment service implemented
- [ ] Payment webhook configured (if using)
- [ ] Environment variables set
- [ ] Testing completed
- [ ] Production keys configured
- [ ] Security rules tested
- [ ] Audit logs implemented

---

**Last Updated:** 2025-01-05

**Note:** Always test thoroughly in sandbox/test mode before deploying to production!

