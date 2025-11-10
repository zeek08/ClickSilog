import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, View, Dimensions, Platform } from 'react-native';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { 
  configureSmoothLayoutAnimation,
  configureOrientationAnimation,
  batchAnimations,
  throttle,
  createAnimatedValue,
} from '../../utils/animations';
import LayoutContainer from '../layout/LayoutContainer';

/**
 * ResponsiveBoundary - Wrapper that enforces relational layout awareness
 * Each component knows its top, bottom, left, and right neighbors
 * When device width or height changes, recalculates and triggers smooth transitions
 */
const ResponsiveBoundary = ({
  children,
  minScaleFactor = 0.9,
  maxScaleFactor = 1.1,
  animated = true,
  onLayoutChange,
  style,
  ...props
}) => {
  const { width, height, breakpoint } = useResponsiveLayout();
  const [boundaries, setBoundaries] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const previousDimensions = useRef({ width, height });
  const scale = useRef(createAnimatedValue(1)).current;
  const opacity = useRef(createAnimatedValue(1)).current;
  const containerRef = useRef(null);

  // Calculate scale factor based on screen size
  const calculateScaleFactor = useCallback(() => {
    const baseWidth = 375; // Base width for scaling
    const scaleFactor = width / baseWidth;
    
    // Clamp scale factor between min and max
    const clampedScale = Math.max(
      minScaleFactor,
      Math.min(maxScaleFactor, scaleFactor)
    );
    
    return clampedScale;
  }, [width, minScaleFactor, maxScaleFactor]);

  // Throttled layout recalculation
  const throttledRecalculate = useRef(
    throttle(() => {
      if (containerRef.current) {
        containerRef.current.measureInWindow((x, y, w, h) => {
          const newBoundaries = {
            top: y,
            bottom: y + h,
            left: x,
            right: x + w,
          };
          
          setBoundaries(newBoundaries);
          onLayoutChange?.(newBoundaries);
        });
      }
    }, 100)
  ).current;

  // Handle dimension changes
  useEffect(() => {
    const widthChanged = previousDimensions.current.width !== width;
    const heightChanged = previousDimensions.current.height !== height;

    if (widthChanged || heightChanged) {
      if (animated) {
        // Configure orientation animation
        configureOrientationAnimation();

        // Fade transition
        const fadeOut = Animated.timing(opacity, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        });

        const fadeIn = Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        });

        // Scale animation
        const scaleFactor = calculateScaleFactor();
        const scaleAnimation = Animated.timing(scale, {
          toValue: scaleFactor,
          duration: 300,
          useNativeDriver: true,
        });

        // Batch animations
        batchAnimations(
          [fadeOut, scaleAnimation],
          () => {
            fadeIn.start();
            throttledRecalculate();
          }
        );
      } else {
        throttledRecalculate();
      }

      previousDimensions.current = { width, height };
    }
  }, [width, height, animated, opacity, scale, calculateScaleFactor, throttledRecalculate]);

  // Recalculate boundaries on mount
  useEffect(() => {
    throttledRecalculate();
  }, [throttledRecalculate]);

  // Listen to dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      throttledRecalculate();
    });

    return () => subscription?.remove();
  }, [throttledRecalculate]);

  return (
    <Animated.View
      ref={containerRef}
      style={[
        {
          transform: [{ scale }],
          opacity,
        },
        style,
      ]}
      onLayout={throttledRecalculate}
    >
      <LayoutContainer {...props}>
        {children}
      </LayoutContainer>
    </Animated.View>
  );
};

export default ResponsiveBoundary;

