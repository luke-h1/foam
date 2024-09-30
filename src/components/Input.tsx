import { Ref, forwardRef } from 'react';
import { TextInput as TextInputBase } from 'react-native';

type TextInputProps = TextInputBase['props'];

function TextInput(
  { onChangeText, onBlur, ...rest }: TextInputProps,
  ref: Ref<TextInputBase>,
) {
  return (
    <TextInputBase
      ref={ref}
      autoComplete="off"
      onBlur={onBlur}
      onChangeText={onChangeText}
      {...rest}
    />
  );
}
export default forwardRef(TextInput);
