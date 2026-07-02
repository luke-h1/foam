import {
  type Ref,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  type ColorValue,
  type StyleProp,
  StyleSheet,
  type TextInputProps,
  type TextStyle,
  useColorScheme,
  type ViewStyle,
} from 'react-native';
import { scheduleOnRN } from 'react-native-worklets';

import {
  GlassEffectContainer,
  Host,
  SecureField,
  type SecureFieldRef,
  Text as SwiftUIText,
  TextField,
  type TextFieldRef,
  useNativeState,
  VStack,
} from '@expo/ui/swift-ui';
import {
  Animation,
  animation,
  autocorrectionDisabled,
  background,
  border,
  clipShape,
  disabled as disabledModifier,
  font,
  foregroundStyle,
  frame,
  glassEffect,
  keyboardType as keyboardTypeModifier,
  lineLimit,
  multilineTextAlignment,
  onSubmit,
  padding,
  shapes,
  submitLabel,
  textContentType as textContentTypeModifier,
  textFieldStyle,
  textInputAutocapitalization,
  tint,
  type ViewModifier,
} from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

import { useAccentColor } from '@app/context/AccentColorContext';
import { colors } from '@app/styles/colors';
import { RADIUS_VALUES, UIColor, UIRadius, UISize } from '@app/styles/ui';

import {
  getIosInputSubmitInvoker,
  registerIosInputSubmitHandler,
  unregisterIosInputSubmitHandler,
} from './inputSubmitRegistry.ios';
import {
  generateVariantConfig,
  generateVariantConfigFromBase,
  type InputVariant,
} from './inputVariants.ios';

export type InputRef = TextFieldRef;
export type InputSelection = { start: number; end: number };

export type ThemedInputProps = Omit<
  TextInputProps,
  | 'onBlur'
  | 'onContentSizeChange'
  | 'onFocus'
  | 'onSelectionChange'
  | 'onSubmitEditing'
  | 'style'
> & {
  size?: UISize;
  variant?: InputVariant;
  color?: UIColor;
  onBlur?: () => void;
  onContentSizeChange?: (size: { width: number; height: number }) => void;
  onFocus?: () => void;
  onSelectionChange?: (selection: InputSelection) => void;
  onSubmitEditing?: (text: string) => void;
  radius?: UIRadius;
  style?: StyleProp<TextStyle & ViewStyle>;
  ref?: Ref<InputRef>;
};

