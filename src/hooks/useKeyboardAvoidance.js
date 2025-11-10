import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoute } from '@react-navigation/native';
import { useKeyboardAvoidance } from '../contexts/KeyboardAvoidanceContext';
import { Keyboard, Platform } from 'react-native';

/**
 * Hook for automatic keyboard avoidance in screens
 * Automatically detects TextInput presence and manages keyboard avoidance
 */
export const useKeyboardAvoidanceHook = (options = {}) => {
  const {
    enabled = true,
    useScrollView = false,
    behavior = Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset,
    onKeyboardShow,
    onKeyboardHide,
  } = options;

  const route = useRoute();
  const { registerScreen, isScreenWrapped, unregisterScreen } = useKeyboardAvoidance();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [hasTextInputs, setHasTextInputs] = useState(false);
  const keyboardShowListener = useRef(null);
  const keyboardHideListener = useRef(null);
  const detectionTimeout = useRef(null);

  const screenName = route?.name || 'Unknown';

  // Detect if screen already has keyboard avoidance
  const alreadyWrapped = isScreenWrapped(screenName);

  // Throttled keyboard height update
  const updateKeyboardHeight = useCallback((height) => {
    if (detectionTimeout.current) {
      clearTimeout(detectionTimeout.current);
    }
    
    detectionTimeout.current = setTimeout(() => {
      setKeyboardHeight(height);
    }, 16); // ~60fps throttling
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    if (!enabled || alreadyWrapped) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates?.height || 0;
      updateKeyboardHeight(height);
      setIsKeyboardVisible(true);
      onKeyboardShow?.(event);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      updateKeyboardHeight(0);
      setIsKeyboardVisible(false);
      onKeyboardHide?.(event);
    });

    keyboardShowListener.current = showSubscription;
    keyboardHideListener.current = hideSubscription;

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
      if (detectionTimeout.current) {
        clearTimeout(detectionTimeout.current);
      }
    };
  }, [enabled, alreadyWrapped, updateKeyboardHeight, onKeyboardShow, onKeyboardHide]);

  // Register/unregister screen
  useEffect(() => {
    if (enabled && !alreadyWrapped) {
      registerScreen(screenName, true);
    }

    return () => {
      unregisterScreen(screenName);
    };
  }, [enabled, alreadyWrapped, screenName, registerScreen, unregisterScreen]);

  // Auto-detect TextInputs (simplified - assumes enabled means TextInputs are present)
  useEffect(() => {
    if (enabled) {
      // In a real implementation, you might scan the component tree
      // For now, we'll assume TextInputs are present if enabled
      setHasTextInputs(true);
    }
  }, [enabled]);

  return {
    enabled: enabled && !alreadyWrapped,
    useScrollView,
    behavior,
    keyboardVerticalOffset,
    keyboardHeight,
    isKeyboardVisible,
    hasTextInputs,
    alreadyWrapped,
    screenName,
  };
};

export default useKeyboardAvoidance;

