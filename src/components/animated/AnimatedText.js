import React, { useRef, useEffect } from 'react';
import { Animated, Text, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { 
  configureSmoothLayoutAnimation,
  createAnimatedValue,
  animateTiming,
  cleanupAnimations,
} from '../../utils/animations';
import ResponsiveText from '../layout/ResponsiveText';

/**
 * AnimatedText - Text component with smooth transitions
 * Automatically animates font size changes and color transitions
 */
const AnimatedText = ({
  children,
  variant = 'body',
  style,
  animated = true,
  animateColor = true,
  ...props
}) => {
  const { theme, typography } = useTheme();
  const { breakpoint } = useResponsiveLayout();
  const previousBreakpoint = useRef(breakpoint);
  const previousColor = useRef(theme.colors.text);
  const opacity = useRef(createAnimatedValue(1)).current;
  const colorOpacity = useRef(createAnimatedValue(1)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAnimations([opacity, colorOpacity]);
    };
  }, []);

  // Handle breakpoint changes (reduced duration to 160ms)
  useEffect(() => {
    if (previousBreakpoint.current !== breakpoint && animated) {
      // Fade transition for font size changes
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
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
  }, [breakpoint, animated, opacity]);

  // Handle theme color changes (disabled during heavy tasks)
  useEffect(() => {
    if (previousColor.current !== theme.colors.text && animateColor && animated) {
      // Skip color transitions during heavy tasks (check if component is in heavy render)
      // For now, we'll keep it but reduce duration
      Animated.sequence([
        Animated.timing(colorOpacity, {
          toValue: 0.7,
          duration: 75,
          useNativeDriver: true,
        }),
        Animated.timing(colorOpacity, {
          toValue: 1,
          duration: 75,
          useNativeDriver: true,
        }),
      ]).start();

      previousColor.current = theme.colors.text;
    }
  }, [theme.colors.text, animateColor, animated, colorOpacity]);

  // iOS fallback: configure layout animation on mount
  useEffect(() => {
    if (Platform.OS === 'ios' && animated) {
      configureSmoothLayoutAnimation();
    }
  }, [animated]);

  return (
    <Animated.View
      style={{
        opacity: Animated.multiply(opacity, colorOpacity),
      }}
    >
      <ResponsiveText
        variant={variant}
        style={style}
        {...props}
      >
        {children}
      </ResponsiveText>
    </Animated.View>
  );
};

export default AnimatedText;

