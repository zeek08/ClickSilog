# Update TEST Discount to ₱1.00 Total

## Quick Fix Options

### Option 1: Update via Admin Panel (Easiest)

1. **Open your app** and log in as Admin
2. **Go to Admin Panel** → **Discount Manager**
3. **Find the "TEST" discount** (or "Test99" discount)
4. **Edit the discount:**
   - Change **Type** from "Percentage" to **"Fixed Amount"**
   - Change **Value** from `99` to **`59.00`**
   - Save

This will make a ₱60.00 item total to **₱1.00** (60 - 59 = 1)

### Option 2: Update via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ClickSilog**
3. Go to **Firestore Database**
4. Find the **`discounts`** collection
5. Find the document with code **"TEST"** or **"TEST99"**
6. **Update the document:**
   - Change `type` from `"percentage"` to `"fixed"`
   - Change `value` from `99` to `59.00`
   - Save

### Option 3: Update via Code (Quick Script)

If you want to update it programmatically, you can run this in your app:

```javascript
import { firestoreService } from './src/services/firestoreService';

const updateTestDiscount = async () => {
  const discounts = await firestoreService.getCollectionOnce('discounts', [
    ['code', '==', 'TEST'],
    ['active', '==', true]
  ]);

  if (discounts.length > 0) {
    const discount = discounts[0];
    await firestoreService.updateDocument('discounts', discount.id, {
      type: 'fixed',
      value: 59.00,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Updated TEST discount');
  }
};
```

## Result

After updating:
- **Item:** ₱60.00
- **Discount:** ₱59.00 (fixed)
- **Total:** **₱1.00** ✅

Perfect for testing PayMongo payments!

