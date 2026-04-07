import Input, { InputProps } from '@app/components/Input/Input';
import { theme } from '@app/styles/themes';
import { forwardRef, useCallback } from 'react';
import {
  TextInput,
  View,
  LayoutChangeEvent,
  FocusEvent,
  StyleSheet,
} from 'react-native';

interface ChatInputProps extends Omit<InputProps, 'onChangeText'> {
  value?: string;
  onChangeText?: (text: string) => void;
  onSelectionChange?: (event: {
    nativeEvent: { selection: { start: number; end: number } };
  }) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
}

export const ChatInput = forwardRef<TextInput, ChatInputProps>(
  (
    {
      value = '',
      onChangeText,
      onSelectionChange,
      onLayout,
      onFocus,
      onBlur,
      placeholder = 'Send a message...',
      ...textFieldProps
    },
    ref,
  ) => {
    const handleTextChange = useCallback(
      (text: string) => {
        onChangeText?.(text);
      },
      [onChangeText],
    );

    return (
      <View style={styles.container} onLayout={onLayout}>
        <Input
          ref={ref}
          {...textFieldProps}
          value={value}
          placeholder={placeholder}
          onChangeText={handleTextChange}
          onSelectionChange={onSelectionChange}
          onFocus={onFocus}
          onBlur={onBlur}
          multiline
          scrollEnabled
          textAlignVertical="top"
          style={[styles.input, textFieldProps.style]}
        />
      </View>
    );
  },
);

ChatInput.displayName = 'ChatInput';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.ui,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
  },
  input: {
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
    paddingBottom: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
});
