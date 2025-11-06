import React from 'react';
import { render } from '@testing-library/react-native';
import Icon from '../../../components/ui/Icon';

describe('Icon Component', () => {
  it('should render without crashing', () => {
    const { getByTestId } = render(
      <Icon name="cart" library="ionicons" size={24} color="#000000" />
    );
    expect(getByTestId).toBeDefined();
  });

  it('should use default size when not provided', () => {
    const { UNSAFE_getByType } = render(
      <Icon name="cart" library="ionicons" />
    );
    const icon = UNSAFE_getByType('Ionicons');
    expect(icon.props.size).toBe(24);
  });

  it('should use default color when not provided', () => {
    const { UNSAFE_getByType } = render(
      <Icon name="cart" library="ionicons" />
    );
    const icon = UNSAFE_getByType('Ionicons');
    expect(icon.props.color).toBe('#111827');
  });

  it('should render Ionicons by default', () => {
    const { UNSAFE_getByType } = render(
      <Icon name="cart" />
    );
    expect(UNSAFE_getByType('Ionicons')).toBeDefined();
  });

  it('should render MaterialCommunityIcons when specified', () => {
    const { UNSAFE_getByType } = render(
      <Icon name="cart" library="material" />
    );
    expect(UNSAFE_getByType('MaterialCommunityIcons')).toBeDefined();
  });

  it('should have transparent background by default', () => {
    const { UNSAFE_getByType } = render(
      <Icon name="cart" library="ionicons" />
    );
    const icon = UNSAFE_getByType('Ionicons');
    const style = Array.isArray(icon.props.style) 
      ? icon.props.style[0] 
      : icon.props.style;
    expect(style?.backgroundColor).toBe('transparent');
  });

  it('should allow custom backgroundColor override', () => {
    const { UNSAFE_getByType } = render(
      <Icon name="cart" library="ionicons" style={{ backgroundColor: '#FFFFFF' }} />
    );
    const icon = UNSAFE_getByType('Ionicons');
    const style = Array.isArray(icon.props.style) 
      ? icon.props.style.find(s => s.backgroundColor === '#FFFFFF')
      : icon.props.style;
    expect(style?.backgroundColor).toBe('#FFFFFF');
  });
});

