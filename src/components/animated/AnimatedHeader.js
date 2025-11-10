import React, { useRef, useEffect } from 'react';
import { Animated, View, Platform } from 'react-native';
import { useAnimation } from '../../contexts/AnimationContext';
import { 
  configureKeyboardAnimation,
  interpolateHeaderOpacity,
  createAnimatedValue,
  animateTiming,
  cleanupAnimations,
} from '../../utils/animations';
import LayoutContainer from '../layout/LayoutContainer';

/**
 * AnimatedHeader - Header component with keyboard-driven opacity transitions
 * Fades slightly (1 → 0.92) when keyboard opens
 */
const AnimatedHeader = ({
  children,
  style,
  animated = true,
  ...props
}) => {
  const { isKeyboardVisible, keyboardHeight } = useAnimation();
  const opacity = useRef(createAnimatedValue(1)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAnimations([opacity]);
    };
  }, []);

  // Handle keyboard visibility changes (reduced duration to 180ms)
  useEffect(() => {
    if (animated) {
      const targetOpacity = isKeyboardVisible ? 0.92 : 1;
      
      animateTiming(opacity, targetOpacity, {
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [isKeyboardVisible, animated, opacity]);

  return (
    <Animated.View
      style={[
        {
          opacity,
        },
        style,
      ]}
    >
      <LayoutContainer {...props}>
        {children}
      </LayoutContainer>
    </Animated.View>
  );
};

AnimatedHeader.displayName = 'AnimatedHeader';

export default AnimatedHeader;

