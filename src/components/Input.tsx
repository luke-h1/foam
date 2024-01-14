import { useSporeColors } from '@app/hooks/useSporeColors';
import { Ref, forwardRef } from 'react';
import { TextInput as TextInputBase } from 'react-native';
import { Input, TamaguiTextElement } from 'tamagui';

type TextInputProps = TextInputBase['props'];

function TextInput(
  { onChangeText, onBlur, ...rest }: TextInputProps & TamaguiTextElement,
  ref: Ref<TextInputBase>,
) {
  const colors = useSporeColors();

  return (
    <Input
      ref={ref}
      autoComplete="off"
      backgroundColor="$surface1"
      borderRadius="$rounded12"
      color="$neutral1"
      height="auto"
      // @ts-expect-error issue with tamagui types conflicting with react-native types
      placeholderTextColor="$neutral3"
      paddingHorizontal="$spacing16"
      paddingVertical="$spacing12"
      selectionColor={colors.neutral3.get()}
      onBlur={onBlur}
      onChangeText={onChangeText}
      {...rest}
    />
  );
}
export default forwardRef(TextInput);
