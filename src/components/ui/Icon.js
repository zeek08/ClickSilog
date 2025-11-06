import React from 'react';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

/**
 * Unified Icon component using vector icons
 * Replaces all emoji usage with professional icons
 */
const Icon = ({ 
  name, 
  size = 24, 
  color, 
  library = 'ionicons', // 'ionicons' | 'material' | 'feather'
  style 
}) => {
  // Ensure backgroundColor is transparent unless explicitly set
  const mergedStyle = Array.isArray(style) 
    ? [{ backgroundColor: 'transparent' }, ...style]
    : { backgroundColor: 'transparent', ...style };

  const iconProps = {
    name,
    size,
    color: color || '#111827',
    style: mergedStyle,
  };

  switch (library) {
    case 'material':
      return <MaterialCommunityIcons {...iconProps} />;
    case 'feather':
      return <Feather {...iconProps} />;
    case 'ionicons':
    default:
      return <Ionicons {...iconProps} />;
  }
};

export default Icon;

