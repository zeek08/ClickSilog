# Integration Guide

This app supports Mock Mode (no external services) and Real Mode (Firebase + PayMongo).

## 1) Firebase Setup

- Enable Authentication (Email/Password, Google optional)
- Enable Firestore and Storage
- Copy your config from Firebase console
- Update `src/config/appConfig.js` with your Firebase keys
- Set `USE_MOCKS: false`

### Install (Expo SDK 49 compatible)

```
npx expo install firebase
```

### Security Rules

- Firestore: deploy `firestore.rules`
- Storage: deploy `storage.rules`

```
firebase deploy --only firestore:rules,storage:rules
```

## 2) PayMongo Setup (via your backend)

Never call PayMongo secret key from the app. Expose minimal endpoints on your server:

- POST `/payments/intent` – creates a payment intent/charge
- Request: `{ amount: number, currency: 'PHP', description?: string }`
- Response: `{ id, status, amount, currency }`

Update `paymentService` to call your backend in Real Mode.

## 3) Switching Modes

Edit `src/config/appConfig.js`:

```
export const appConfig = {
  USE_MOCKS: false,
  firebase: { ... },
  paymongo: { publicKey: 'pm_public_...', secretKey: 'pm_secret_...' }
};
```

- Mock Mode: generates in-memory data; payments always succeed
- Real Mode: uses Firebase services and your backend for PayMongo

## 4) Add-ons Management

- In Mock Mode, add-ons (`add_ons`) and mappings (`menu_addons`) are pre-seeded.
- In Admin → use "Manage Add-ons" to create/toggle/delete add-ons.
- In Admin → use "Menu Add-ons" to link/unlink add-ons per menu item.
- When moving to Real Mode, create the same collections in Firestore and manage via Admin screens or seed with a script.

