import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { withKeyboardAvoidance } from '../components/keyboard/KeyboardAvoidingScreenWrapper';

/**
 * Higher-order navigator that automatically wraps all screens with keyboard avoidance
 * Usage: Wrap your screen components with this navigator
 */
export const createKeyboardAvoidingNavigator = (Stack) => {
  const KeyboardAvoidingStack = ({ children, ...props }) => {
    return (
      <Stack.Navigator {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === Stack.Screen) {
            const { component, ...screenProps } = child.props;
            
            // Wrap the component with keyboard avoidance
            const WrappedComponent = component 
              ? withKeyboardAvoidance(component, {
                  screenName: screenProps.name || component.name,
                })
              : null;

            if (!WrappedComponent) return child;

            return React.cloneElement(child, {
              ...screenProps,
              component: WrappedComponent,
            });
          }
          return child;
        })}
      </Stack.Navigator>
    );
  };

  KeyboardAvoidingStack.Screen = Stack.Screen;
  KeyboardAvoidingStack.Navigator = Stack.Navigator;
  KeyboardAvoidingStack.Group = Stack.Group;

  return KeyboardAvoidingStack;
};

/**
 * HOC to wrap a screen component with automatic keyboard avoidance
 * Can be used directly in navigation stacks
 */
export const wrapScreenWithKeyboardAvoidance = (ScreenComponent, options = {}) => {
  return withKeyboardAvoidance(ScreenComponent, options);
};

export default createKeyboardAvoidingNavigator;

