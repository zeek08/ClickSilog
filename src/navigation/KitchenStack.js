import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import KDSDashboard from '../screens/kitchen/KDSDashboard';

const Stack = createStackNavigator();

const KitchenStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="KDS" component={KDSDashboard} />
  </Stack.Navigator>
);

export default KitchenStack;

