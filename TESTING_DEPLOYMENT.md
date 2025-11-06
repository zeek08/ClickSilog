# Testing Deployment Guide - ClickSilog

This guide provides instructions for deploying the ClickSilog app for testing using Expo Go or APK builds.

---

## Table of Contents

1. [Expo Go Testing](#expo-go-testing)
2. [APK Build for Android](#apk-build-for-android)
3. [Testing Checklist](#testing-checklist)
4. [Troubleshooting](#troubleshooting)

---

## Expo Go Testing

### Prerequisites

- Node.js 16+ installed
- Expo Go app installed on your Android/iOS device
- Same WiFi network for device and computer

### Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Expo Development Server**
   ```bash
   npm start
   # OR
   npm run start:clear  # If you encounter cache issues
   ```

3. **Connect Device**
   - **Option A: QR Code** (Recommended)
     - Open Expo Go app on your device
     - Scan the QR code displayed in terminal
     - App will load automatically
   
   - **Option B: Manual Connection**
     - Ensure device and computer are on same WiFi
     - In Expo Go app, tap "Enter URL manually"
     - Enter the URL shown in terminal (e.g., `exp://192.168.1.100:8081`)

4. **Development Features**
   - Hot reloading enabled by default
   - Press `r` in terminal to reload manually
   - Press `m` to open developer menu on device
   - Shake device to open developer menu

### Advantages
- ✅ Fast iteration and testing
- ✅ No build required
- ✅ Real-time updates
- ✅ Works on both iOS and Android

### Limitations
- ❌ Requires Expo Go app
- ❌ Some native features may not work
- ❌ Larger app size due to Expo runtime

---

## APK Build for Android

### Prerequisites

- Node.js 16+ installed
- EAS CLI installed globally: `npm install -g eas-cli`
- Expo account (free tier works)
- Android device or emulator

### Method 1: EAS Build (Recommended for Production)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS Build**
   ```bash
   eas build:configure
   ```
   This creates `eas.json` configuration file.

4. **Build APK for Testing**
   ```bash
   # Build APK (preview/profile)
   npm run build:android:apk
   
   # OR full build command
   eas build --platform android --profile preview
   ```

5. **Download and Install**
   - Build will be queued and processed (takes 10-20 minutes)
   - You'll receive a download link via email or terminal
   - Download the APK file
   - Enable "Install from Unknown Sources" on Android device
   - Install APK directly on device

### Method 2: Local Build (Requires Android Studio)

1. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install Android SDK and build tools

2. **Build Locally**
   ```bash
   npx expo run:android
   ```
   This will:
   - Generate native Android project
   - Build APK locally
   - Install on connected device/emulator

3. **Find APK**
   - APK location: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Copy to device and install

### APK Build Profiles

Create `eas.json` in project root:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Advantages
- ✅ Standalone app (no Expo Go required)
- ✅ Can be distributed easily
- ✅ Smaller app size
- ✅ Full native features support

### Limitations
- ⚠️ Requires build process (10-20 minutes for EAS)
- ⚠️ Requires Expo account for EAS builds
- ⚠️ Local builds require Android Studio setup

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] App starts without crashes
- [ ] All screens render correctly
- [ ] Navigation works between screens
- [ ] Theme toggle works (light/dark mode)
- [ ] Cart functionality works
- [ ] Payment flow works
- [ ] Real-time updates work (KDS module)
- [ ] Admin functions work (menu management, discounts)
- [ ] Discount codes apply correctly
- [ ] Receipt generation works

### User Testing Scenarios

#### Customer Module
- [ ] Browse menu with categories
- [ ] Add items to cart
- [ ] Customize items (add-ons, special instructions)
- [ ] Apply discount code
- [ ] Complete checkout with GCash
- [ ] Complete checkout with Cash

#### Cashier Module
- [ ] Place order for customer
- [ ] Enter customer name and table number
- [ ] Process payment
- [ ] View receipt

#### Kitchen Display System
- [ ] See new orders in real-time
- [ ] Update order status (Pending → Preparing → Ready)
- [ ] View order details and special instructions
- [ ] Cancel orders if needed

#### Admin Module
- [ ] Add/edit menu items
- [ ] Manage add-ons
- [ ] Create discount codes
- [ ] View sales reports
- [ ] Filter sales by date (today, week, month)

### Performance Testing

- [ ] App loads in < 3 seconds
- [ ] Navigation is smooth (no lag)
- [ ] Real-time updates appear within 1 second
- [ ] No memory leaks (test for 30+ minutes)
- [ ] Works on different screen sizes

### Device Testing

Test on:
- [ ] Android phone (small screen)
- [ ] Android phone (large screen)
- [ ] Android tablet (if available)
- [ ] iOS device (if available)

---

## Troubleshooting

### Expo Go Issues

**Problem: Can't connect to Expo server**
- Solution: Ensure device and computer are on same WiFi
- Solution: Check firewall settings
- Solution: Try using tunnel mode: `npx expo start --tunnel`

**Problem: App crashes on startup**
- Solution: Clear cache: `npm run start:clear`
- Solution: Check Firebase configuration in `src/config/firebase.js`
- Solution: Verify `appConfig.USE_MOCKS` setting

**Problem: Changes not reflecting**
- Solution: Press `r` in terminal to reload
- Solution: Shake device and tap "Reload"
- Solution: Restart Expo server

### APK Build Issues

**Problem: EAS build fails**
- Solution: Check `eas.json` configuration
- Solution: Verify `app.json` is valid
- Solution: Check Expo account quota (free tier has limits)

**Problem: APK won't install**
- Solution: Enable "Install from Unknown Sources" in Android settings
- Solution: Check APK signature
- Solution: Try uninstalling previous version first

**Problem: App crashes after installation**
- Solution: Check Firebase configuration
- Solution: Verify environment variables
- Solution: Check device logs: `adb logcat`

### General Issues

**Problem: Firebase connection errors**
- Solution: Verify Firebase credentials in `src/config/firebase.js`
- Solution: Check Firestore rules
- Solution: Ensure Firebase project is active

**Problem: Payment not working**
- Solution: Check PayMongo configuration
- Solution: Verify payment service is correctly set up
- Solution: Check if using mock mode (`USE_MOCKS: true`)

---

## Quick Start Commands

### For Quick Testing (Expo Go)
```bash
npm install
npm start
# Scan QR code with Expo Go app
```

### For APK Build (EAS)
```bash
npm install -g eas-cli
eas login
eas build:configure
npm run build:android:apk
# Wait for build, download APK, install on device
```

### For Local Build
```bash
npm install
npx expo run:android
# APK will be in android/app/build/outputs/apk/debug/
```

---

## Distribution Options

### Internal Testing
1. **Expo Go**: Share QR code or link
2. **APK**: Share APK file directly (Google Drive, email, etc.)
3. **EAS Update**: Use `eas update` for OTA updates

### External Testing
1. **TestFlight** (iOS): Submit to App Store Connect
2. **Google Play Internal Testing**: Upload APK to Play Console
3. **Direct APK Distribution**: Share APK download link

---

## Configuration Notes

### Mock Mode vs Real Mode

The app supports both mock and real modes:

**Mock Mode** (`USE_MOCKS: true` in `src/config/appConfig.js`):
- No Firebase connection required
- In-memory data storage
- Simulated payments
- Perfect for initial testing

**Real Mode** (`USE_MOCKS: false`):
- Requires Firebase setup
- Real database connection
- Actual PayMongo integration
- Production-ready

### Environment Variables

For production builds, ensure:
- Firebase credentials are configured
- PayMongo keys are set (if using payment)
- API endpoints are correct

---

## Testing Best Practices

1. **Test on Real Devices**: Emulators are great, but real devices catch more issues
2. **Test All User Roles**: Customer, Cashier, Kitchen, Admin
3. **Test Offline Scenarios**: What happens when connection is lost?
4. **Test Edge Cases**: Empty carts, invalid discount codes, etc.
5. **Performance Testing**: Test with many orders, large menu
6. **User Acceptance Testing**: Get feedback from actual users

---

## Support

For issues or questions:
1. Check the main README.md
2. Review FIREBASE_PAYMONGO_SETUP.md
3. Check TESTING.md for testing strategies
4. Review MANUAL_TESTING_CHECKLIST.md

---

**Last Updated**: $(date)
**Version**: 1.0.0

