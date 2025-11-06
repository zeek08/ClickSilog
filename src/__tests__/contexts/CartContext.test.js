import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, useCart } from '../../contexts/CartContext';
import { createMockMenuItem, createMockAddOn } from '../utils/testHelpers';

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

describe('CartContext', () => {
  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const item = createMockMenuItem();
    
    act(() => {
      result.current.addToCart(item, { qty: 1 });
    });
    
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].name).toBe(item.name);
  });

  it('should update quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const item = createMockMenuItem();
    
    act(() => {
      result.current.addToCart(item, { qty: 1 });
    });
    
    act(() => {
      result.current.updateQty(item.id, 3);
    });
    
    expect(result.current.items[0].qty).toBe(3);
  });

  it('should calculate total correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const item1 = createMockMenuItem({ id: '1', price: 100 });
    const item2 = createMockMenuItem({ id: '2', price: 50 });
    
    act(() => {
      result.current.addToCart(item1, { qty: 2 });
      result.current.addToCart(item2, { qty: 1 });
    });
    
    expect(result.current.total).toBe(250);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const item = createMockMenuItem();
    
    act(() => {
      result.current.addToCart(item, { qty: 1 });
    });
    
    expect(result.current.items.length).toBe(1);
    
    act(() => {
      result.current.removeFromCart(item.id);
    });
    
    expect(result.current.items.length).toBe(0);
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const item1 = createMockMenuItem({ id: '1' });
    const item2 = createMockMenuItem({ id: '2' });
    
    act(() => {
      result.current.addToCart(item1, { qty: 1 });
      result.current.addToCart(item2, { qty: 1 });
    });
    
    expect(result.current.items.length).toBe(2);
    
    act(() => {
      result.current.clearCart();
    });
    
    expect(result.current.items.length).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('should handle add-ons in total calculation', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const item = createMockMenuItem({ price: 100 });
    const addOn = createMockAddOn({ price: 10 });
    
    act(() => {
      result.current.addToCart(item, { 
        qty: 1, 
        selectedAddOns: [addOn] 
      });
    });
    
    expect(result.current.total).toBeGreaterThan(100);
  });
});

