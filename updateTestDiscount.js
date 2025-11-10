/**
 * Quick script to update TEST discount to make total ₱1.00
 * Run this in your app's console or create a temporary screen
 */

import { firestoreService } from './src/services/firestoreService';

// Update TEST discount to fixed amount of ₱59.00
// This will make a ₱60.00 item total to ₱1.00
const updateTestDiscount = async () => {
  try {
    // Find the TEST discount
    const discounts = await firestoreService.getCollectionOnce('discounts', [
      ['code', '==', 'TEST'],
      ['active', '==', true]
    ]);

    if (discounts.length === 0) {
      console.log('TEST discount not found. Creating new one...');
      // Create new discount
      await firestoreService.upsertDocument('discounts', 'test_discount_1', {
        name: 'Test Discount',
        code: 'TEST',
        type: 'fixed', // Changed from 'percentage' to 'fixed'
        value: 59.00, // Fixed discount of ₱59.00
        minOrder: 0,
        maxDiscount: null,
        active: true,
        validFrom: null,
        validUntil: null,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      console.log('✅ Created TEST discount with fixed ₱59.00 discount');
    } else {
      // Update existing discount
      const discount = discounts[0];
      await firestoreService.updateDocument('discounts', discount.id, {
        type: 'fixed', // Changed from 'percentage' to 'fixed'
        value: 59.00, // Fixed discount of ₱59.00
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Updated TEST discount to fixed ₱59.00 discount');
    }

    console.log('Now a ₱60.00 item will total to ₱1.00');
  } catch (error) {
    console.error('Error updating discount:', error);
  }
};

// Export for use
export default updateTestDiscount;

