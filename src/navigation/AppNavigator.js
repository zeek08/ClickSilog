import React, { useContext, useEffect, useRef } from 'react';
import { BackHandler, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CustomerStack from './CustomerStack';
import KitchenStack from './KitchenStack';
import CashierStack from './CashierStack';
import AdminStack from './AdminStack';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import TableNumberScreen from '../screens/TableNumberScreen';
import DeveloperScreenSelection from '../screens/DeveloperScreenSelection';
import { appConfig } from '../config/appConfig';

const RootStack = createStackNavigator();

const AppNavigator = () => {
  const authContext = useContext(AuthContext);
  const navigationRef = useRef(null);
  const { theme } = useTheme();

  // Safely destructure with defaults
  const userRole = authContext?.userRole || null;
  const loading = authContext?.loading ?? true;
  const user = authContext?.user || null;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme?.colors?.background || '#FAFAFA' }}>
        <ActivityIndicator size="large" color={theme?.colors?.primary || '#FFD54F'} />
      </View>
    );
  }

  // Determine which stack to show based on role
  let Component = CustomerStack;
  if (userRole === 'kitchen') Component = KitchenStack;
  if (userRole === 'cashier') Component = CashierStack;
  if (userRole === 'admin') Component = AdminStack;
  // Developer role shows DeveloperScreenSelection instead of a stack

  // In mock mode, show HomeScreen for role selection
  // In production, show login screens if not authenticated
  const isAuthenticated = user !== null;
  const USE_MOCKS = appConfig?.USE_MOCKS ?? false;
  const showHomeScreen = USE_MOCKS && !isAuthenticated;
  const showLogin = !USE_MOCKS && !isAuthenticated;
  const showDeveloperScreen = isAuthenticated && userRole === 'developer';

  // Determine initial route based on authentication and role
  const getInitialRoute = () => {
    if (showHomeScreen) return 'Home';
    if (showLogin) return 'Home'; // Always start at Home for role selection
    if (showDeveloperScreen) return 'DeveloperScreenSelection';
    if (isAuthenticated && userRole) return 'Main'; // User is authenticated, go to their stack
    return 'Home'; // Default fallback
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme?.colors?.background || '#FAFAFA' }}>
      <NavigationContainer
        key={`${userRole || 'default'}-${isAuthenticated ? 'auth' : 'noauth'}`}
        ref={(ref) => {
          navigationRef.current = ref;
          if (ref) {
            global.navigationRef = ref;
          }
        }}
        theme={{
          dark: false,
          colors: {
            primary: theme?.colors?.primary || '#FFD54F',
            background: theme?.colors?.background || '#FAFAFA',
            card: theme?.colors?.surface || '#FFFFFF',
            text: theme?.colors?.text || '#1E1E1E',
            border: theme?.colors?.border || '#E0E0E0',
            notification: theme?.colors?.primary || '#FFD54F',
          },
        }}
      >
        <RootStack.Navigator 
          screenOptions={{ 
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            cardStyle: { backgroundColor: theme?.colors?.background || '#FAFAFA' },
          }} 
          initialRouteName={getInitialRoute()}
        >
        {/* Home screen for role selection - always available */}
          <RootStack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
            gestureEnabled: false,
            title: 'Select Station'
            }}
          />
        {/* Login and TableNumber screens - always available for navigation */}
            <RootStack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{
                gestureEnabled: false,
                title: 'Login'
              }}
            />
            <RootStack.Screen 
              name="TableNumber" 
              component={TableNumberScreen}
              options={{
                gestureEnabled: true,
                title: 'Table Number'
              }}
            />
        {/* Always register DeveloperScreenSelection so it's available when needed */}
        <RootStack.Screen 
          name="DeveloperScreenSelection" 
          component={DeveloperScreenSelection}
          options={{
            gestureEnabled: false,
            title: 'Developer Mode'
          }}
        />
        {/* Main stack - only show when authenticated */}
        {isAuthenticated && userRole && (
        <RootStack.Screen 
          name="Main" 
          component={Component}
          options={{
            gestureEnabled: true,
            gestureDirection: 'horizontal'
          }}
        />
        )}
        </RootStack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default AppNavigator;
