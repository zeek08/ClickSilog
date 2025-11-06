# 🚀 Quick Start: Development Build for Firebase Testing

## The Solution: Expo Development Build

**Build once, debug efficiently!** 

A Development Build gives you:
- ✅ **Firebase Auth works** (unlike Expo Go)
- ✅ **Hot reloading** (unlike APK builds)
- ✅ **No rebuild needed** for code changes
- ✅ **Fast debugging** cycle

---

## ⚡ Quick Start (3 Steps)

### Step 1: Build Development Client (One Time - 15 min)

```bash
# Make sure you have EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build development client for Android
npm run build:android:dev

# OR for iOS
npm run build:ios:dev
```

### Step 2: Install on Device

1. Wait for build to complete (~15-20 minutes)
2. Download APK/IPA from EAS dashboard or email
3. Install on your device

### Step 3: Start Development Server

```bash
# Start with dev client mode
npm run start:dev
```

4. Open the **Development Client app** on your device (not Expo Go!)
5. Scan QR code - your app loads with Firebase Auth working! 🎉

---

## 📝 Daily Workflow

**Once dev client is installed:**

```bash
# 1. Start dev server
npm run start:dev

# 2. Open dev client app on device
# 3. Scan QR code
# 4. Make code changes - they appear instantly!
```

**No rebuild needed for:**
- ✅ Code changes
- ✅ UI changes
- ✅ New screens
- ✅ Most features

**Only rebuild when:**
- ⚠️ Adding new native modules
- ⚠️ Changing native config

---

## 🎯 What You Get

| Feature | Expo Go | Dev Build | APK Build |
|---------|---------|-----------|-----------|
| Firebase Auth | ❌ | ✅ | ✅ |
| Hot Reload | ✅ | ✅ | ❌ |
| Build Time | 0s | 15min (once) | 15min (each) |
| Debug Efficiency | ⚠️ | ✅ | ❌ |

---

## 🔧 Troubleshooting

### "Dev client not connecting"
```bash
# Make sure you're using dev client mode
npm run start:dev

# NOT regular Expo server
# npm start  # ❌ Won't work with dev client
```

### "Firebase Auth still not working"
1. Make sure you're using **Development Client app** (not Expo Go)
2. Check `USE_MOCKS: false` in `src/config/appConfig.js`
3. Rebuild dev client if needed

---

## 📚 Full Guide

See `DEVELOPMENT_BUILD_GUIDE.md` for complete documentation.

---

**Ready? Start now:**
```bash
npm run build:android:dev
```

