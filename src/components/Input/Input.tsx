import { theme } from '@app/styles/themes';
import { ForwardedRef, forwardRef } from 'react';
import {
  TextInput as TextInputPrimitive,
  TextInputProps,
  StyleSheet,
} from 'react-native';

export interface InputProps extends TextInputProps {
  testID?: string;
}

const Input = (
  {
    allowFontScaling = false,
    autoCapitalize = 'none',
    autoCorrect = false,
    keyboardAppearance,
    keyboardType,
    placeholderTextColor,
    selectionColor,
    spellCheck = true,
    style,
    testID,
    textContentType = 'none',
    ...props
  }: InputProps,
  ref: ForwardedRef<TextInputPrimitive>,
) => {
  const labelQuaternary = 'rgba(245, 248, 255, 0.4)';

  const blue = '#007AFF';
  const defaultSelectionColor = blue;

  return (
    <TextInputPrimitive
      {...props}
      allowFontScaling={allowFontScaling}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      keyboardAppearance={keyboardAppearance}
      keyboardType={keyboardType}
      placeholderTextColor={placeholderTextColor || labelQuaternary}
      ref={ref}
      selectionColor={selectionColor || defaultSelectionColor}
      spellCheck={spellCheck}
      style={[styles.input, style]}
      testID={testID}
      textContentType={textContentType}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    color: theme.colors.gray.text,
    fontFamily: theme.font.fontFamily,
  },
});

export default forwardRef<TextInputPrimitive, InputProps>(Input);
