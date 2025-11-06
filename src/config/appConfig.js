// For Expo, environment variables must be prefixed with EXPO_PUBLIC_
// Access via process.env.EXPO_PUBLIC_*
// Fallback to hardcoded values if env vars are not set (for development)

export const appConfig = {
  // Set to 'true' to disable Firebase and use mocks, 'false' to enable Firebase
  // Defaults to false (Firebase enabled) if env var not set
  USE_MOCKS: process.env.EXPO_PUBLIC_USE_MOCKS === 'true',
  
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDocFfiBivKUeUYuoUF5an6TcUO7nWgebU',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'clicksilog-9a095.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'clicksilog-9a095',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'clicksilog-9a095.firebasestorage.app',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '124998545103',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:124998545103:web:7ed9728dea16aff1a611ba',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-TDKRT5Y79G' // Optional: for analytics
  },
  
  paymongo: {
    publicKey: process.env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY || '',
    secretKey: process.env.EXPO_PUBLIC_PAYMONGO_SECRET_KEY || ''
  }
};

