import { useRef, useEffect, useCallback } from 'react';
import { useRoute } from '@react-navigation/native';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';

/**
 * Hook for easy integration of keyboard focus and scroll-to-focus behavior
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Enable/disable scroll-to-focus
 * @param {string} options.inputId - Custom input ID (auto-generated if not provided)
 * @param {boolean} options.skipScroll - Skip automatic scroll on focus
 * @param {boolean} options.multiline - Whether input is multiline (skips auto-scroll)
 * 
 * @returns {Object} - Focus control functions and state
 */
export const useKeyboardFocusHook = (options = {}) => {
  const {
    enabled = true,
    inputId: propInputId,
    skipScroll = false,
    multiline = false,
  } = options;

  const route = useRoute();
  const { registerInput, unregisterInput, scrollToInput, resetScroll, activeInput, keyboardHeight } = useKeyboardFocus();
  const inputRef = useRef(null);
  const generatedId = useRef(`input_${Date.now()}_${Math.random()}`).current;
  const inputId = propInputId || generatedId;
  const screenName = route?.name || 'Unknown';

  // Register input on mount
  useEffect(() => {
    if (enabled && inputRef.current) {
      registerInput(inputId, inputRef.current, screenName);
    }

    return () => {
      unregisterInput(inputId);
    };
  }, [enabled, inputId, screenName, registerInput, unregisterInput]);

  // Handle focus with scroll-to-focus
  const handleFocus = useCallback((event) => {
    if (enabled && !skipScroll && !multiline) {
      // For multiline inputs, skip auto-scroll to prevent jitter while typing
      // Small delay to ensure keyboard is showing
      setTimeout(() => {
        scrollToInput(inputId, {
          duration: 250,
          offset: 0,
          skipIfVisible: true,
        });
      }, 100);
    }
  }, [enabled, skipScroll, multiline, inputId, scrollToInput]);

  // Handle blur with optional scroll reset
  const handleBlur = useCallback((event) => {
    // Optionally reset scroll when input loses focus
    // Uncomment if you want scroll to reset on blur
    // resetScroll(screenName, true);
  }, [screenName, resetScroll]);

  // Manual scroll to input
  const scrollToThisInput = useCallback((options = {}) => {
    scrollToInput(inputId, {
      duration: 250,
      offset: 0,
      skipIfVisible: true,
      ...options,
    });
  }, [inputId, scrollToInput]);

  // Manual reset scroll
  const resetScrollPosition = useCallback((animated = true) => {
    resetScroll(screenName, animated);
  }, [screenName, resetScroll]);

  return {
    inputRef,
    inputId,
    screenName,
    handleFocus,
    handleBlur,
    scrollToThisInput,
    resetScrollPosition,
    activeInput,
    keyboardHeight,
    isActive: activeInput === inputId,
  };
};

export default useKeyboardFocusHook;

