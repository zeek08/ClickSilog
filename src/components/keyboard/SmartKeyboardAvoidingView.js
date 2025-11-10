import React, { useRef, useEffect, useState, useMemo, forwardRef } from 'react';
import { View, KeyboardAvoidingView, Platform, Keyboard, Animated, LayoutAnimation, UIManager, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useKeyboardFocus } from '../../contexts/KeyboardFocusContext';
import { useAnimation } from '../../contexts/AnimationContext';
import { useRoute } from '@react-navigation/native';
import { 
  configureKeyboardAnimation,
  interpolateHeaderOpacity,
  createAnimatedValue,
} from '../../utils/animations';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Recursively finds all TextInput components in a React element tree
 */
const findTextInputs = (children, found = []) => {
  React.Children.forEach(children, (child) => {
    if (!child) return;
    
    // Check if this is a TextInput
    if (child.type && (child.type.displayName === 'TextInput' || child.type.name === 'TextInput')) {
      found.push(child);
    }
    
    // Check if this is a component that might contain TextInput
    if (child.props && child.props.children) {
      findTextInputs(child.props.children, found);
    }
  });
  
  return found;
};

/**
 * SmartKeyboardAvoidingView - Automatically detects TextInput components
 * and applies keyboard avoidance when needed
 */
const SmartKeyboardAvoidingView = forwardRef(({
  children,
  style,
  enabled = true,
  behavior = Platform.OS === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset: customOffset,
  useScrollView = false,
  scrollViewProps = {},
  onKeyboardShow,
  onKeyboardHide,
  screenName: propScreenName,
  ...props
}) => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { registerScrollRef } = useKeyboardFocus();
  const { isKeyboardVisible: contextKeyboardVisible, keyboardHeight: contextKeyboardHeight } = useAnimation();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [hasTextInputs, setHasTextInputs] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const keyboardShowListener = useRef(null);
  const keyboardHideListener = useRef(null);
  const animatedValue = useRef(createAnimatedValue(0)).current;
  const headerOpacity = useRef(createAnimatedValue(1)).current;
  
  const screenName = propScreenName || route?.name || 'Unknown';

  // Calculate keyboard vertical offset
  const keyboardVerticalOffset = useMemo(() => {
    if (customOffset !== undefined) return customOffset;
    // Header height + safe area top + some padding
    return insets.top + 50;
  }, [customOffset, insets.top]);

  // Detect TextInput components in children
  useEffect(() => {
    if (!enabled) return;

    const detectTextInputs = () => {
      try {
        // Use a timeout to allow async rendering
        const timeoutId = setTimeout(() => {
          if (containerRef.current) {
            // For now, we'll assume TextInputs are present if enabled
            // In a real implementation, you might use React DevTools or a ref callback
            // For simplicity, we'll check if children contain TextInput-like patterns
            const hasInputs = React.Children.toArray(children).some((child) => {
              const childString = JSON.stringify(child);
              return childString.includes('TextInput') || childString.includes('textInput');
            });
            
            setHasTextInputs(hasInputs || enabled);
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.warn('SmartKeyboardAvoidingView: Error detecting TextInputs', error);
        // Fallback: assume TextInputs are present if enabled
        setHasTextInputs(enabled);
      }
    };

    detectTextInputs();
  }, [children, enabled]);

  // Register scroll ref with KeyboardFocusContext
  useEffect(() => {
    if (scrollRef.current) {
      registerScrollRef(screenName, scrollRef.current);
    }

    return () => {
      registerScrollRef(screenName, null);
    };
  }, [screenName, registerScrollRef]);

  // Keyboard event listeners with LayoutAnimation
  useEffect(() => {
    if (!enabled || !hasTextInputs) return;

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const height = event.endCoordinates?.height || 0;
        setKeyboardHeight(height);
        setIsKeyboardVisible(true);

        // Configure keyboard animation
        configureKeyboardAnimation();

        // Animate header opacity (1 → 0.92) when keyboard opens
        Animated.timing(headerOpacity, {
          toValue: 0.92,
          duration: 220,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }).start();

        // Animate value for potential use
        Animated.timing(animatedValue, {
          toValue: height,
          duration: 220,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // ease-in-out cubic
          useNativeDriver: false,
        }).start();

        // Delay input focus animation by 100ms after keyboard event
        setTimeout(() => {
          // Batch keyboard adjustments in requestAnimationFrame
          requestAnimationFrame(() => {
            onKeyboardShow?.(event);
          });
        }, 100);
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);

        // Configure keyboard hide animation
        configureKeyboardAnimation();

        // Animate header opacity back to 1 when keyboard closes
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }).start();

        // Animate value back
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 220,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // ease-in-out cubic
          useNativeDriver: false,
        }).start();

        // Batch keyboard adjustments in requestAnimationFrame
        requestAnimationFrame(() => {
          onKeyboardHide?.(event);
        });
      }
    );

    keyboardShowListener.current = showSubscription;
    keyboardHideListener.current = hideSubscription;

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [enabled, hasTextInputs, animatedValue, onKeyboardShow, onKeyboardHide]);

  // If no TextInputs detected or disabled, render as normal View
  if (!enabled || !hasTextInputs) {
    return (
      <View ref={containerRef} style={[{ flex: 1 }, style]} {...props}>
        {children}
      </View>
    );
  }

  // Use ScrollView for long content
  if (useScrollView) {
    return (
      <KeyboardAwareScrollView
        ref={(ref) => {
          containerRef.current = ref;
          scrollRef.current = ref;
        }}
        style={[{ flex: 1 }, style]}
        enableOnAndroid={true}
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        keyboardVerticalOffset={keyboardVerticalOffset}
        {...scrollViewProps}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  // Use KeyboardAvoidingView for fixed layouts
  // Note: For scroll-to-focus to work properly, consider using useScrollView={true}
  return (
    <KeyboardAvoidingView
      ref={(ref) => {
        containerRef.current = ref;
        // For KeyboardAvoidingView, we still register it as a scroll ref
        // even though it's not scrollable, for consistency
        scrollRef.current = ref;
      }}
      style={[{ flex: 1 }, style]}
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled={enabled}
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  );
});

SmartKeyboardAvoidingView.displayName = 'SmartKeyboardAvoidingView';

export default SmartKeyboardAvoidingView;

