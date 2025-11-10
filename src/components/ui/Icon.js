import React from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { scale, getIconWithHitArea } from '../../utils/responsive';

/**
 * Unified Icon component using vector icons with responsive scaling
 * Replaces all emoji usage with professional icons
 * Automatically scales icons and adds hit area padding for accessibility
 */
const Icon = ({ 
  name, 
  size = 24, 
  color, 
  library = 'ionicons', // 'ionicons' | 'material' | 'feather'
  style,
  responsive = true, // Enable responsive scaling
  hitArea = true, // Add hit area padding for accessibility
  ...props
}) => {
  // Scale icon size responsively with minimum size to ensure visibility
  const scaledSize = responsive ? Math.max(20, scale(size)) : size;
  
  // Get icon with hit area if enabled (don't scale again - already scaled above)
  const iconConfig = hitArea ? getIconWithHitArea(scaledSize, false) : { size: scaledSize, padding: 0 };
  
  // Ensure backgroundColor is transparent unless explicitly set
  const mergedStyle = Array.isArray(style) 
    ? [{ backgroundColor: 'transparent' }, ...style]
    : { backgroundColor: 'transparent', ...style };

  const iconProps = {
    name,
    size: iconConfig.size,
    color: color || '#111827',
    style: mergedStyle,
    ...props,
  };

  const IconComponent = (() => {
    switch (library) {
      case 'material':
        return <MaterialCommunityIcons {...iconProps} />;
      case 'feather':
        return <Feather {...iconProps} />;
      case 'ionicons':
      default:
        return <Ionicons {...iconProps} />;
    }
  })();

  // Wrap in View with hit area padding if needed
  if (hitArea && iconConfig.padding > 0) {
    return (
      <View style={{ padding: iconConfig.padding }}>
        {IconComponent}
      </View>
    );
  }

  return IconComponent;
};

export default Icon;

