/**
 * Payment Security Utilities
 * Handles rate limiting, attempt tracking, and secure password verification
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ATTEMPT_STORAGE_KEY = 'payment_password_attempts';
const LOCKOUT_STORAGE_KEY = 'payment_password_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Get attempt counter from storage
 */
export const getAttemptCounter = async () => {
  try {
    const attempts = await AsyncStorage.getItem(ATTEMPT_STORAGE_KEY);
    if (attempts) {
      const data = JSON.parse(attempts);
      // Check if attempts have expired (reset after 1 hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (data.timestamp < oneHourAgo) {
        await resetAttemptCounter();
        return { count: 0, timestamp: Date.now() };
      }
      return data;
    }
    return { count: 0, timestamp: Date.now() };
  } catch (error) {
    console.warn('Error getting attempt counter:', error);
    return { count: 0, timestamp: Date.now() };
  }
};

/**
 * Increment attempt counter
 */
export const incrementAttemptCounter = async () => {
  try {
    const current = await getAttemptCounter();
    const newCount = current.count + 1;
    const data = {
      count: newCount,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(data));
    return newCount;
  } catch (error) {
    console.warn('Error incrementing attempt counter:', error);
    return 0;
  }
};

/**
 * Reset attempt counter
 */
export const resetAttemptCounter = async () => {
  try {
    await AsyncStorage.removeItem(ATTEMPT_STORAGE_KEY);
  } catch (error) {
    console.warn('Error resetting attempt counter:', error);
  }
};

/**
 * Check if account is locked out
 */
export const isLockedOut = async () => {
  try {
    const lockoutData = await AsyncStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (lockoutData) {
      const data = JSON.parse(lockoutData);
      const lockoutUntil = data.lockoutUntil;
      
      if (Date.now() < lockoutUntil) {
        const remainingMinutes = Math.ceil((lockoutUntil - Date.now()) / (60 * 1000));
        return {
          locked: true,
          remainingMinutes,
        };
      } else {
        // Lockout expired, clear it
        await AsyncStorage.removeItem(LOCKOUT_STORAGE_KEY);
        await resetAttemptCounter();
        return { locked: false };
      }
    }
    return { locked: false };
  } catch (error) {
    console.warn('Error checking lockout:', error);
    return { locked: false };
  }
};

/**
 * Set lockout
 */
export const setLockout = async (duration = LOCKOUT_DURATION) => {
  try {
    const lockoutUntil = Date.now() + duration;
    const data = {
      lockoutUntil,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Error setting lockout:', error);
  }
};

/**
 * Check if maximum attempts reached
 */
export const checkMaxAttempts = async () => {
  const attempts = await getAttemptCounter();
  if (attempts.count >= MAX_ATTEMPTS) {
    const lockout = await isLockedOut();
    if (!lockout.locked) {
      // Set lockout
      await setLockout();
      return {
        maxAttemptsReached: true,
        locked: true,
        remainingMinutes: Math.ceil(LOCKOUT_DURATION / (60 * 1000)),
      };
    }
    return {
      maxAttemptsReached: true,
      locked: true,
      remainingMinutes: lockout.remainingMinutes,
    };
  }
  return {
    maxAttemptsReached: false,
    remainingAttempts: MAX_ATTEMPTS - attempts.count,
  };
};

/**
 * Log security event (without password)
 */
export const logSecurityEvent = async (event, metadata = {}) => {
  try {
    // In production, send to backend logging service
    // For now, log to console (without password)
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ...metadata,
      // Never include password in logs
    };
    
    if (__DEV__) {
      console.log('Security Event:', logData);
    }
    
    // In production, send to backend:
    // await fetch('/api/security/log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logData),
    // });
  } catch (error) {
    console.warn('Error logging security event:', error);
  }
};

export default {
  getAttemptCounter,
  incrementAttemptCounter,
  resetAttemptCounter,
  isLockedOut,
  setLockout,
  checkMaxAttempts,
  logSecurityEvent,
  MAX_ATTEMPTS,
  LOCKOUT_DURATION,
};

