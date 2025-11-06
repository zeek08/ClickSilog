import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { CartProvider } from '../../contexts/CartContext';
import { AuthProvider } from '../../contexts/AuthContext';

/**
 * Custom render function that includes all providers
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    themeMode = 'light',
    userRole = 'customer',
    cartItems = [],
    ...renderOptions
  } = options;

  const AllTheProviders = ({ children }) => (
    <ThemeProvider initialMode={themeMode}>
      <AuthProvider initialRole={userRole}>
        <CartProvider initialItems={cartItems}>
          {children}
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

/**
 * Mock navigation object
 */
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  dispatch: jest.fn(),
  getState: jest.fn(() => ({
    routes: [{ name: 'Home' }],
    index: 0,
  })),
  getParent: jest.fn(() => null),
  canGoBack: jest.fn(() => false),
};

/**
 * Mock route object
 */
export const mockRoute = {
  params: {},
  key: 'test-route',
  name: 'TestScreen',
};

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Create mock menu item
 */
export const createMockMenuItem = (overrides = {}) => ({
  id: 'test-item-1',
  name: 'Test Item',
  price: 100,
  categoryId: 'silog_meals',
  available: true,
  description: 'Test description',
  ...overrides,
});

/**
 * Create mock add-on
 */
export const createMockAddOn = (overrides = {}) => ({
  id: 'test-addon-1',
  name: 'Test Add-on',
  price: 10,
  category: 'extra',
  available: true,
  ...overrides,
});

/**
 * Create mock order
 */
export const createMockOrder = (overrides = {}) => ({
  id: 'test-order-1',
  items: [],
  total: 0,
  status: 'pending',
  timestamp: new Date().toISOString(),
  paymentMethod: 'cash',
  ...overrides,
});

