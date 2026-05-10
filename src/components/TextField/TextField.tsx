/* eslint-disable no-restricted-imports */
import { theme } from '@app/styles/themes';
import {
  ComponentType,
  forwardRef,
  Ref,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  StyleProp,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { Button } from '../Button/Button';
import { Text } from '../Text/Text';

export interface TextFieldAccessoryProps {
  style: StyleProp<unknown>;
  status: TextFieldProps['status'];
  multiline: boolean;
  editable: boolean;
}

export interface TextFieldProps extends Omit<
  TextInputProps,
  'ref' | 'placeholder'
> {
  status?: 'error' | 'disabled';
  label?: TextProps['children'];
  LabelTextProps?: TextProps;
  helper?: TextProps['children'];
  HelperTextProps?: TextProps;
  placeholder?: TextProps['children'];
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  RightAccessory?: ComponentType<TextFieldAccessoryProps>;
  LeftAccessory?: ComponentType<TextFieldAccessoryProps>;
}

export const TextField = forwardRef(function TextField(
  props: TextFieldProps,
  ref: Ref<TextInput>,
) {
  const {
    label,
    placeholder,
    helper,
    status,
    RightAccessory,
    LeftAccessory,
    HelperTextProps,
    LabelTextProps,
    style: $inputStyleOverride,
    containerStyle: $containerStyleOverride,
    inputWrapperStyle: $inputWrapperStyleOverride,
    // eslint-disable-next-line no-shadow
    ...TextInputProps
  } = props;

  const input = useRef<TextInput>(null);

  const disabled = TextInputProps.editable === false || status === 'disabled';

  const placeholderContent = placeholder;

  const $containerStyles = [$containerStyleOverride];

  const $labelStyles = [styles.label, LabelTextProps?.style];

  const $inputWrapperStyles: StyleProp<ViewStyle> = [
    styles.inputWrapper,
    status === 'error' && { borderColor: theme.colorRed },
    TextInputProps.multiline && { minHeight: 112 },
    LeftAccessory && { paddingStart: 0 },
    RightAccessory && { paddingEnd: 0 },
    $inputWrapperStyleOverride,
  ];

  const $inputStyles: StyleProp<TextStyle> = [
    styles.input,
    disabled && { color: theme.colorAccentHoverAlpha },
    TextInputProps.multiline && { height: 'auto' },
    $inputStyleOverride,
  ];

  const $helperStyles = [
    styles.helper,
    status === 'error' && { color: theme.colorRedBorder },
    HelperTextProps?.style,
  ];

  function focusInput() {
    if (disabled) {
      return;
    }
    input.current?.focus();
  }

  useImperativeHandle(ref, () => input.current as TextInput);

  return (
    <Button
      style={$containerStyles}
      // eslint-disable-next-line react/jsx-no-bind
      onPress={focusInput}
      accessibilityState={{ disabled }}
    >
      {!!label && (
        <Text {...LabelTextProps} style={$labelStyles}>
          {label}
        </Text>
      )}
      <View style={$inputWrapperStyles}>
        {!!LeftAccessory && (
          <LeftAccessory
            style={styles.leftAccessory}
            status={status}
            editable={!disabled}
            multiline={TextInputProps.multiline ?? false}
          />
        )}

        <TextInput
          ref={input}
          underlineColorAndroid={theme.color.background.dark}
          textAlignVertical="center"
          placeholder={placeholderContent as string}
          placeholderTextColor={theme.color.text.dark}
          {...TextInputProps}
          editable={!disabled}
          style={$inputStyles}
        />

        {!!RightAccessory && (
          <RightAccessory
            style={styles.rightAccessory}
            status={status}
            editable={!disabled}
            multiline={TextInputProps.multiline ?? false}
          />
        )}
      </View>
      {!!helper && (
        <Text {...HelperTextProps} style={$helperStyles}>
          {helper}
        </Text>
      )}
    </Button>
  );
});

const styles = StyleSheet.create({
  helper: {
    marginTop: theme.space8,
  },
  input: {
    borderColor: theme.color.text.dark,
    borderWidth: StyleSheet.hairlineWidth,
    color: theme.color.text.dark,
    flex: 1,
    marginVertical: theme.space12,
    padding: theme.space20,
  },
  inputWrapper: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 4,
    borderWidth: 1,
    color: theme.color.text.dark,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  label: {
    marginBottom: theme.space12,
  },
  leftAccessory: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    marginStart: theme.space8,
  },
  rightAccessory: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    marginEnd: theme.space12,
  },
});
