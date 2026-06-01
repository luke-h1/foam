import {
  Input,
  type InputRef,
  type InputSelection,
  type ThemedInputProps,
} from '@app/components/ui/Input/Input';
import { theme } from '@app/styles/themes';
import { forwardRef, useCallback } from 'react';
import { View, LayoutChangeEvent, StyleSheet } from 'react-native';

interface ChatInputProps extends Omit<
  ThemedInputProps,
  'onChangeText' | 'onSelectionChange'
> {
  value?: string;
  onChangeText?: (text: string) => void;
  onSelectionChange?: (selection: InputSelection) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const ChatInput = forwardRef<InputRef, ChatInputProps>(
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
          selectionColor={theme.color.text.dark}
          textAlignVertical='top'
          style={[styles.input, textFieldProps.style]}
        />
      </View>
    );
  },
);

ChatInput.displayName = 'ChatInput';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  input: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
    maxHeight: 120,
    minHeight: 48,
    paddingBottom: 12,
    paddingHorizontal: 10,
    paddingTop: 12,
  },
});
