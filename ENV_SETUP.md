# Environment Setup Guide

## Why Use Environment Variables?

**Problem:** Hardcoded Firebase configuration prevents the app from running on other computers because:
- Each developer needs their own Firebase project
- Sensitive keys shouldn't be committed to Git
- Different environments (dev/staging/prod) need different configs

**Solution:** Use environment variables so each developer can configure their own Firebase project.

## Setup Instructions

### Step 1: Create Your `.env` File

1. Copy the template below and create a `.env` file in the project root:

```env
# Firebase Configuration
# Get these values from Firebase Console > Project Settings > Your apps > Web app config
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# PayMongo Configuration
# Get these from PayMongo Dashboard > Settings > API Keys
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
EXPO_PUBLIC_PAYMONGO_SECRET_KEY=sk_test_xxxxx

# Mock Mode (set to 'true' to disable Firebase, 'false' to enable)
EXPO_PUBLIC_USE_MOCKS=false
```

### Step 2: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project Settings** (gear icon)
4. Scroll to **Your apps** section
5. Click **Add app** → Select **Web** platform
6. Copy the configuration values to your `.env` file

### Step 3: Get Your PayMongo Keys (Optional)

1. Go to [PayMongo Dashboard](https://paymongo.com/)
2. Navigate to **Settings** → **API Keys**
3. Copy your test keys to your `.env` file

### Step 4: Restart Expo

After creating/updating your `.env` file:

```bash
# Stop your current Expo server (Ctrl+C)
# Then restart it
npm start
```

**Important:** Expo only reads environment variables at startup, so you must restart after changing `.env`.

## How It Works

- The app uses environment variables from `.env` if available
- Falls back to hardcoded values in `appConfig.js` if env vars are not set
- This allows the app to work both with and without `.env` file

## For Team Members

When cloning the repository:

1. **Don't commit your `.env` file** - It's already in `.gitignore`
2. Create your own `.env` file with your Firebase project credentials
3. Use the template above and fill in your own values

## Troubleshooting

### Environment variables not loading?

- Make sure variable names start with `EXPO_PUBLIC_`
- Restart Expo server after changing `.env`
- Check that `.env` file is in the project root (same level as `package.json`)

### Still using hardcoded values?

- Check that `USE_MOCKS` is set to `false` in your `.env`
- Verify environment variables are spelled correctly
- Check console logs for any Firebase initialization errors