function useIosInputField({
  autoCapitalize,
  autoComplete,
  autoCorrect,
  autoFocus,
  blurOnSubmit,
  cursorColor,
  defaultValue,
  editable,
  enterKeyHint,
  inputMode,
  keyboardType,
  maxLength,
  multiline,
  numberOfLines,
  onBlur,
  onChange,
  onChangeText,
  onContentSizeChange,
  onEndEditing,
  onFocus,
  onSelectionChange,
  onSubmitEditing,
  placeholder,
  placeholderTextColor,
  readOnly,
  returnKeyType,
  secureTextEntry,
  selection,
  selectionColor,
  style,
  submitBehavior,
  textAlign,
  textContentType,
  value,
  size = 'md',
  variant = 'outline',
  color,
  radius = 'default',
  ref,
}: ThemedInputProps) {
  'use no memo';
  const colorScheme = useColorScheme();
  const { accentHex } = useAccentColor();
  const scheme: 'light' | 'dark' = colorScheme === 'light' ? 'light' : 'dark';
  const textFieldRef = useRef<TextFieldRef>(null);
  const secureFieldRef = useRef<SecureFieldRef>(null);
  const [initial] = useState(() => valueOrDefault(value, defaultValue));
  const latestText = useRef(initial);
  const nativeText = useNativeState(initial);
  const nativeSelection = useNativeState<InputSelection>({
    start: selection?.start ?? 0,
    end: selection?.end ?? selection?.start ?? 0,
  });
  const [typedHasText, setTypedHasText] = useState(initial.length > 0);
  const hasText = value !== undefined ? value.length > 0 : typedHasText;

  const variants = color
    ? generateVariantConfig(color, scheme)
    : generateVariantConfigFromBase(accentHex || colors[scheme].tint, scheme);
  const variantConfig = variants[variant];

  const baseStyles = {
    backgroundColor: variantConfig.backgroundColor,
    color: variantConfig.textColor,
    borderColor: variantConfig.borderColor,
    fontSize: FONT_SIZE_STYLES[size].fontSize,
  };

  const inputStyles =
    variant === 'underline'
      ? [
          styles.input,
          SIZE_STYLES[size],
          {
            ...baseStyles,
            borderBottomWidth: variantConfig.borderWidth,
            borderTopWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderRadius: 0,
          },
          style,
        ]
      : [
          styles.input,
          SIZE_STYLES[size],
          {
            ...baseStyles,
            borderWidth: variantConfig.borderWidth,
            borderRadius: RADIUS_VALUES[radius],
          },
          style,
        ];

  const flattenedStyle = (StyleSheet.flatten(inputStyles) ?? {}) as TextStyle &
    ViewStyle;
  const liquidGlassAvailable = isLiquidGlassAvailable();
  const textColor = colorValue(flattenedStyle.color ?? variantConfig.textColor);
  const resolvedPlaceholderColor = colorValue(
    placeholderTextColor ?? variantConfig.placeholderColor,
  );
  const resolvedBackgroundColor = colorValue(
    flattenedStyle.backgroundColor ?? variantConfig.backgroundColor,
  );
  const resolvedBorderColor = colorValue(
    flattenedStyle.borderColor ?? variantConfig.borderColor,
  );
  const resolvedCursorColor = colorValue(
    cursorColor ?? selectionColor ?? variantConfig.textColor,
  );
  const disabled = editable === false || readOnly === true;
  const onSubmitEditingRef = useRef(onSubmitEditing);
  const blurOnSubmitRef = useRef(blurOnSubmit);
  const multilineRef = useRef(multiline);
  const submitBehaviorRef = useRef(submitBehavior);
  const secureTextEntryRef = useRef(secureTextEntry);

  useLayoutEffect(() => {
    onSubmitEditingRef.current = onSubmitEditing;
    blurOnSubmitRef.current = blurOnSubmit;
    multilineRef.current = multiline;
    submitBehaviorRef.current = submitBehavior;
    secureTextEntryRef.current = secureTextEntry;
  });

  const inputInstanceId = useId();
  const stableSubmitHandler = getIosInputSubmitInvoker(inputInstanceId);

  useLayoutEffect(() => {
    if (onSubmitEditing) {
      registerIosInputSubmitHandler(inputInstanceId, () => {
        const submittedText = nativeText.value;
        latestText.current = submittedText;
        onSubmitEditingRef.current?.(submittedText);
        if (
          shouldBlurOnSubmit({
            blurOnSubmit: blurOnSubmitRef.current,
            multiline: multilineRef.current,
            submitBehavior: submitBehaviorRef.current,
          })
        ) {
          void currentInputRef({
            secureTextEntry: secureTextEntryRef.current,
            secureFieldRef,
            textFieldRef,
          })?.blur();
        }
      });
    } else {
      unregisterIosInputSubmitHandler(inputInstanceId);
    }

    return () => {
      unregisterIosInputSubmitHandler(inputInstanceId);
    };
  }, [inputInstanceId, nativeText, onSubmitEditing]);

  const textFieldModifiers = buildTextFieldModifiers({
    autoCapitalize,
    autoComplete,
    autoCorrect,
    disabled,
    enterKeyHint,
    inputMode,
    keyboardType,
    multiline,
    numberOfLines,
    onSubmit: onSubmitEditing ? stableSubmitHandler : undefined,
    returnKeyType,
    style: flattenedStyle,
    textAlign,
    textColor,
    textContentType,
    tintColor: resolvedCursorColor,
  });
  const containerModifiers = buildContainerModifiers({
    backgroundColor: resolvedBackgroundColor,
    borderColor: resolvedBorderColor,
    borderWidth: borderWidthForStyle(flattenedStyle),
    hasText,
    liquidGlassAvailable,
    multiline: Boolean(multiline),
    radius: radiusForStyle(flattenedStyle),
    style: flattenedStyle,
  });
  const hostStyle = [styles.host, pickHostStyle(flattenedStyle)];
  const autoFocusProps = autoFocus ? { autoFocus } : undefined;
  const placeholderNode = placeholder ? (
    <TextField.Placeholder>
      <SwiftUIText
        modifiers={[
          foregroundStyle(resolvedPlaceholderColor),
          ...fontModifiersForStyle(flattenedStyle),
        ]}
      >
        {placeholder}
      </SwiftUIText>
    </TextField.Placeholder>
  ) : null;
  const securePlaceholderNode = placeholder ? (
    <SecureField.Placeholder>
      <SwiftUIText
        modifiers={[
          foregroundStyle(resolvedPlaceholderColor),
          ...fontModifiersForStyle(flattenedStyle),
        ]}
      >
        {placeholder}
      </SwiftUIText>
    </SecureField.Placeholder>
  ) : null;

  const commitTextChange = (nextText: string) => {
    latestText.current = nextText;
    setTypedHasText(nextText.length > 0);
    onChangeText?.(nextText);
    onChange?.(textChangeEvent(nextText));
  };

  const handleTextChange = (nextText: string) => {
    'worklet';

    scheduleOnRN(commitTextChange, nextText);
  };

  const handleFocusChange = (focused: boolean) => {
    if (focused) {
      onFocus?.();
      return;
    }
    onBlur?.();
    const currentText = nativeText.value;
    latestText.current = currentText;
    onEndEditing?.(endEditingEvent(currentText));
  };

  useImperativeHandle(
    ref,
    () =>
      ({
        blur: () =>
          currentInputRef({
            secureTextEntry,
            secureFieldRef,
            textFieldRef,
          })?.blur() ?? Promise.resolve(),
        clear: () => {
          latestText.current = '';
          nativeText.value = '';
          setTypedHasText(false);
          return Promise.resolve();
        },
        focus: () =>
          currentInputRef({
            secureTextEntry,
            secureFieldRef,
            textFieldRef,
          })?.focus() ?? Promise.resolve(),
        setSelection: (start: number, end: number) =>
          secureTextEntry
            ? Promise.resolve()
            : (textFieldRef.current?.setSelection(start, end) ??
              Promise.resolve()),
        setText: (nextText: string) => {
          latestText.current = nextText;
          nativeText.value = nextText;
          setTypedHasText(nextText.length > 0);
          return Promise.resolve();
        },
      }) satisfies InputRef,
    [nativeText, secureTextEntry],
  );

  useLayoutEffect(() => {
    if (value === undefined) {
      return;
    }

    if (value === latestText.current) {
      return;
    }

    latestText.current = value;
    setNativeText(nativeText, value);
  }, [nativeText, value]);

  useLayoutEffect(() => {
    if (!selection || secureTextEntry) {
      return;
    }

    void textFieldRef.current?.setSelection(
      selection.start,
      selection.end ?? selection.start,
    );
  }, [selection, secureTextEntry]);

  return {
    autoFocusProps,
    containerModifiers,
    handleFocusChange,
    handleTextChange,
    hostStyle,
    maxLength,
    multiline,
    nativeSelection,
    nativeText,
    onContentSizeChange,
    onSelectionChange,
    placeholder,
    placeholderNode,
    scheme,
    secureFieldRef,
    securePlaceholderNode,
    secureTextEntry,
    textFieldModifiers,
    textFieldRef,
  };
}

