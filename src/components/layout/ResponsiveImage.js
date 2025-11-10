import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { scale } from '../../utils/responsive';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getRecommendedResizeMode } from '../../utils/deviceDetection';

/**
 * ResponsiveImage - Image component with automatic scaling and aspect ratio handling
 * Uses aspectRatio style instead of manually setting width/height
 */
const ResponsiveImage = ({
  source,
  width,
  height,
  aspectRatio,
  style,
  resizeMode,
  ...props
}) => {
  const { deviceType } = useResponsiveLayout();
  
  // Scale dimensions responsively
  const scaledWidth = width ? scale(width) : undefined;
  const scaledHeight = height ? scale(height) : undefined;
  
  // Get recommended resize mode based on device
  const recommendedResizeMode = resizeMode || getRecommendedResizeMode();
  
  // Build image style with aspect ratio handling
  const imageStyle = {
    ...(scaledWidth ? { width: scaledWidth } : {}),
    ...(scaledHeight ? { height: scaledHeight } : {}),
    ...(aspectRatio ? { aspectRatio } : {}),
    // Use contain or center to prevent distortion
    resizeMode: recommendedResizeMode === 'contain' ? 'contain' : 
                recommendedResizeMode === 'center' ? 'center' : 
                resizeMode || 'cover',
  };

  return (
    <Image
      source={source}
      style={[imageStyle, style]}
      resizeMode={imageStyle.resizeMode}
      {...props}
    />
  );
};

export default ResponsiveImage;

