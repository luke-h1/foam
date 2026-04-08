import { theme } from '@app/styles/themes';
import { ReactNode, Ref, useState } from 'react';
import {
  StyleProp,
  TextInput,
  TextStyle,
  ViewStyle,
  TextInputProps,
  View,
  StyleSheet,
} from 'react-native';
import { Text } from '../Text/Text';

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

  return (
    <View style={[styles.main, style]}>
      {label && (
        <Text type="xs" weight="semibold">
          {label}
        </Text>
      )}

      <View
        style={[
          styles.wrapper,
          getWrapperStateStyle(focused, Boolean(error)),
          styleContent,
        ]}
      >
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
          style={[
            styles.input,
            getInputStateStyle(Boolean(multiline)),
            styleInput,
          ]}
        />
        {right}
      </View>
      {hint && (
        <Text color="gray" type="sm">
          {hint}
        </Text>
      )}
      {error && (
        <Text color="red" type="sm">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    color: theme.colors.gray.text,
    flex: 1,
    fontSize: theme.font.fontSize.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  main: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.ui,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexGrow: 1,
  },
});

function getWrapperStateStyle(focused: boolean, error: boolean) {
  return {
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
  };
}

function getInputStateStyle(multiline: boolean) {
  return {
    height: multiline ? undefined : theme.spacing['3xl'],
    paddingVertical: multiline ? theme.spacing.lg : undefined,
  };
}