export function Input(props: ThemedInputProps) {
  const {
    autoFocusProps,
    containerModifiers,
    handleFocusChange,
    handleTextChange,
    hostStyle,
    maxLength,
    multiline,
    nativeSelection,
    nativeText,
    onContentSizeChange,
    onSelectionChange,
    placeholder,
    placeholderNode,
    scheme,
    secureFieldRef,
    securePlaceholderNode,
    secureTextEntry,
    textFieldModifiers,
    textFieldRef,
  } = useIosInputField(props);

  return (
    <Host
      colorScheme={scheme}
      /**
       * RN owns this field's placement; without this the hosting view
       * re-applies the window safe area (home indicator / keyboard) inside its
       * own bounds and the field content renders shifted out of the host frame.
       */
      ignoreSafeArea='all'
      matchContents={{ vertical: true }}
      onLayoutContent={
        onContentSizeChange
          ? event => onContentSizeChange(event.nativeEvent)
          : undefined
      }
      style={hostStyle}
    >
      <GlassEffectContainer>
        <VStack alignment='leading' modifiers={containerModifiers}>
          {secureTextEntry ? (
            <SecureField
              {...autoFocusProps}
              maxLength={maxLength}
              modifiers={textFieldModifiers}
              onFocusChange={handleFocusChange}
              onTextChange={handleTextChange}
              placeholder={placeholder}
              ref={secureFieldRef}
              text={nativeText}
            >
              {securePlaceholderNode}
            </SecureField>
          ) : (
            <TextField
              {...autoFocusProps}
              axis={multiline ? 'vertical' : 'horizontal'}
              maxLength={maxLength}
              modifiers={textFieldModifiers}
              onFocusChange={handleFocusChange}
              onSelectionChange={onSelectionChange}
              onTextChange={handleTextChange}
              placeholder={placeholder}
              ref={textFieldRef}
              selection={nativeSelection}
              text={nativeText}
            >
              {placeholderNode}
            </TextField>
          )}
        </VStack>
      </GlassEffectContainer>
    </Host>
  );
}

