import React, { useContext, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import CustomerStack from './CustomerStack';
import KitchenStack from './KitchenStack';
import CashierStack from './CashierStack';
import AdminStack from './AdminStack';
import HomeScreen from '../screens/HomeScreen';
import { appConfig } from '../config/appConfig';

const RootStack = createStackNavigator();

const AppNavigator = () => {
  const { userRole, loading } = useContext(AuthContext);
  const navigationRef = useRef(null);

  // Note: Removed auto-redirect for cashier to prevent navigation loops
  // Cashier users will navigate normally through the app
  // If redirect is needed on login, it should be handled in AuthContext's auth state change handler

  if (loading) return null;

  let Component = CustomerStack;
  if (userRole === 'kitchen') Component = KitchenStack;
  if (userRole === 'cashier') Component = CashierStack;
  if (userRole === 'admin') Component = AdminStack;

  const initialRoute = appConfig.USE_MOCKS ? 'Home' : 'Main';

  return (
    <NavigationContainer
      key={(userRole || 'default') + initialRoute}
      ref={(ref) => {
        navigationRef.current = ref;
        if (ref) {
          global.navigationRef = ref;
        }
      }}
    >
      <RootStack.Navigator 
        screenOptions={{ 
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }} 
        initialRouteName={initialRoute}
      >
        {appConfig.USE_MOCKS && (
          <RootStack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              gestureEnabled: false
            }}
          />
        )}
        <RootStack.Screen 
          name="Main" 
          component={Component}
          options={{
            gestureEnabled: true,
            gestureDirection: 'horizontal'
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
