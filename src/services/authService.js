import { appConfig } from '../config/appConfig';

// Firebase imports are dynamic to avoid bundling when in mock mode
let firebaseAuth;
let firebaseOnAuthStateChanged;
let firebaseSignInWithEmailAndPassword;
let firebaseCreateUserWithEmailAndPassword;
let firebaseSignOut;
let firebaseUpdateProfile;
let firebaseGoogleAuthProvider;
let firebaseSignInWithPopup;
let firebaseSignInWithRedirect;
let firebaseGetRedirectResult;
let firebaseDb;
let firebaseDoc;
let firebaseGetDoc;
let firebaseSetDoc;

if (!appConfig.USE_MOCKS) {
  const { auth } = require('../config/firebase');
  const { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
  } = require('firebase/auth');
  const { db } = require('../config/firebase');
  const { doc, getDoc, setDoc } = require('firebase/firestore');
  firebaseAuth = auth;
  firebaseOnAuthStateChanged = onAuthStateChanged;
  firebaseSignInWithEmailAndPassword = signInWithEmailAndPassword;
  firebaseCreateUserWithEmailAndPassword = createUserWithEmailAndPassword;
  firebaseSignOut = signOut;
  firebaseUpdateProfile = updateProfile;
  firebaseGoogleAuthProvider = GoogleAuthProvider;
  firebaseSignInWithPopup = signInWithPopup;
  firebaseSignInWithRedirect = signInWithRedirect;
  firebaseGetRedirectResult = getRedirectResult;
  firebaseDb = db;
  firebaseDoc = doc;
  firebaseGetDoc = getDoc;
  firebaseSetDoc = setDoc;
}

const mockUser = {
  uid: 'mock-user-123',
  email: 'mock@user.local'
};

let mockRole = 'customer';

export const authService = {
  onAuthStateChange: (callback) => {
    if (appConfig.USE_MOCKS) {
      // Immediately emit a mock user
      setTimeout(() => callback(mockUser), 0);
      return () => {};
    }
    // Check if auth is initialized before using it
    if (!firebaseAuth) {
      console.warn('Firebase Auth is not initialized. Auth state changes will not be tracked.');
      // Return a no-op unsubscribe function
      return () => {};
    }
    return firebaseOnAuthStateChanged(firebaseAuth, callback);
  },

  getUserRole: async (uid) => {
    if (appConfig.USE_MOCKS) {
      return mockRole;
    }
    const snap = await firebaseGetDoc(firebaseDoc(firebaseDb, 'users', uid));
    return snap.exists() ? snap.data().role : null;
  },

  signInWithEmail: async (email, password) => {
    if (appConfig.USE_MOCKS) {
      return mockUser;
    }
    const res = await firebaseSignInWithEmailAndPassword(firebaseAuth, email, password);
    return res.user;
  },

  registerWithEmail: async (email, password) => {
    if (appConfig.USE_MOCKS) {
      return mockUser;
    }
    const res = await firebaseCreateUserWithEmailAndPassword(firebaseAuth, email, password);
    return res.user;
  },

  signOut: async () => {
    if (appConfig.USE_MOCKS) {
      return true;
    }
    await firebaseSignOut(firebaseAuth);
    return true;
  },

  /**
   * Sign in with Google (popup method - works on web)
   */
  signInWithGoogle: async () => {
    if (appConfig.USE_MOCKS) {
      return mockUser;
    }
    try {
      const provider = new firebaseGoogleAuthProvider();
      const result = await firebaseSignInWithPopup(firebaseAuth, provider);
      const user = result.user;

      // Create or update user document in Firestore
      await firebaseSetDoc(
        firebaseDoc(firebaseDb, 'users', user.uid),
        {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'customer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sign in with Google (redirect method - better for mobile)
   */
  signInWithGoogleRedirect: async () => {
    if (appConfig.USE_MOCKS) {
      return mockUser;
    }
    try {
      const provider = new firebaseGoogleAuthProvider();
      await firebaseSignInWithRedirect(firebaseAuth, provider);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Handle Google Sign-In redirect result
   */
  getGoogleRedirectResult: async () => {
    if (appConfig.USE_MOCKS) {
      return { user: mockUser };
    }
    try {
      const result = await firebaseGetRedirectResult(firebaseAuth);
      if (result && result.user) {
        const user = result.user;
        
        // Create or update user document in Firestore
        await firebaseSetDoc(
          firebaseDoc(firebaseDb, 'users', user.uid),
          {
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            role: 'customer',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );

        return { user };
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Register a new user with additional data
   */
  registerWithEmailAndPassword: async (email, password, userData = {}) => {
    if (appConfig.USE_MOCKS) {
      return mockUser;
    }
    try {
      const userCredential = await firebaseCreateUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;

      // Update profile if displayName provided
      if (userData.displayName) {
        await firebaseUpdateProfile(user, { displayName: userData.displayName });
      }

      // Create user document in Firestore
      await firebaseSetDoc(
        firebaseDoc(firebaseDb, 'users', user.uid),
        {
          email: user.email,
          displayName: userData.displayName || '',
          role: userData.role || 'customer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...userData
        }
      );

      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: () => {
    if (appConfig.USE_MOCKS) {
      return mockUser;
    }
    return firebaseAuth?.currentUser || null;
  },

  /**
   * Get user data from Firestore
   */
  getUserData: async (userId) => {
    if (appConfig.USE_MOCKS) {
      return { role: mockRole, email: mockUser.email };
    }
    try {
      const userDoc = await firebaseGetDoc(firebaseDoc(firebaseDb, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // mock-only helper to switch roles at runtime (requires reload to reflect)
  __setMockRole: (role) => {
    if (appConfig.USE_MOCKS) {
      mockRole = role;
    }
  }
};