type BuildTextFieldModifierOptions = {
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  autoCorrect?: boolean;
  disabled: boolean;
  enterKeyHint?: TextInputProps['enterKeyHint'];
  inputMode?: TextInputProps['inputMode'];
  keyboardType?: TextInputProps['keyboardType'];
  multiline?: boolean;
  numberOfLines?: number;
  onSubmit?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
  style: TextStyle & ViewStyle;
  textAlign?: TextStyle['textAlign'];
  textColor: ColorValue;
  textContentType?: TextInputProps['textContentType'];
  tintColor: ColorValue;
};

function buildTextFieldModifiers({
  autoCapitalize,
  autoComplete,
  autoCorrect,
  disabled,
  enterKeyHint,
  inputMode,
  keyboardType,
  multiline,
  numberOfLines,
  onSubmit: submitHandler,
  returnKeyType,
  style,
  textAlign,
  textColor,
  textContentType,
  tintColor,
}: BuildTextFieldModifierOptions): ViewModifier[] {
  const modifiers: ViewModifier[] = [
    textFieldStyle('plain'),
    foregroundStyle(textColor),
    tint(tintColor),
    padding(paddingForStyle(style)),
    ...fontModifiersForStyle(style),
  ];
  const keyboard = keyboardTypeForInput(inputMode, keyboardType);
  const submit = submitLabelForInput(enterKeyHint, returnKeyType);
  const autocapitalization = autocapitalizationForInput(autoCapitalize);
  const contentType = contentTypeForInput(textContentType, autoComplete);
  const textAlignment = textAlignmentForInput(textAlign ?? style.textAlign);

  if (multiline) {
    modifiers.push(lineLimit(numberOfLines ?? 5));
  }
  if (keyboard) {
    modifiers.push(keyboardTypeModifier(keyboard));
  }
  if (submit) {
    modifiers.push(submitLabel(submit));
  }
  if (submitHandler) {
    modifiers.push(onSubmit(submitHandler));
  }
  if (autoCorrect === false) {
    modifiers.push(autocorrectionDisabled(true));
  }
  if (autocapitalization) {
    modifiers.push(textInputAutocapitalization(autocapitalization));
  }
  if (contentType) {
    modifiers.push(textContentTypeModifier(contentType));
  }
  if (textAlignment) {
    modifiers.push(multilineTextAlignment(textAlignment));
  }
  if (disabled) {
    modifiers.push(disabledModifier(true));
  }

  return modifiers;
}

type BuildContainerModifierOptions = {
  backgroundColor: ColorValue;
  borderColor: ColorValue;
  borderWidth: number;
  hasText: boolean;
  liquidGlassAvailable: boolean;
  multiline: boolean;
  radius: number;
  style: TextStyle & ViewStyle;
};

