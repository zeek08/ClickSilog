# Production Build Checklist

## ✅ Pre-Build Checks

### Code Quality
- ✅ **Linting**: No errors in app code
- ✅ **Functions**: No errors in Firebase Functions
- ✅ **Dependencies**: All packages installed

### Configuration
- ✅ **EAS Config**: Production profile configured
- ✅ **App Config**: Production settings verified
- ✅ **Firebase**: Production project configured
- ✅ **PayMongo**: Live API keys configured

### Environment Variables
- ✅ **Firebase**: Configured in appConfig.js
- ✅ **PayMongo**: Live public key configured
- ✅ **Functions**: Live secret key configured

### Build Configuration
- ✅ **EAS Build**: Production profile ready
- ✅ **Android**: APK build type configured
- ✅ **Version**: 1.0.0 (versionCode: 1)

## 🚀 Build Commands

### Production APK Build
```bash
eas build --platform android --profile production
```

### Preview APK Build (for testing)
```bash
eas build --platform android --profile preview
```

## 📋 Post-Build Checklist

After build completes:
- [ ] Download APK from EAS dashboard
- [ ] Test on physical device
- [ ] Verify payment flow works
- [ ] Check webhook configuration
- [ ] Test all features

## ⚠️ Important Notes

1. **PayMongo Live Keys**: Make sure live keys are configured
2. **Webhook URL**: Verify webhook URL is correct in PayMongo Dashboard
3. **Firebase**: Ensure production Firebase project is active
4. **Testing**: Test thoroughly before releasing

## 🔒 Security Checklist

- ✅ **API Keys**: Not hardcoded in source code
- ✅ **Secrets**: Stored in environment variables
- ✅ **Webhooks**: Signature verification enabled
- ✅ **Firestore**: Security rules configured

