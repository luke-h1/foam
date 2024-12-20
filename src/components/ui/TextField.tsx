import { colors, spacing, typography } from '@app/styles';
import React, {
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
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Text, TextProps } from './Text';

export interface TextFieldAccessoryProps {
  style: StyleProp<unknown>;
  status: TextFieldProps['status'];
  multiline: boolean;
  editable: boolean;
}

export interface TextFieldProps extends Omit<TextInputProps, 'ref'> {
  status?: 'error' | 'disabled';
  label?: TextProps['text'];
  LabelTextProps?: TextProps;
  helper?: TextProps['text'];
  HelperTextProps?: TextProps;
  placeholder?: TextProps['text'];
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

  const $labelStyles = [$labelStyle, LabelTextProps?.style];

  const $inputWrapperStyles: StyleProp<ViewStyle> = [
    $inputWrapperStyle,
    status === 'error' && { borderColor: colors.error },
    TextInputProps.multiline && { minHeight: 112 },
    LeftAccessory && { paddingStart: 0 },
    RightAccessory && { paddingEnd: 0 },
    $inputWrapperStyleOverride,
  ];

  const $inputStyles: StyleProp<TextStyle> = [
    $inputStyle,
    disabled && { color: colors.textDim },
    TextInputProps.multiline && { height: 'auto' },
    $inputStyleOverride,
  ];

  const $helperStyles = [
    $helperStyle,
    status === 'error' && { color: colors.error },
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
    <TouchableOpacity
      activeOpacity={1}
      style={$containerStyles}
      // eslint-disable-next-line react/jsx-no-bind
      onPress={focusInput}
      accessibilityState={{ disabled }}
    >
      {!!label && (
        <Text
          preset="formLabel"
          text={label}
          {...LabelTextProps}
          style={$labelStyles}
        />
      )}
      <View style={$inputWrapperStyles}>
        {!!LeftAccessory && (
          <LeftAccessory
            style={$leftAccessoryStyle}
            status={status}
            editable={!disabled}
            multiline={TextInputProps.multiline ?? false}
          />
        )}

        <TextInput
          ref={input}
          underlineColorAndroid={colors.transparent}
          textAlignVertical="center"
          placeholder={placeholderContent}
          placeholderTextColor={colors.textDim}
          {...TextInputProps}
          editable={!disabled}
          style={$inputStyles}
        />

        {!!RightAccessory && (
          <RightAccessory
            style={$rightAccessoryStyle}
            status={status}
            editable={!disabled}
            multiline={TextInputProps.multiline ?? false}
          />
        )}
      </View>
      {!!helper && (
        <Text
          preset="formHelper"
          text={helper}
          {...HelperTextProps}
          style={$helperStyles}
        />
      )}
    </TouchableOpacity>
  );
});

const $labelStyle: TextStyle = {
  marginBottom: spacing.extraSmall,
};

const $inputWrapperStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderRadius: 4,
  borderColor: colors.palette.neutral400,
  overflow: 'hidden',
};

const $inputStyle: TextStyle = {
  flex: 1,
  alignSelf: 'stretch',
  fontFamily: typography.primary.book,
  color: colors.textDim,
  height: 30,
  paddingVertical: 0,
  paddingHorizontal: 0,
  marginVertical: spacing.small,
  marginHorizontal: spacing.small,
};

const $helperStyle: TextStyle = {
  marginTop: spacing.extraSmall,
};

const $rightAccessoryStyle: ViewStyle = {
  marginEnd: spacing.small,
  height: 30,
  justifyContent: 'center',
  alignItems: 'center',
};

const $leftAccessoryStyle: ViewStyle = {
  marginStart: spacing.extraSmall,
  height: 30,
  justifyContent: 'center',
  alignItems: 'center',
};
