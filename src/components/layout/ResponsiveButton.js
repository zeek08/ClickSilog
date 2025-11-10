import React, { useRef, useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Platform } from 'react-native';
import { scaleFont, getSpacing, COMPONENT_BOUNDARIES } from '../../utils/layoutBoundaries';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { scale } from '../../utils/responsive';
import ResponsiveText from './ResponsiveText';
import { 
  configureSmoothLayoutAnimation,
  createAnimatedValue,
  animateTiming,
  cleanupAnimations,
} from '../../utils/animations';

/**
 * ResponsiveButton - Button component with automatic width adjustment and responsive scaling
 * 
 * @param {Object} props
 * @param {string} props.size - Button size ('sm' | 'md' | 'lg')
 * @param {string} props.variant - Button variant ('primary' | 'secondary' | 'outline')
 * @param {boolean} props.fullWidth - Make button full width (default: false)
 * @param {boolean} props.autoWidth - Auto-adjust width to content (default: true)
 * @param {string} props.padding - Button padding ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 */
const ResponsiveButton = ({
  children,
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  autoWidth = true,
  padding,
  style,
  textStyle,
  animated = true,
  ...props
}) => {
  const { theme, spacing, borderRadius, typography } = useTheme();
  const { breakpoint, deviceType, layoutAdjustments } = useResponsiveLayout();
  const previousBreakpoint = useRef(breakpoint);
  const scaleAnim = useRef(createAnimatedValue(1)).current;
  const minFontSize = 12; // Minimum font size before expanding width
  const [buttonWidth, setButtonWidth] = useState(null);

  // Size presets
  const sizePresets = {
    sm: {
      paddingVertical: getSpacing('sm'),
      paddingHorizontal: getSpacing('md'),
      fontSize: scaleFont(14),
    },
    md: {
      paddingVertical: getSpacing('md'),
      paddingHorizontal: getSpacing('lg'),
      fontSize: scaleFont(16),
    },
    lg: {
      paddingVertical: getSpacing('lg'),
      paddingHorizontal: getSpacing('xl'),
      fontSize: scaleFont(18),
    },
  };

  // Variant presets
  const variantPresets = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
  };

  const sizeStyle = sizePresets[size] || sizePresets.md;
  const variantStyle = variantPresets[variant] || variantPresets.primary;

  // Calculate font size with minimum threshold
  const calculatedFontSize = Math.max(minFontSize, sizeStyle.fontSize);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAnimations([scaleAnim]);
    };
  }, []);

  // Handle breakpoint changes with timing animation (replaced spring)
  useEffect(() => {
    if (previousBreakpoint.current !== breakpoint && animated) {
      // Subtle scale animation using timing instead of spring
      animateTiming(scaleAnim, 0.98, {
        duration: 80,
        useNativeDriver: true,
      }).start(() => {
        animateTiming(scaleAnim, 1, {
          duration: 80,
          useNativeDriver: true,
        }).start();
      });

      configureSmoothLayoutAnimation();
      previousBreakpoint.current = breakpoint;
    }
  }, [breakpoint, animated, scaleAnim]);

  // Apply device-specific button width adjustments
  useEffect(() => {
    if (layoutAdjustments.buttonWidth === '100%' && !fullWidth) {
      // For compact devices, make buttons full width
      setButtonWidth('100%');
    } else if (fullWidth) {
      setButtonWidth('100%');
    } else {
      setButtonWidth(null);
    }
  }, [layoutAdjustments.buttonWidth, fullWidth]);

  // Build button style with device-specific adjustments
  const buttonStyle = {
    ...sizeStyle,
    ...variantStyle,
    borderRadius: borderRadius.md,
    ...(buttonWidth === '100%' ? COMPONENT_BOUNDARIES.fullWidth : {}),
    ...(autoWidth && buttonWidth !== '100%' ? COMPONENT_BOUNDARIES.auto : {}),
    ...(padding ? { padding: getSpacing(padding) } : {}),
    ...(buttonWidth ? { width: buttonWidth } : {}),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scaleFont(calculatedFontSize) + (sizeStyle.paddingVertical * 2),
    // Add bounding containers to prevent stretching
    maxWidth: buttonWidth === '100%' ? '100%' : '90%',
    minWidth: buttonWidth === '100%' ? '100%' : undefined,
  };

  // Text color based on variant
  const textColor = variant === 'outline' || variant === 'secondary' 
    ? theme.colors.primary 
    : theme.colors.onPrimary;

  // If font size is at minimum, expand button width slightly
  const shouldExpandWidth = calculatedFontSize <= minFontSize;

  // Fallback check: resize button text when text exceeds 90% of button width
  const handleTextLayout = (event) => {
    if (autoWidth && !fullWidth && buttonWidth !== '100%') {
      const { width: textWidth } = event.nativeEvent.layout;
      const buttonWidthValue = buttonWidth || 'auto';
      // If text width exceeds 90% of available width, adjust
      if (typeof buttonWidthValue === 'number' && textWidth > buttonWidthValue * 0.9) {
        // Text is too wide, button will expand automatically due to autoWidth
      }
    }
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
        shouldExpandWidth && buttonWidth !== '100%' ? { minWidth: 'auto', paddingHorizontal: getSpacing('lg') } : {},
      ]}
    >
      <TouchableOpacity
        style={[buttonStyle, style]}
        activeOpacity={0.7}
        {...props}
      >
        {typeof children === 'string' ? (
          <ResponsiveText
            size={calculatedFontSize}
            style={[
              { color: textColor, fontWeight: '600' },
              textStyle,
            ]}
            onLayout={handleTextLayout}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {children}
          </ResponsiveText>
        ) : (
          children
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ResponsiveButton;

