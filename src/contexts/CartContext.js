import React, { createContext, useContext, useMemo, useState } from 'react';
import { discountService } from '../services/discountService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(null);
  const [discountCode, setDiscountCode] = useState('');

  const calculateTotalPrice = (basePrice, selectedAddOns = []) => {
    const addOnTotal = selectedAddOns.reduce((sum, a) => sum + (a.price || 0), 0);
    return basePrice + addOnTotal;
  };

  const addToCart = (item, { qty = 1, selectedAddOns = [], specialInstructions = '' } = {}) => {
    setItems((prev) => {
      // Items are unique by id + selected add-ons + instructions
      const signature = JSON.stringify({ addOns: selectedAddOns.map((a) => a.id).sort(), specialInstructions });
      const idx = prev.findIndex((p) => p.id === item.id && JSON.stringify({ addOns: (p.addOns || []).map((a) => a.id).sort(), specialInstructions: p.specialInstructions || '' }) === signature);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      const totalItemPrice = calculateTotalPrice(item.price || 0, selectedAddOns);
      return [...prev, { ...item, qty, addOns: selectedAddOns, specialInstructions, totalItemPrice }];
    });
  };

  const removeFromCart = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQty = (id, qty) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)));
  };

  const clearCart = () => {
    setItems([]);
    setDiscount(null);
    setDiscountCode('');
  };

  const applyDiscountCode = async (code) => {
    try {
      const discountData = await discountService.getDiscountByCode(code);
      if (!discountData) {
        setDiscount(null);
        setDiscountCode('');
        return { success: false, error: 'Invalid discount code' };
      }
      setDiscount(discountData);
      setDiscountCode(code.toUpperCase());
      return { success: true, discount: discountData };
    } catch (error) {
      setDiscount(null);
      setDiscountCode('');
      return { success: false, error: error.message || 'Failed to apply discount' };
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountCode('');
  };

  const subtotal = useMemo(() => items.reduce((sum, i) => {
    const base = typeof i.totalItemPrice === 'number' ? i.totalItemPrice : calculateTotalPrice(i.price || 0, i.addOns || []);
    return sum + base * i.qty;
  }, 0), [items]);

  const discountCalculation = useMemo(() => {
    if (!discount || subtotal <= 0) {
      return { discountAmount: 0, finalTotal: subtotal };
    }
    return discountService.applyDiscount(discount, subtotal);
  }, [discount, subtotal]);

  const total = useMemo(() => discountCalculation.finalTotal, [discountCalculation]);

  const value = { 
    items, 
    addToCart, 
    removeFromCart, 
    updateQty, 
    clearCart, 
    total, 
    subtotal,
    discount,
    discountCode,
    discountAmount: discountCalculation.discountAmount,
    applyDiscountCode,
    removeDiscount,
    calculateTotalPrice 
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
