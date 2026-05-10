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
          placeholderTextColor={theme.colorGrey}
          ref={ref}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          selectionColor={theme.colorDarkGreen}
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
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize18,
    paddingHorizontal: theme.space20,
  },
  main: {
    gap: theme.space16,
    marginBottom: theme.space36,
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
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
          return theme.colorRed;
        }
        return theme.colorDarkGreen;
      }
      if (error) {
        return theme.colorRedBorderUi;
      }
      return theme.colorBorderTertiary;
    })(),
  };
}

function getInputStateStyle(multiline: boolean) {
  return {
    height: multiline ? undefined : theme.space44,
    paddingVertical: multiline ? theme.space20 : undefined,
  };
}