function buildContainerModifiers({
  backgroundColor,
  borderColor,
  borderWidth,
  hasText,
  liquidGlassAvailable,
  multiline,
  radius,
  style,
}: BuildContainerModifierOptions): ViewModifier[] {
  const modifiers: ViewModifier[] = [];
  const heightFrame = frameForStyle(style, multiline ? 'topLeading' : 'center');
  const hasBackground = !isTransparentColor(backgroundColor);
  const hasBorder = borderWidth > 0 && !isTransparentColor(borderColor);
  const hasSurface = hasBackground || hasBorder;
  const surfaceBackgroundColor =
    liquidGlassAvailable && hasSurface ? 'transparent' : backgroundColor;

  if (heightFrame) {
    modifiers.push(frame(heightFrame));
  }
  if (liquidGlassAvailable && hasSurface) {
    modifiers.push(
      glassEffect({
        glass: { variant: 'regular', interactive: true },
        shape: 'roundedRectangle',
        cornerRadius: radius,
      }),
    );
  }
  if (hasSurface) {
    modifiers.push(
      background(
        surfaceBackgroundColor,
        shapes.roundedRectangle({
          cornerRadius: radius,
          roundedCornerStyle: 'continuous',
        }),
      ),
    );
  }
  if (hasBorder) {
    modifiers.push(border({ color: borderColor, width: borderWidth }));
  }
  modifiers.push(
    clipShape('roundedRectangle', radius),
    animation(
      Animation.spring({
        duration: 0.5,
        dampingFraction: 0.5,
        blendDuration: 0.5,
        bounce: 0.5,
      }),
      hasText,
    ),
  );

  return modifiers;
}

function valueOrDefault(
  value: string | undefined,
  defaultValue: string | undefined,
) {
  if (value !== undefined) {
    return value;
  }
  return defaultValue ?? '';
}

function currentInputRef({
  secureTextEntry,
  secureFieldRef,
  textFieldRef,
}: {
  secureTextEntry?: boolean;
  secureFieldRef: React.RefObject<SecureFieldRef | null>;
  textFieldRef: React.RefObject<TextFieldRef | null>;
}) {
  return secureTextEntry ? secureFieldRef.current : textFieldRef.current;
}

function setNativeText(nativeText: { value: string }, text: string): void {
  nativeText.value = text;
}

function colorValue(color: ColorValue | null | undefined): ColorValue {
  return color ?? 'transparent';
}

function isTransparentColor(color: ColorValue | null | undefined) {
  return (
    color == null ||
    (typeof color === 'string' && color.toLowerCase() === 'transparent')
  );
}

function paddingForStyle(style: TextStyle & ViewStyle) {
  const all = numberValue(style.padding);
  const vertical = numberValue(style.paddingVertical);
  const horizontal = numberValue(style.paddingHorizontal);
  const top = numberValue(style.paddingTop) ?? vertical ?? all;
  const bottom = numberValue(style.paddingBottom) ?? vertical ?? all;
  const leading =
    numberValue(style.paddingStart) ??
    numberValue(style.paddingLeft) ??
    horizontal ??
    all;
  const trailing =
    numberValue(style.paddingEnd) ??
    numberValue(style.paddingRight) ??
    horizontal ??
    all;

  return {
    top,
    bottom,
    leading,
    trailing,
  };
}

type FrameAlignment = 'center' | 'topLeading';

function frameForStyle(
  style: TextStyle & ViewStyle,
  alignment: FrameAlignment,
) {
  const height = numberValue(style.height);
  const minHeight = numberValue(style.minHeight);

  /**
   * A flexible SwiftUI frame expands to fill maxHeight rather than hugging its
   * content, which makes the host measure max-tall (e.g. a one-line composer
   * reserving 120pt). Leave maxHeight to the RN host style, which clamps
   * without expanding; growth is already limited by lineLimit for multiline.
   */
  const maxHeight =
    alignment === 'topLeading' ? undefined : numberValue(style.maxHeight);

  if (
    height === undefined &&
    minHeight === undefined &&
    maxHeight === undefined
  ) {
    return undefined;
  }

  return {
    height,
    minHeight,
    maxHeight,
    alignment,
  };
}

function fontModifiersForStyle(style: TextStyle & ViewStyle): ViewModifier[] {
  const size = numberValue(style.fontSize);
  const weight = fontWeightForStyle(style.fontWeight);

  if (size === undefined && weight === undefined) {
    return [];
  }

  return [font({ size, weight })];
}

