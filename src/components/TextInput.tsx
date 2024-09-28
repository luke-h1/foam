import { useSporeColors } from '@app/hooks/useSporeColors';
import { forwardRef } from 'react';
import { Dimensions, TextInput as TextInputBase } from 'react-native';
import { Input, InputProps } from 'tamagui';

export type TextInputProps = InputProps;

export const TextInput = forwardRef<TextInputBase, TextInputProps>(
  function _TextInput({ onChangeText, onBlur, ...rest }, ref) {
    const colors = useSporeColors();
    return (
      <Input
        ref={ref}
        width={Dimensions.get('window').width - 32}
        autoComplete="off"
        backgroundColor="$surface5"
        color="$neutral1"
        height="auto"
        placeholderTextColor="$neutral3"
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing12"
        selectionColor={colors.neutral3.get()}
        onBlur={onBlur}
        onChangeText={onChangeText}
        {...rest}
      />
    );
  },
);
