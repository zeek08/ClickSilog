import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TextInput, Platform } from 'react-native';
import { useKeyboardFocus } from '../../contexts/KeyboardFocusContext';
import { useRoute } from '@react-navigation/native';

/**
 * FocusableTextInput - A TextInput wrapper that automatically scrolls to focus
 * Usage: Replace TextInput with FocusableTextInput for automatic scroll-to-focus
 */
const FocusableTextInput = forwardRef((props, ref) => {
  const {
    onFocus,
    onBlur,
    inputId,
    skipScroll = false,
    multiline = false,
    ...textInputProps
  } = props;

  const inputRef = useRef(null);
  const { registerInput, unregisterInput, scrollToInput, resetScroll } = useKeyboardFocus();
  const route = useRoute();
  const screenName = route?.name || 'Unknown';
  const generatedId = useRef(`input_${Date.now()}_${Math.random()}`).current;
  const inputIdFinal = inputId || generatedId;

  // Expose TextInput methods via ref
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => inputRef.current?.clear(),
    isFocused: () => inputRef.current?.isFocused(),
    setNativeProps: (props) => inputRef.current?.setNativeProps(props),
    ...inputRef.current,
  }));

  // Register/unregister input
  useEffect(() => {
    if (inputRef.current) {
      registerInput(inputIdFinal, inputRef.current, screenName);
    }

    return () => {
      unregisterInput(inputIdFinal);
    };
  }, [inputIdFinal, screenName, registerInput, unregisterInput]);

  // Handle focus with scroll-to-focus
  const handleFocus = (event) => {
    if (!skipScroll && !multiline) {
      // For multiline inputs, skip auto-scroll to prevent jitter while typing
      // Small delay to ensure keyboard is showing
      setTimeout(() => {
        scrollToInput(inputIdFinal, {
          duration: 250,
          offset: 0,
          skipIfVisible: true,
        });
      }, 100);
    }

    onFocus?.(event);
  };

  // Handle blur with optional scroll reset
  const handleBlur = (event) => {
    // Don't reset scroll immediately on blur - let keyboard hide first
    // This prevents jarring scroll movements when switching between inputs
    // The scroll will reset when keyboard hides (handled in KeyboardFocusContext)

    onBlur?.(event);
  };

  return (
    <TextInput
      ref={inputRef}
      {...textInputProps}
      onFocus={handleFocus}
      onBlur={handleBlur}
      multiline={multiline}
    />
  );
});

FocusableTextInput.displayName = 'FocusableTextInput';

export default FocusableTextInput;

