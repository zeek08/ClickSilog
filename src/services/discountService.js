import { firestoreService } from './firestoreService';

export const discountService = {
  /**
   * Get all active discounts
   */
  getActiveDiscounts: async () => {
    const discounts = await firestoreService.getCollectionOnce('discounts', [
      ['active', '==', true]
    ]);
    return discounts.filter(d => discountService.isDiscountValid(d));
  },

  /**
   * Get discount by code
   */
  getDiscountByCode: async (code) => {
    const discounts = await firestoreService.getCollectionOnce('discounts', [
      ['code', '==', code.toUpperCase()],
      ['active', '==', true]
    ]);
    const discount = discounts[0];
    if (!discount) return null;
    return discountService.isDiscountValid(discount) ? discount : null;
  },

  /**
   * Check if discount is valid (not expired, active)
   */
  isDiscountValid: (discount) => {
    if (!discount || !discount.active) return false;
    const now = new Date();
    if (discount.validFrom && new Date(discount.validFrom) > now) return false;
    if (discount.validUntil && new Date(discount.validUntil) < now) return false;
    return true;
  },

  /**
   * Calculate discount amount
   */
  calculateDiscount: (discount, subtotal) => {
    if (!discount || subtotal <= 0) return 0;
    
    // Check minimum order
    if (discount.minOrder && subtotal < discount.minOrder) return 0;
    
    let discountAmount = 0;
    
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
      // Apply maximum discount if set
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else if (discount.type === 'fixed') {
      discountAmount = discount.value;
      // Ensure discount doesn't exceed subtotal
      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }
    }
    
    return Math.max(0, discountAmount);
  },

  /**
   * Apply discount to order
   */
  applyDiscount: (discount, subtotal) => {
    const discountAmount = discountService.calculateDiscount(discount, subtotal);
    const finalTotal = subtotal - discountAmount;
    return {
      subtotal,
      discountAmount,
      discountCode: discount.code,
      discountName: discount.name,
      finalTotal: Math.max(0, finalTotal)
    };
  }
};

