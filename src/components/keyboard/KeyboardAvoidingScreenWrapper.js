import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { View, Platform, UIManager } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SmartKeyboardAvoidingView from './SmartKeyboardAvoidingView';
import { useKeyboardAvoidance } from '../../contexts/KeyboardAvoidanceContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Higher-order component that automatically wraps screens with keyboard avoidance
 * Detects TextInput components and applies appropriate keyboard handling
 */
const KeyboardAvoidingScreenWrapper = forwardRef(({ children, screenName: propScreenName, ...props }, ref) => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { isScreenWrapped, registerScreen, unregisterScreen } = useKeyboardAvoidance();
  const [hasTextInputs, setHasTextInputs] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const containerRef = useRef(null);
  const detectionTimeout = useRef(null);

  const screenName = propScreenName || route?.name || 'Unknown';
  const alreadyWrapped = isScreenWrapped(screenName);

  // Auto-detect TextInput components in children
  useEffect(() => {
    const detectTextInputs = () => {
      try {
        // Clear previous timeout
        if (detectionTimeout.current) {
          clearTimeout(detectionTimeout.current);
        }

        // Use multiple detection attempts for async-rendered TextInputs
        const attempts = [0, 100, 300, 500]; // Check at different intervals

        attempts.forEach((delay) => {
          detectionTimeout.current = setTimeout(() => {
            // Check if children contain TextInput patterns
            const childrenString = JSON.stringify(children);
            const hasInputs = 
              childrenString.includes('TextInput') ||
              childrenString.includes('textInput') ||
              childrenString.includes('TextInput') ||
              (typeof children === 'object' && children !== null);

            if (hasInputs && !hasTextInputs) {
              setHasTextInputs(true);
              registerScreen(screenName, true);
            }
          }, delay);
        });
      } catch (error) {
        console.warn('KeyboardAvoidingScreenWrapper: Error detecting TextInputs', error);
        // Fallback: assume TextInputs might be present
        setHasTextInputs(true);
        registerScreen(screenName, true);
      }
    };

    detectTextInputs();

    return () => {
      if (detectionTimeout.current) {
        clearTimeout(detectionTimeout.current);
      }
    };
  }, [children, screenName, hasTextInputs, registerScreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterScreen(screenName);
    };
  }, [screenName, unregisterScreen]);

  // If already wrapped or no TextInputs detected, render as-is
  if (alreadyWrapped) {
    console.warn(`KeyboardAvoidingScreenWrapper: Screen "${screenName}" already has keyboard avoidance. Skipping wrapper.`);
    return <>{children}</>;
  }

  // If no TextInputs detected yet, still wrap (they might be async)
  // But use a lighter wrapper
  if (!hasTextInputs) {
    return (
      <View ref={containerRef} style={{ flex: 1 }} {...props}>
        {children}
      </View>
    );
  }

  // Wrap with SmartKeyboardAvoidingView
  return (
    <SmartKeyboardAvoidingView
      ref={ref || containerRef}
      enabled={true}
      keyboardVerticalOffset={insets.top + 50}
      useScrollView={false}
      {...props}
    >
      {children}
    </SmartKeyboardAvoidingView>
  );
});

KeyboardAvoidingScreenWrapper.displayName = 'KeyboardAvoidingScreenWrapper';

/**
 * HOC to wrap a screen component with automatic keyboard avoidance
 */
export const withKeyboardAvoidance = (ScreenComponent, options = {}) => {
  const WrappedScreen = (props) => {
    const route = useRoute();
    const screenName = options.screenName || route?.name || ScreenComponent.name || 'Unknown';

    return (
      <KeyboardAvoidingScreenWrapper screenName={screenName} {...options}>
        <ScreenComponent {...props} />
      </KeyboardAvoidingScreenWrapper>
    );
  };

  WrappedScreen.displayName = `withKeyboardAvoidance(${ScreenComponent.displayName || ScreenComponent.name || 'Component'})`;

  return WrappedScreen;
};

export default KeyboardAvoidingScreenWrapper;

