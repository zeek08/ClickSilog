import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { scaleFont, getSpacing } from '../../utils/layoutBoundaries';
import { getResponsiveFontSize, getResponsiveLineHeight } from '../../utils/responsive';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

/**
 * ResponsiveText - Text component with automatic font scaling
 * 
 * @param {Object} props
 * @param {number} props.size - Base font size (will be scaled responsively)
 * @param {string} props.variant - Typography variant ('h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption')
 * @param {string} props.spacing - Text spacing ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 * @param {boolean} props.autoScale - Enable automatic scaling (default: true)
 */
const ResponsiveText = ({
  children,
  size,
  variant = 'body',
  spacing,
  autoScale = true,
  style,
  ...props
}) => {
  const { typography, theme } = useTheme();
  const { deviceType, layoutAdjustments } = useResponsiveLayout();
  
  // Get base font size from variant or use provided size
  let baseSize = size;
  if (!baseSize && typography[variant]) {
    baseSize = typography[variant].fontSize || 16;
  }
  if (!baseSize) {
    baseSize = 16; // Default
  }

  // Scale font size if autoScale is enabled
  // Use getResponsiveFontSize for tier-based scaling
  const fontSize = autoScale 
    ? getResponsiveFontSize(baseSize * layoutAdjustments.fontScale) 
    : baseSize * layoutAdjustments.fontScale;

  // Get responsive line height proportional to font size
  const lineHeight = getResponsiveLineHeight(fontSize);

  // Build text style with responsive line height
  const textStyle = {
    fontSize,
    lineHeight,
    ...(typography[variant] || {}),
  };

  // Add spacing if provided
  const spacingStyle = {};
  if (spacing) {
    spacingStyle.marginBottom = getSpacing(spacing);
  }

  // Add text constraints for button labels
  const textProps = typeof children === 'string' && children.length > 20 
    ? { numberOfLines: 1, ellipsizeMode: 'tail' }
    : {};

  return (
    <Text
      style={[
        textStyle,
        spacingStyle,
        style,
      ]}
      {...textProps}
      {...props}
    >
      {children}
    </Text>
  );
};

export default ResponsiveText;

