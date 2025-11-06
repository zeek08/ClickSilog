import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { appConfig } from '../config/appConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        const role = await authService.getUserRole(currentUser.uid);
        setUser(currentUser);
        setUserRole(role);
        await AsyncStorage.setItem('userToken', currentUser.uid);
        await AsyncStorage.setItem('userRole', role || 'customer');
        
        // Auto-redirect cashier users to Home screen (if USE_MOCKS is enabled)
        if (role === 'cashier' && appConfig.USE_MOCKS && global.navigationRef?.isReady()) {
          setTimeout(() => {
            global.navigationRef?.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }, 100);
        }
      } else {
        setUser(null);
        setUserRole(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userRole');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const setRole = async (role) => {
    setUserRole(role);
    await AsyncStorage.setItem('userRole', role);
    authService.__setMockRole && authService.__setMockRole(role);
    
    // Note: Removed auto-redirect for cashier to prevent navigation loops
    // Navigation is handled directly in HomeScreen when role is selected
    // AppNavigator will handle redirects when needed (e.g., on login)
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};
