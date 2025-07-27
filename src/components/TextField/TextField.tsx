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
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Typography, TypographyProps } from '../Typography';

export interface TextFieldAccessoryProps {
  style: StyleProp<unknown>;
  status: TextFieldProps['status'];
  multiline: boolean;
  editable: boolean;
}

export interface TextFieldProps
  extends Omit<TextInputProps, 'ref' | 'placeholder'> {
  status?: 'error' | 'disabled';
  label?: TypographyProps['children'];
  LabelTextProps?: TypographyProps;
  helper?: TypographyProps['children'];
  HelperTextProps?: TypographyProps;
  placeholder?: TypographyProps['children'];
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

  const { theme } = useUnistyles();

  const input = useRef<TextInput>(null);

  const disabled = TextInputProps.editable === false || status === 'disabled';

  const placeholderContent = placeholder;

  const $containerStyles = [$containerStyleOverride];

  const $labelStyles = [styles.label, LabelTextProps?.style];

  const $inputWrapperStyles: StyleProp<ViewStyle> = [
    styles.inputWrapper,
    status === 'error' && { borderColor: theme.colors.cherry },
    TextInputProps.multiline && { minHeight: 112 },
    LeftAccessory && { paddingStart: 0 },
    RightAccessory && { paddingEnd: 0 },
    $inputWrapperStyleOverride,
  ];

  const $inputStyles: StyleProp<TextStyle> = [
    styles.input,
    disabled && { color: theme.colors.borderFaint },
    TextInputProps.multiline && { height: 'auto' },
    $inputStyleOverride,
  ];

  const $helperStyles = [
    styles.helper,
    status === 'error' && { color: theme.colors.cherry },
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
      activeOpacity={1}
      style={$containerStyles}
      // eslint-disable-next-line react/jsx-no-bind
      onPress={focusInput}
      accessibilityState={{ disabled }}
    >
      {!!label && (
        <Typography {...LabelTextProps} style={$labelStyles}>
          {label}
        </Typography>
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
          underlineColorAndroid={theme.colors.foregroundNeutral}
          textAlignVertical="center"
          placeholder={placeholderContent as string}
          placeholderTextColor={theme.colors.foregroundNeutral}
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
        <Typography {...HelperTextProps} style={$helperStyles}>
          {helper}
        </Typography>
      )}
    </Button>
  );
});

const styles = StyleSheet.create(theme => ({
  label: {
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    borderColor: theme.colors.borderFaint,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    color: theme.colors.text,
    height: 30,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.sm,
  },
  helper: {
    marginTop: theme.spacing.xs,
  },
  rightAccessory: {
    marginEnd: theme.spacing.sm,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAccessory: {
    marginStart: theme.spacing.xs,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
