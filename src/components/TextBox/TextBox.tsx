import { ReactNode, Ref, useState } from 'react';
import {
  StyleProp,
  TextInput,
  TextStyle,
  ViewStyle,
  TextInputProps,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '../Typography';

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
  styleInput = {},
  value,
}: TextBoxProps) {
  const [focused, setFocused] = useState<boolean>(false);

  const { theme } = useUnistyles();

  return (
    <View style={[styles.main, style]}>
      {label && (
        <Typography size="xs" fontWeight="semiBold">
          {label}
        </Typography>
      )}

      <View style={[styles.wrapper(focused, Boolean(error)), styleContent]}>
        {left}
        <TextInput
          // allowFontScaling={systemScaling}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          editable={editable}
          keyboardType={keyboardType}
          multiline={multiline}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          onChangeText={onChangeText}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.gray.accent}
          ref={ref}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          selectionColor={theme.colors.accent.accent}
          textAlignVertical="center"
          value={value}
          style={[styles.input(Boolean(multiline), Boolean(code)), styleInput]}
        />
        {right}
      </View>
      {hint && (
        <Typography color="gray" size="sm">
          {hint}
        </Typography>
      )}
      {error && (
        <Typography color="red" size="sm">
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  wrapper: (focused: boolean, error: boolean) => ({
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: theme.colors.gray.ui,
    borderColor: (() => {
      if (focused) {
        if (error) {
          return theme.colors.red.accent;
        }
        return theme.colors.accent.accent;
      }
      if (error) {
        return theme.colors.red.borderUi;
      }
      return theme.colors.gray.borderUi;
    })(),
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
  }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  input: (multiline: boolean, _code: boolean) => ({
    color: theme.colors.gray.text,
    flex: 1,
    fontSize: theme.font.fontSize.lg,
    height: multiline ? undefined : theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: multiline ? theme.spacing.lg : undefined,
  }),
  main: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
}));
