import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, Platform } from 'react-native';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { 
  animateTiming,
  animateButtonTap,
  configureSmoothLayoutAnimation,
  createAnimatedValue,
  cleanupAnimations,
} from '../../utils/animations';

/**
 * AnimatedButton - Button with smooth scale and position transitions
 * Automatically adjusts scale and position when resizing or orientation changes
 */
const AnimatedButton = ({
  children,
  style,
  onPress,
  animated = true,
  scaleRange = { min: 0.98, max: 1.0 },
  ...props
}) => {
  const { breakpoint, width } = useResponsiveLayout();
  const previousBreakpoint = useRef(breakpoint);
  const scale = useRef(createAnimatedValue(1)).current;
  const opacity = useRef(createAnimatedValue(1)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAnimations([scale, opacity]);
    };
  }, []);

  // Handle breakpoint changes with timing animation (replaced spring)
  useEffect(() => {
    if (previousBreakpoint.current !== breakpoint && animated) {
      // Subtle scale animation using timing instead of spring
      animateTiming(scale, scaleRange.max, {
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        animateTiming(scale, 1, {
          duration: 180,
          useNativeDriver: true,
        }).start();
      });

      configureSmoothLayoutAnimation();
      previousBreakpoint.current = breakpoint;
    }
  }, [breakpoint, animated, scale, scaleRange]);

  // Handle press with button tap feedback (scale down to 0.96)
  const handlePressIn = () => {
    if (animated) {
      animateTiming(scale, 0.96, {
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animated) {
      animateTiming(scale, 1, {
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = (event) => {
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton;

