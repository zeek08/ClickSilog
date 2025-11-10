import React from 'react';
import { Platform, Keyboard, LayoutAnimation, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Throttle function to limit how often a function can be called
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounce function to delay execution until after a period of inactivity
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Calculate keyboard vertical offset based on safe area insets
 */
export const calculateKeyboardOffset = (insets, headerHeight = 50) => {
  return insets.top + headerHeight;
};

/**
 * Configure LayoutAnimation for smooth keyboard transitions
 */
export const configureKeyboardAnimation = (duration = 250) => {
  LayoutAnimation.configureNext({
    duration,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
  });
};

/**
 * Get keyboard behavior based on platform
 */
export const getKeyboardBehavior = () => {
  return Platform.OS === 'ios' ? 'padding' : 'height';
};

/**
 * Check if a component tree contains TextInput-like elements
 * This is a simplified check - in production, you might use more sophisticated detection
 */
export const hasTextInputs = (children) => {
  if (!children) return false;

  try {
    const childrenString = JSON.stringify(children);
    return (
      childrenString.includes('TextInput') ||
      childrenString.includes('textInput') ||
      childrenString.includes('input') ||
      childrenString.includes('Input')
    );
  } catch (error) {
    // If stringification fails, assume TextInputs might be present
    return true;
  }
};

/**
 * Recursively search for TextInput components in React children
 */
export const findTextInputsInChildren = (children, found = []) => {
  if (!children) return found;

  React.Children.forEach(children, (child) => {
    if (!child) return;

    // Check if this is a TextInput
    if (
      child.type &&
      (child.type.displayName === 'TextInput' ||
        child.type.name === 'TextInput' ||
        child.type === require('react-native').TextInput)
    ) {
      found.push(child);
    }

    // Recursively check children
    if (child.props && child.props.children) {
      findTextInputsInChildren(child.props.children, found);
    }
  });

  return found;
};

/**
 * Hook to get keyboard height with throttling
 */
export const useKeyboardHeight = (throttleMs = 16) => {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const throttledSetHeight = throttle((height) => {
      setKeyboardHeight(height);
    }, throttleMs);

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates?.height || 0;
      throttledSetHeight(height);
      setIsKeyboardVisible(true);
      configureKeyboardAnimation();
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      throttledSetHeight(0);
      setIsKeyboardVisible(false);
      configureKeyboardAnimation();
    });

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [throttleMs]);

  return { keyboardHeight, isKeyboardVisible };
};

export default {
  throttle,
  debounce,
  calculateKeyboardOffset,
  configureKeyboardAnimation,
  getKeyboardBehavior,
  hasTextInputs,
  findTextInputsInChildren,
  useKeyboardHeight,
};

