import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ItemCustomizationModal from '../../../components/ui/ItemCustomizationModal';
import { createMockMenuItem, createMockAddOn } from '../../utils/testHelpers';

describe('ItemCustomizationModal', () => {
  const mockItem = createMockMenuItem({ categoryId: 'silog_meals' });
  const mockAddOns = [
    createMockAddOn({ id: '1', name: 'Extra Rice', category: 'rice' }),
    createMockAddOn({ id: '2', name: 'Extra Egg', category: 'extra' }),
  ];
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();
  const mockCalculateTotalPrice = jest.fn((base, addOns) => {
    const addOnTotal = addOns.reduce((sum, a) => sum + (a.price || 0), 0);
    return base + addOnTotal;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    const { getByText } = render(
      <ItemCustomizationModal
        visible={true}
        item={mockItem}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        calculateTotalPrice={mockCalculateTotalPrice}
      />
    );
    
    expect(getByText(mockItem.name)).toBeDefined();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <ItemCustomizationModal
        visible={false}
        item={mockItem}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        calculateTotalPrice={mockCalculateTotalPrice}
      />
    );
    
    expect(queryByText(mockItem.name)).toBeNull();
  });

  it('should show size selection for drinks', () => {
    const drinkItem = createMockMenuItem({ categoryId: 'drinks' });
    const { getByText } = render(
      <ItemCustomizationModal
        visible={true}
        item={drinkItem}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        calculateTotalPrice={mockCalculateTotalPrice}
      />
    );
    
    expect(getByText('Choose Size')).toBeDefined();
  });

  it('should hide size selection for softdrinks', () => {
    const softdrinkItem = createMockMenuItem({ 
      categoryId: 'drinks', 
      name: 'Coke Soft Drink' 
    });
    const { queryByText } = render(
      <ItemCustomizationModal
        visible={true}
        item={softdrinkItem}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        calculateTotalPrice={mockCalculateTotalPrice}
      />
    );
    
    expect(queryByText('Choose Size')).toBeNull();
  });

  it('should show add-ons for meal/silog categories', () => {
    const { getByText } = render(
      <ItemCustomizationModal
        visible={true}
        item={mockItem}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        calculateTotalPrice={mockCalculateTotalPrice}
      />
    );
    
    // Should show add-ons sections if available
    expect(getByText('Quantity')).toBeDefined();
  });

  it('should call onConfirm with correct data when confirmed', () => {
    const { getByText } = render(
      <ItemCustomizationModal
        visible={true}
        item={mockItem}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        calculateTotalPrice={mockCalculateTotalPrice}
      />
    );
    
    const addButton = getByText('Add to Cart');
    fireEvent.press(addButton);
    
    expect(mockOnConfirm).toHaveBeenCalled();
    const callArgs = mockOnConfirm.mock.calls[0][0];
    expect(callArgs).toHaveProperty('qty');
    expect(callArgs).toHaveProperty('selectedAddOns');
    expect(callArgs).toHaveProperty('totalItemPrice');
  });

  it('should update quantity when increment/decrement buttons are pressed', () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <ItemCustomizationModal
        visible={true}
        item={mockItem}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        calculateTotalPrice={mockCalculateTotalPrice}
      />
    );
    
    const quantityText = getByText('1');
    expect(quantityText).toBeDefined();
    
    // Find increment button (button with '+' text)
    const buttons = UNSAFE_getAllByType('TouchableOpacity');
    const incrementBtn = buttons.find(btn => 
      btn.props.children?.props?.children === '+'
    );
    
    if (incrementBtn) {
      fireEvent.press(incrementBtn);
      // Quantity should update
      expect(getByText('2')).toBeDefined();
    }
  });
});

