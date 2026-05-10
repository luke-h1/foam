import {
  Input as ThemedInput,
  type ThemedInputProps,
} from '@app/components/ui/Input/Input';
import { forwardRef, type ForwardedRef } from 'react';
import { TextInput as TextInputPrimitive } from 'react-native';

export interface InputProps extends ThemedInputProps {
  testID?: string;
}

const Input = (
  {
    allowFontScaling = false,
    autoCapitalize = 'none',
    autoCorrect = false,
    spellCheck = true,
    textContentType = 'none',
    ...props
  }: InputProps,
  ref: ForwardedRef<TextInputPrimitive>,
) => {
  return (
    <ThemedInput
      {...props}
      allowFontScaling={allowFontScaling}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      radius="lg"
      ref={ref}
      spellCheck={spellCheck}
      textContentType={textContentType}
      variant="subtle"
    />
  );
};

export default forwardRef<TextInputPrimitive, InputProps>(Input);
