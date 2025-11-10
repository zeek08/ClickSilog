import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

export const AuthContext = createContext({
  user: null,
  userRole: null,
  loading: true,
  login: () => {},
  logout: () => {},
  setRole: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    let loadingCompleted = false;
    
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted && currentUser) {
          setUser(currentUser);
          setUserRole(currentUser.role || 'customer');
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        if (isMounted) {
          loadingCompleted = true;
          setLoading(false);
          // Clear timeout if it's still pending
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        }
      }
    };

    // Set a timeout to ensure loading completes even if getCurrentUser hangs
    timeoutId = setTimeout(() => {
      if (isMounted && !loadingCompleted) {
        // Only show warning if loading hasn't completed yet
        console.warn('AuthContext: Loading timeout, setting loading to false');
        setLoading(false);
        loadingCompleted = true;
      }
    }, 3000); // 3 second timeout - increased to reduce false positives

    loadUser();
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const login = async (userData) => {
    setUser(userData);
    setUserRole(userData.role || 'customer');
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setUserRole(null);
  };

  const setRole = async (role) => {
    setUserRole(role);
    await AsyncStorage.setItem('userRole', role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      loading, 
      login, 
      logout, 
      setRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
