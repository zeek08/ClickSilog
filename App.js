import React from 'react';
import { useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import ErrorBoundary from './src/components/ui/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import errorLogger from './src/utils/errorLogger';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#FFD54F" />
      </View>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorLogger.logError(error, {
          componentStack: errorInfo.componentStack,
          appLevel: true,
        });
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AppNavigator />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
