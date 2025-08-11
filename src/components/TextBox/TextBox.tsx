import { ReactNode, Ref, useState } from 'react';
import {
  StyleProp,
  TextInput,
  TextStyle,
  ViewStyle,
  TextInputProps,
  View,
} from 'react-native';
import { Typography } from '../Typography';
import { StyleSheet } from 'react-native-unistyles';

type TextBoxProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoCorrect'
  | 'editable'
  | 'keyboardType'
  | 'multiline'
  | 'onBlur'
  | 'onChangeText'
  | 'onFocus'
  | 'onSubmitEditing'
  | 'placeholder'
  | 'returnKeyType'
  | 'secureTextEntry'
  | 'value'
> & {
  code?: boolean;
  error?: string;
  hint?: string;
  label?: string;
  left?: ReactNode;
  ref?: Ref<TextInput>;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  styleContent?: StyleProp<ViewStyle>;
  styleInput?: StyleProp<TextStyle>;
};

export function TextBox({
  autoCapitalize,
  autoComplete,
  autoCorrect,
  code,
  editable = true,
  error,
  hint,
  keyboardType,
  label,
  left,
  multiline,
  onBlur,
  onChangeText,
  onFocus,
  onSubmitEditing,
  placeholder,
  ref,
  returnKeyType,
  right,
  secureTextEntry,
  style,
  styleContent,
  styleInput,
  value,
}: TextBoxProps) {
  const [focused, setFocused] = useState<boolean>(false);

  return (
    <View style={[styles.main, style]}>
      {label && (
        <Typography size="xs" fontWeight="semiBold">
          {label}
        </Typography>
      )}

      <View style={styles.wrapper}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
