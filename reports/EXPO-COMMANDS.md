# Expo Commands Reference

## Important: This is an Expo Project

This project uses **Expo**, not pure React Native CLI. Use Expo commands instead of React Native CLI commands.

## Correct Commands for This Project

### Start Development Server
```bash
# Recommended
npm start
# or
expo start

# Clear cache
npm start -- --clear
# or
expo start --clear
```

### Run on Device/Emulator
```bash
# Using Expo CLI
npx expo run:android  # Android
npx expo run:ios      # iOS

# Using npm scripts
npm run android
npm run ios
```

### Build for Production
```bash
# Using Expo Application Services (EAS)
eas build --platform android
eas build --platform ios

# Or build locally
npx expo run:android --variant release
npx expo run:ios --configuration Release
```

## Wrong Commands (Don't Use)

These are React Native CLI commands and will show warnings in Expo projects:

```bash
# ❌ Don't use these
npx react-native start
npx react-native start --reset-cache
npx react-native run-android
npx react-native run-ios
```

## Why the Warning Appears

When you run `npx react-native start`, React Native CLI looks for `@react-native-community/cli` which isn't needed in Expo projects. Expo has its own CLI that handles everything.

## Solution

Just use Expo commands:
- ✅ `npm start` or `expo start`
- ✅ `npx expo run:android` or `npm run android`
- ✅ `npx expo run:ios` or `npm run ios`

The warning is harmless but indicates you're using the wrong CLI. Use Expo commands for this project.


