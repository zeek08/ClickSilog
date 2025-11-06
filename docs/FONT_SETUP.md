# Custom Font Setup Guide

To use Poppins font (recommended for modern food app aesthetic), follow these steps:

## Installation

1. Install required packages:
```bash
npx expo install expo-font @expo-google-fonts/poppins
```

2. Update `src/config/theme.js`:
```javascript
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

export const fonts = {
  regular: Poppins_400Regular,
  medium: Poppins_500Medium,
  semiBold: Poppins_600SemiBold,
  bold: Poppins_700Bold
};
```

3. Load fonts in `App.js`:
```javascript
import { useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <SplashScreen />; // Or a loading component
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

4. Use fonts in components via StyleSheet:
```javascript
fontFamily: fonts.regular
```

**Note**: Currently using system fonts as fallback. The app works perfectly without custom fonts, but Poppins will give it a more polished, modern look.

