import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLEX_LAYOUTS, COMPONENT_BOUNDARIES, getSpacing } from '../../utils/layoutBoundaries';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

/**
 * LayoutContainer - Base container component with boundary-based layout rules
 * 
 * @param {Object} props
 * @param {string} props.direction - 'row' | 'column' (default: 'column')
 * @param {string} props.justify - 'start' | 'center' | 'end' | 'space-between' | 'space-around'
 * @param {string} props.align - 'start' | 'center' | 'end' | 'stretch'
 * @param {string} props.wrap - Enable flexWrap (default: false)
 * @param {string} props.gap - Spacing between children ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 * @param {string} props.padding - Container padding ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 * @param {string} props.margin - Container margin ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 * @param {string} props.boundary - Boundary type ('fixed' | 'flexible' | 'auto' | 'fullWidth' | 'fullHeight')
 * @param {boolean} props.safe - Apply safe area insets
 */
const LayoutContainer = ({
  children,
  direction = 'column',
  justify = 'start',
  align = 'stretch',
  wrap = false,
  gap,
  padding,
  margin,
  boundary = 'flexible',
  safe = false,
  grid = false, // Enable responsive grid layout
  columns = 2, // Number of columns for grid
  style,
  ...props
}) => {
  const insets = useSafeAreaInsets();
  const { deviceType, layoutAdjustments } = useResponsiveLayout();
  // Calculate grid column width for responsive grid layout
  const getGridColumnWidth = () => {
    if (!grid) return undefined;
    
    // For wide screens (>700px), use 32% for 3 columns
    if (deviceType.width > 700) {
      return columns === 3 ? '32%' : columns === 2 ? '48%' : '100%';
    }
    
    // For standard screens, use 48% for 2 columns
    return columns === 2 ? '48%' : '100%';
  };

  // Build flexbox layout with responsive grid support
  const flexLayout = {
    flexDirection: direction === 'row' ? 'row' : 'column',
    justifyContent: justify === 'start' ? 'flex-start' :
                   justify === 'center' ? 'center' :
                   justify === 'end' ? 'flex-end' :
                   justify === 'space-between' ? 'space-between' :
                   justify === 'space-around' ? 'space-around' : 'flex-start',
    alignItems: align === 'start' ? 'flex-start' :
                align === 'center' ? 'center' :
                align === 'end' ? 'flex-end' :
                align === 'stretch' ? 'stretch' : 'stretch',
    flexWrap: (wrap || grid) ? 'wrap' : 'nowrap',
    ...(grid ? { 
      flexBasis: getGridColumnWidth(),
      maxWidth: getGridColumnWidth(),
    } : {}),
  };

  // Apply boundary rules
  const boundaryRules = COMPONENT_BOUNDARIES[boundary] || COMPONENT_BOUNDARIES.flexible;

  // Apply safe area insets with device-specific adjustments
  const safeAreaStyle = safe ? {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left * layoutAdjustments.horizontalPadding,
    paddingRight: insets.right * layoutAdjustments.horizontalPadding,
  } : {};

  // Build spacing with device-specific adjustments
  const spacingStyle = {};
  if (gap) {
    spacingStyle.gap = getSpacing(gap);
  }
  if (padding) {
    const paddingValue = getSpacing(padding);
    spacingStyle.padding = paddingValue * layoutAdjustments.horizontalPadding;
  }
  if (margin) {
    const marginValue = getSpacing(margin);
    spacingStyle.margin = marginValue * layoutAdjustments.verticalMargin;
  }

  return (
    <View
      style={[
        flexLayout,
        boundaryRules,
        spacingStyle,
        safeAreaStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export default LayoutContainer;

