import React, { useRef, useEffect } from 'react';
import { Animated, View, Platform } from 'react-native';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { 
  configureSmoothLayoutAnimation, 
  configureOrientationAnimation,
  throttle,
  createAnimatedValue,
} from '../../utils/animations';
import LayoutContainer from '../layout/LayoutContainer';

/**
 * AnimatedLayoutContainer - LayoutContainer with smooth animations
 * Automatically animates layout changes, orientation changes, and size changes
 */
const AnimatedLayoutContainer = ({
  children,
  animated = true,
  animateOnResize = true,
  animateOnOrientation = true,
  style,
  ...props
}) => {
  const { breakpoint, width, height } = useResponsiveLayout();
  const previousBreakpoint = useRef(breakpoint);
  const previousWidth = useRef(width);
  const previousHeight = useRef(height);
  const opacity = useRef(new Animated.Value(1)).current;

  // Throttled layout animation (120ms throttle)
  const throttledLayoutAnimation = useRef(
    throttle(() => {
      if (animated && Platform.OS !== 'ios') {
        configureSmoothLayoutAnimation();
      }
    }, 120)
  ).current;

  // Handle breakpoint changes
  useEffect(() => {
    if (previousBreakpoint.current !== breakpoint) {
      if (animateOnResize && animated) {
        // Fade out slightly, then fade back in (reduced duration to 160ms)
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

        throttledLayoutAnimation();
      }
      previousBreakpoint.current = breakpoint;
    }
  }, [breakpoint, animateOnResize, animated, opacity, throttledLayoutAnimation]);

  // Handle orientation changes
  useEffect(() => {
    const widthChanged = previousWidth.current !== width;
    const heightChanged = previousHeight.current !== height;
    
    if ((widthChanged || heightChanged) && animateOnOrientation && animated) {
      configureOrientationAnimation();
      
      // Fade transition for orientation change (reduced duration to 160ms)
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
    }

    previousWidth.current = width;
    previousHeight.current = height;
  }, [width, height, animateOnOrientation, animated, opacity]);

  // iOS fallback: configure layout animation on mount and updates
  useEffect(() => {
    if (Platform.OS === 'ios' && animated) {
      configureSmoothLayoutAnimation();
    }
  }, [animated]);

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

export default AnimatedLayoutContainer;

