import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AnimatedButton from '../../../components/ui/AnimatedButton';

describe('AnimatedButton Component', () => {
  it('should render without crashing', () => {
    const { getByTestId } = render(
      <AnimatedButton onPress={jest.fn()}>
        <Text>Test Button</Text>
      </AnimatedButton>
    );
    expect(getByTestId).toBeDefined();
  });

  it('should call onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <AnimatedButton onPress={onPressMock}>
        <Text>Test Button</Text>
      </AnimatedButton>
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <AnimatedButton onPress={onPressMock} disabled={true}>
        <Text>Test Button</Text>
      </AnimatedButton>
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: '#FF0000', width: 100 };
    const { UNSAFE_getByType } = render(
      <AnimatedButton onPress={jest.fn()} style={customStyle}>
        <Text>Test</Text>
      </AnimatedButton>
    );
    
    const button = UNSAFE_getByType('AnimatedTouchable');
    expect(button.props.style).toContainEqual(customStyle);
  });

  it('should handle press in/out animations', () => {
    const { getByText } = render(
      <AnimatedButton onPress={jest.fn()}>
        <Text>Test Button</Text>
      </AnimatedButton>
    );
    
    const button = getByText('Test Button');
    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');
    // Animation should trigger without errors
    expect(button).toBeDefined();
  });
});

