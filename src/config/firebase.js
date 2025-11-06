import { appConfig } from './appConfig';
// Import AsyncStorage using static import (works better with React Native/Expo)
import AsyncStorageModule from '@react-native-async-storage/async-storage';

// Get AsyncStorage - handle both default export and named export cases
const AsyncStorage = AsyncStorageModule?.default || AsyncStorageModule;

// Export nulls in mock mode - Firebase won't be initialized at all
export let auth = null;
export let db = null;
export let storage = null;
export let app = null;

if (!appConfig.USE_MOCKS) {
  // Only initialize Firebase when NOT in mock mode
  try {
    // Import Firebase modules using require (dynamic import for mock mode support)
    const { initializeApp, getApps } = require('firebase/app');
    const { initializeAuth, getAuth, getReactNativePersistence } = require('firebase/auth');
    const { getFirestore } = require('firebase/firestore');
    const { getStorage } = require('firebase/storage');

    const firebaseConfig = {
      apiKey: appConfig.firebase.apiKey,
      authDomain: appConfig.firebase.authDomain,
      projectId: appConfig.firebase.projectId,
      storageBucket: appConfig.firebase.storageBucket,
      messagingSenderId: appConfig.firebase.messagingSenderId,
      appId: appConfig.firebase.appId,
      measurementId: appConfig.firebase.measurementId
    };

    // Check if app is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }

    // Initialize Auth with AsyncStorage persistence for React Native
    // IMPORTANT: For React Native/Expo, we should use initializeAuth with AsyncStorage
    // However, in Expo Go, "Component auth has not been registered" error can occur
    // We handle this gracefully by falling back to getAuth
    
    // Strategy: Try initializeAuth first (for production builds), fallback to getAuth (for Expo Go)
    try {
      // Verify AsyncStorage is available and valid
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        // Use initializeAuth with AsyncStorage persistence - this is REQUIRED for React Native
        // MUST be called BEFORE getAuth to avoid "Component auth has not been registered" error
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } else {
        // AsyncStorage not available - use getAuth (will show warning)
        console.warn('AsyncStorage not available. Using getAuth (auth state will not persist).');
        auth = getAuth(app);
      }
    } catch (initError) {
      // Handle errors during initialization
      const errorMessage = initError.message || String(initError);
      const errorCode = initError.code;
      
      if (errorCode === 'auth/already-initialized' || errorMessage.includes('already initialized')) {
        // Auth already initialized - get existing instance
        auth = getAuth(app);
      } else if (errorMessage.includes('Component auth has not been registered')) {
        // This error occurs in Expo Go - Firebase Auth component is not available
        // In Expo Go, Firebase Auth doesn't work - we need to accept null auth
        console.warn('Firebase Auth not available in Expo Go. App will use mock mode for auth.');
        auth = null;
        // Don't try getAuth - it will also fail with the same error
      } else {
        // Other error - log and use getAuth as fallback
        console.warn('initializeAuth failed, using getAuth as fallback:', errorMessage);
        auth = getAuth(app);
      }
    }

    // Note: auth might be null in Expo Go (Firebase Auth not available)
    // This is OK - services will use mock mode when auth is null
    if (!auth) {
      console.warn('Firebase Auth is null. App will use mock mode for authentication.');
    }

    // Initialize other Firebase services (may fail in Expo Go, but that's OK)
    try {
      db = getFirestore(app);
    } catch (dbError) {
      console.warn('Firestore initialization failed:', dbError.message);
      db = null;
    }
    
    try {
      storage = getStorage(app);
    } catch (storageError) {
      console.warn('Firebase Storage initialization failed:', storageError.message);
      storage = null;
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    // In Expo Go, Firebase Auth might not be available at all
    // Gracefully handle this - auth will be null, but app can still work with mocks
    if (error.message && error.message.includes('Component auth has not been registered')) {
      console.warn('Firebase Auth not available in Expo Go. App will use mock mode for auth.');
      // Leave auth as null - services will use mocks
      auth = null;
    } else {
      // Try to initialize auth anyway as a last resort (only if not Expo Go error)
      try {
        const { getAuth } = require('firebase/auth');
        if (app) {
          auth = getAuth(app);
        }
      } catch (e) {
        // If getAuth also fails, it's likely Expo Go - just accept auth as null
        if (e.message && e.message.includes('Component auth has not been registered')) {
          console.warn('Firebase Auth not available. App will use mock mode for auth.');
          auth = null;
        } else {
          console.error('Failed to initialize auth even as fallback:', e);
        }
      }
    }
    // Keep other exports as null if initialization failed
  }
}

export default app;


