import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CashierOrderingScreen from '../screens/cashier/CashierOrderingScreen';
import CashierDashboard from '../screens/cashier/CashierDashboard';
import CashierPaymentScreen from '../screens/cashier/CashierPaymentScreen';
import HeaderHomeButton from '../components/ui/HeaderHomeButton';

const Stack = createStackNavigator();

const CashierStack = () => (
  <Stack.Navigator
    initialRouteName="CashierOrdering"
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal'
    }}
  >
    <Stack.Screen 
      name="CashierOrdering" 
      component={CashierOrderingScreen} 
      options={{ 
        title: 'Cashier POS',
        gestureEnabled: false
      }} 
    />
    <Stack.Screen 
      name="Cashier" 
      component={CashierDashboard} 
      options={{ 
        title: 'Cashier',
        headerLeft: () => <HeaderHomeButton />
      }} 
    />
    <Stack.Screen 
      name="CashierPayment" 
      component={CashierPaymentScreen} 
      options={{ 
        title: 'Cash Payment',
        headerLeft: () => <HeaderHomeButton />
      }} 
    />
  </Stack.Navigator>
);

export default CashierStack;
