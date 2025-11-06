import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MenuScreen from '../screens/customer/MenuScreen';
import CartScreen from '../screens/customer/CartScreen';
import PaymentScreen from '../screens/customer/PaymentScreen';
import HeaderCartButton from '../components/ui/HeaderCartButton';
import HeaderHomeButton from '../components/ui/HeaderHomeButton';

const Stack = createStackNavigator();

const CustomerStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        height: 64,
        borderBottomWidth: 0
      },
      headerTintColor: '#D97706',
      headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: 0.3, color: '#D97706' },
      headerBackTitleVisible: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal'
    }}
  >
    <Stack.Screen
      name="Menu"
      component={MenuScreen}
      options={{
        headerShown: false,
        gestureEnabled: false
      }}
    />
    <Stack.Screen 
      name="Cart" 
      component={CartScreen} 
      options={{ 
        headerShown: false
      }} 
    />
    <Stack.Screen 
      name="Payment" 
      component={PaymentScreen} 
      options={{ 
        headerShown: false
      }} 
    />
  </Stack.Navigator>
);

export default CustomerStack;