function radiusForStyle(style: TextStyle & ViewStyle) {
  return numberValue(style.borderRadius) ?? 0;
}

function borderWidthForStyle(style: TextStyle & ViewStyle) {
  const width =
    numberValue(style.borderWidth) ?? numberValue(style.borderBottomWidth) ?? 0;
  return width;
}

function numberValue(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function fontWeightForStyle(fontWeight: TextStyle['fontWeight']) {
  switch (fontWeight) {
    case '100':
    case '200':
    case 'ultralight':
      return 'ultraLight' as const;
    case '300':
    case 'light':
      return 'light' as const;
    case '500':
    case 'medium':
      return 'medium' as const;
    case '600':
    case 'semibold':
      return 'semibold' as const;
    case '700':
    case 'bold':
      return 'bold' as const;
    case '800':
    case 'heavy':
      return 'heavy' as const;
    case '900':
    case 'black':
      return 'black' as const;
    case '400':
    case 'normal':
    default:
      return undefined;
  }
}

function keyboardTypeForInput(
  inputMode?: TextInputProps['inputMode'],
  keyboardType?: TextInputProps['keyboardType'],
) {
  if (inputMode === 'decimal') {
    return 'decimal-pad' as const;
  }
  if (inputMode === 'numeric') {
    return 'numeric' as const;
  }
  if (inputMode === 'tel') {
    return 'phone-pad' as const;
  }
  if (inputMode === 'email') {
    return 'email-address' as const;
  }
  if (inputMode === 'url') {
    return 'url' as const;
  }
  if (inputMode === 'search') {
    return 'web-search' as const;
  }

  switch (keyboardType) {
    case 'number-pad':
      return 'numeric';
    case 'visible-password':
      return undefined;
    case 'default':
    case 'email-address':
    case 'numeric':
    case 'phone-pad':
    case 'ascii-capable':
    case 'numbers-and-punctuation':
    case 'url':
    case 'name-phone-pad':
    case 'decimal-pad':
    case 'twitter':
    case 'web-search':
      return keyboardType;
    default:
      return undefined;
  }
}

function submitLabelForInput(
  enterKeyHint?: TextInputProps['enterKeyHint'],
  returnKeyType?: TextInputProps['returnKeyType'],
) {
  const label = enterKeyHint ?? returnKeyType;

  switch (label) {
    case 'done':
    case 'go':
    case 'join':
    case 'next':
    case 'route':
    case 'search':
    case 'send':
      return label;
    case 'enter':
    case 'default':
      return 'return';
    default:
      return undefined;
  }
}

function autocapitalizationForInput(
  autoCapitalize?: TextInputProps['autoCapitalize'],
) {
  switch (autoCapitalize) {
    case 'none':
      return 'never' as const;
    case 'characters':
    case 'sentences':
    case 'words':
      return autoCapitalize;
    default:
      return undefined;
  }
}

function contentTypeForInput(
  textContentType?: TextInputProps['textContentType'],
  autoComplete?: TextInputProps['autoComplete'],
) {
  if (textContentType && textContentType !== 'none') {
    return textContentTypeForSwiftUI(textContentType);
  }

  switch (autoComplete) {
    case 'current-password':
    case 'password':
      return 'password' as const;
    case 'email':
      return 'emailAddress' as const;
    case 'family-name':
    case 'name-family':
      return 'familyName' as const;
    case 'given-name':
    case 'name-given':
      return 'givenName' as const;
    case 'name':
      return 'name' as const;
    case 'new-password':
    case 'password-new':
      return 'newPassword' as const;
    case 'nickname':
      return 'nickname' as const;
    case 'one-time-code':
    case 'sms-otp':
      return 'oneTimeCode' as const;
    case 'organization':
      return 'organizationName' as const;
    case 'organization-title':
      return 'jobTitle' as const;
    case 'postal-code':
      return 'postalCode' as const;
    case 'street-address':
      return 'fullStreetAddress' as const;
    case 'tel':
      return 'telephoneNumber' as const;
    case 'url':
      return 'URL' as const;
    case 'username':
    case 'username-new':
      return 'username' as const;
    default:
      return undefined;
  }
}

function textContentTypeForSwiftUI(
  value: Exclude<TextInputProps['textContentType'], undefined | 'none'>,
) {
  switch (value) {
    case 'addressCity':
    case 'addressCityAndState':
    case 'addressState':
    case 'birthdate':
    case 'birthdateDay':
    case 'birthdateMonth':
    case 'birthdateYear':
    case 'cellularEID':
    case 'cellularIMEI':
    case 'countryName':
    case 'creditCardExpiration':
    case 'creditCardExpirationMonth':
    case 'creditCardExpirationYear':
    case 'creditCardFamilyName':
    case 'creditCardGivenName':
    case 'creditCardMiddleName':
    case 'creditCardName':
    case 'creditCardNumber':
    case 'creditCardSecurityCode':
    case 'creditCardType':
    case 'dateTime':
    case 'emailAddress':
    case 'familyName':
    case 'flightNumber':
    case 'fullStreetAddress':
    case 'givenName':
    case 'jobTitle':
    case 'location':
    case 'middleName':
    case 'name':
    case 'namePrefix':
    case 'nameSuffix':
    case 'newPassword':
    case 'nickname':
    case 'oneTimeCode':
    case 'organizationName':
    case 'password':
    case 'postalCode':
    case 'shipmentTrackingNumber':
    case 'streetAddressLine1':
    case 'streetAddressLine2':
    case 'sublocality':
    case 'telephoneNumber':
    case 'URL':
    case 'username':
      return value;
    default:
      return undefined;
  }
}

function textAlignmentForInput(textAlign?: TextStyle['textAlign']) {
  switch (textAlign) {
    case 'center':
      return 'center' as const;
    case 'right':
      return 'trailing' as const;
    case 'left':
      return 'leading' as const;
    default:
      return undefined;
  }
}

function shouldBlurOnSubmit({
  blurOnSubmit,
  multiline,
  submitBehavior,
}: {
  blurOnSubmit?: boolean;
  multiline?: boolean;
  submitBehavior?: TextInputProps['submitBehavior'];
}) {
  if (submitBehavior === 'blurAndSubmit') {
    return true;
  }
  if (submitBehavior === 'submit' || submitBehavior === 'newline') {
    return false;
  }
  if (blurOnSubmit !== undefined) {
    return blurOnSubmit;
  }
  return !multiline;
}

function pickHostStyle(style: TextStyle & ViewStyle): ViewStyle {
  return {
    alignSelf: style.alignSelf,
    bottom: style.bottom,
    display: style.display,
    end: style.end,
    flex: style.flex,
    flexBasis: style.flexBasis,
    flexGrow: style.flexGrow,
    flexShrink: style.flexShrink,
    height: style.height,
    left: style.left,
    margin: style.margin,
    marginBottom: style.marginBottom,
    marginEnd: style.marginEnd,
    marginHorizontal: style.marginHorizontal,
    marginLeft: style.marginLeft,
    marginRight: style.marginRight,
    marginStart: style.marginStart,
    marginTop: style.marginTop,
    marginVertical: style.marginVertical,
    maxHeight: style.maxHeight,
    maxWidth: style.maxWidth,
    minHeight: style.minHeight,
    minWidth: style.minWidth,
    opacity: style.opacity,
    position: style.position,
    right: style.right,
    start: style.start,
    top: style.top,
    transform: style.transform,
    width: style.width,
    zIndex: style.zIndex,
  };
}

function textChangeEvent(text: string) {
  return {
    nativeEvent: { text },
  } as Parameters<NonNullable<TextInputProps['onChange']>>[0];
}

function endEditingEvent(text: string) {
  return {
    nativeEvent: { text },
  } as Parameters<NonNullable<TextInputProps['onEndEditing']>>[0];
}

const styles = StyleSheet.create({
  host: { width: '100%' },
  input: { paddingHorizontal: 16, width: '100%' },
  lg: { height: 56 },
  md: { height: 48 },
  sm: { height: 36 },
  xl: { height: 64 },
  xs: { height: 28 },
  xxl: { height: 72 },
});

const SIZE_STYLES = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
  '2xl': styles.xxl,
} as const;

const FONT_SIZE_STYLES = {
  xs: { fontSize: 12 },
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
  xl: { fontSize: 20 },
  '2xl': { fontSize: 22 },
} as const;
