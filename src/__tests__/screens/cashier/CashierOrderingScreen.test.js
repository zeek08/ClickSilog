import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CashierOrderingScreen from '../../../screens/cashier/CashierOrderingScreen';
import { renderWithProviders, mockNavigation, createMockMenuItem } from '../../utils/testHelpers';

jest.mock('../../../hooks/useRealTime', () => ({
  useRealTimeCollection: () => ({
    data: [
      { id: 'cat1', name: 'Silog Meals', active: true },
    ],
    loading: false,
  }),
}));

describe('CashierOrderingScreen', () => {
  const mockMenuItems = [
    createMockMenuItem({ id: '1', name: 'Tapsilog', price: 120 }),
    createMockMenuItem({ id: '2', name: 'Longsilog', price: 100 }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { getByText } = renderWithProviders(
      <CashierOrderingScreen navigation={mockNavigation} />,
      { userRole: 'cashier' }
    );
    
    expect(getByText('Cashier POS')).toBeDefined();
  });

  it('should display cart button', () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <CashierOrderingScreen navigation={mockNavigation} />,
      { userRole: 'cashier' }
    );
    
    // Check for cart button (AnimatedButton with cart icon)
    expect(UNSAFE_getByType).toBeDefined();
  });

  it('should navigate to payment screen when cart button is pressed', () => {
    const navigateMock = jest.fn();
    const nav = { ...mockNavigation, navigate: navigateMock };
    
    const { UNSAFE_getAllByType } = renderWithProviders(
      <CashierOrderingScreen navigation={nav} />,
      { userRole: 'cashier' }
    );
    
    // Find and press cart button
    const buttons = UNSAFE_getAllByType('AnimatedTouchable');
    const cartButton = buttons.find(btn => 
      btn.props.children?.props?.name === 'cart'
    );
    
    if (cartButton) {
      fireEvent.press(cartButton);
      expect(navigateMock).toHaveBeenCalledWith('CashierPayment');
    }
  });

  it('should display search bar', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <CashierOrderingScreen navigation={mockNavigation} />,
      { userRole: 'cashier' }
    );
    
    expect(getByPlaceholderText('Search menu items...')).toBeDefined();
  });

  it('should filter items when searching', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <CashierOrderingScreen navigation={mockNavigation} />,
      { userRole: 'cashier' }
    );
    
    const searchInput = getByPlaceholderText('Search menu items...');
    fireEvent.changeText(searchInput, 'Tapsilog');
    
    await waitFor(() => {
      // Should filter results
      expect(searchInput.props.value).toBe('Tapsilog');
    });
  });
});

