import React, { ForwardedRef } from 'react';
import { TextInput as TextInputPrimitive, TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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

const styles = StyleSheet.create(theme => ({
  input: {
    fontFamily: theme.font.fontFamily,
    color: theme.colors.text,
  },
}));

export default React.forwardRef<TextInputPrimitive, InputProps>(Input);
