import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const KeyboardAvoidanceContext = createContext(null);

/**
 * Provider for tracking which screens already have keyboard avoidance
 * Prevents nested KeyboardAvoidingView wrappers
 */
export const KeyboardAvoidanceProvider = ({ children }) => {
  const wrappedScreens = useRef(new Set());
  const [avoidanceMap, setAvoidanceMap] = useState({});

  const registerScreen = useCallback((screenName, hasAvoidance) => {
    if (hasAvoidance) {
      wrappedScreens.current.add(screenName);
      setAvoidanceMap((prev) => ({
        ...prev,
        [screenName]: true,
      }));
    } else {
      wrappedScreens.current.delete(screenName);
      setAvoidanceMap((prev) => {
        const next = { ...prev };
        delete next[screenName];
        return next;
      });
    }
  }, []);

  const isScreenWrapped = useCallback((screenName) => {
    return wrappedScreens.current.has(screenName);
  }, []);

  const unregisterScreen = useCallback((screenName) => {
    wrappedScreens.current.delete(screenName);
    setAvoidanceMap((prev) => {
      const next = { ...prev };
      delete next[screenName];
      return next;
    });
  }, []);

  const value = {
    registerScreen,
    isScreenWrapped,
    unregisterScreen,
    avoidanceMap,
  };

  return (
    <KeyboardAvoidanceContext.Provider value={value}>
      {children}
    </KeyboardAvoidanceContext.Provider>
  );
};

export const useKeyboardAvoidance = () => {
  const context = useContext(KeyboardAvoidanceContext);
  if (!context) {
    // Return a no-op implementation if context is not available
    return {
      registerScreen: () => {},
      isScreenWrapped: () => false,
      unregisterScreen: () => {},
      avoidanceMap: {},
    };
  }
  return context;
};

export default KeyboardAvoidanceContext;

