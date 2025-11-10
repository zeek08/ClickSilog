# Delete Xendit Functions from Firebase

The old Xendit functions are still deployed on Firebase even though they've been removed from the code. Follow these steps to delete them.

## Functions to Delete

1. `createXenditQRCode` (us-central1)
2. `handleXenditWebhook` (us-central1)

## Method 1: Delete via Firebase CLI (Recommended)

```bash
# Delete the Xendit functions
firebase functions:delete createXenditQRCode --region us-central1
firebase functions:delete handleXenditWebhook --region us-central1
```

## Method 2: Delete via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ClickSilog**
3. Navigate to **Functions** in the left sidebar
4. Find `createXenditQRCode` function
5. Click the three dots (⋮) next to the function
6. Select **Delete**
7. Confirm deletion
8. Repeat for `handleXenditWebhook`

## Method 3: Redeploy All Functions (Will Remove Undeployed Functions)

After removing Xendit functions from code, redeploying will remove them:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

This will deploy only the functions currently in your code, effectively removing the old Xendit functions.

## Verify Deletion

After deletion, verify the functions are gone:

```bash
firebase functions:list
```

You should only see:
- `createPaymentIntent`
- `createPaymentSource`
- `handlePayMongoWebhook`
- `updateOrderStatus`
- `cleanupOldOrders`
- `autoCancelExpiredPayments`
- `onOrderStatusChange`

## Important Notes

- **Backup**: Make sure you don't need these functions before deleting
- **Webhooks**: If Xendit webhooks are still configured, they will fail after deletion
- **Dependencies**: Check if any other services are calling these functions

