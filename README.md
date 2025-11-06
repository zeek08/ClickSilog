# ClickSiLogApp

A React Native (Expo) restaurant app with Customer, Kitchen, Cashier, and Admin modules. Works out-of-the-box in Mock Mode (no Firebase/PayMongo required) and can be switched to Real Mode once integrations are configured.

## Quick Start (Mock Mode)

1. Install tools: Node.js 16+, Expo CLI
2. Install deps:

```
npm install
```

3. Start the app:

```
npm start
```

This runs fully without Firebase/PayMongo. Data is served from an in-memory mock. Payments are simulated as successful.

## Switching to Real Integrations

Edit `src/config/appConfig.js`:

```
export const appConfig = {
  USE_MOCKS: false,
  firebase: { ... },
  paymongo: { ... }
};
```

Then follow `docs/INTEGRATION.md`.

## Scripts
- `npm start` – Expo dev server
- `npx expo run:android` – build/run on Android
- `eas build --platform android` – production build

## Structure
- `src/config/appConfig.js` – toggle mock/real and keys
- `src/services/*` – service layer with mock fallbacks
- `src/contexts/AuthContext.js` – uses `authService` (mock aware)
- `src/hooks/useRealTime.js` – real-time list hook (Firestore or mock)
- `firestore.rules`, `storage.rules` – security rules

