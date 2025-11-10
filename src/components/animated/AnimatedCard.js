import React, { useRef, useEffect } from 'react';
import { Animated, View, Platform } from 'react-native';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { 
  configureSmoothLayoutAnimation,
  createAnimatedValue,
  animateTiming,
  cleanupAnimations,
} from '../../utils/animations';
import LayoutContainer from '../layout/LayoutContainer';

/**
 * AnimatedCard - Card component with smooth transitions
 * Automatically animates size and position changes
 */
const AnimatedCard = ({
  children,
  style,
  animated = true,
  ...props
}) => {
  const { breakpoint } = useResponsiveLayout();
  const previousBreakpoint = useRef(breakpoint);
  const opacity = useRef(createAnimatedValue(1)).current;
  const scale = useRef(createAnimatedValue(1)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAnimations([opacity, scale]);
    };
  }, []);

  // Handle breakpoint changes (reduced duration to 160ms)
  useEffect(() => {
    if (previousBreakpoint.current !== breakpoint && animated) {
      // Subtle scale animation using timing
      animateTiming(scale, 0.98, {
        duration: 80,
        useNativeDriver: true,
      }).start(() => {
        animateTiming(scale, 1, {
          duration: 80,
          useNativeDriver: true,
        }).start();
      });

      // Fade transition
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();

      configureSmoothLayoutAnimation();
      previousBreakpoint.current = breakpoint;
    }
  }, [breakpoint, animated, opacity, scale]);

  // iOS fallback: configure layout animation on mount
  useEffect(() => {
    if (Platform.OS === 'ios' && animated) {
      configureSmoothLayoutAnimation();
    }
  }, [animated]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale }],
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

AnimatedCard.displayName = 'AnimatedCard';

export default AnimatedCard;

