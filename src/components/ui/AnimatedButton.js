import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Animated button with press feedback and responsive text handling
 * Prevents text wrapping and ensures buttons scale properly
 */
const AnimatedButton = ({ 
  children, 
  onPress, 
  style, 
  disabled = false,
  activeOpacity = 0.8,
  ...props 
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { 
      damping: 20, 
      stiffness: 400,
      mass: 0.8
    });
    opacity.value = withTiming(0.85, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { 
      damping: 20, 
      stiffness: 400,
      mass: 0.8
    });
    opacity.value = withTiming(1, { duration: 100 });
  };
  
  const handlePress = (event) => {
    // Call onPress immediately without delay
    if (onPress && !disabled) {
      onPress(event);
    }
  };

  return (
    <AnimatedTouchable
      style={[style, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={activeOpacity}
      {...props}
    >
      <View style={styles.buttonContent} pointerEvents="box-none">
        {children}
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
});

export default AnimatedButton;

