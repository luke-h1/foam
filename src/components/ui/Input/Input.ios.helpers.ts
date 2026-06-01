import { colors } from '@app/styles/colors';
import {
  getColorValue,
  type InputColorConfig,
  type UIColor,
} from '@app/styles/ui';
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
import type { RefObject } from 'react';
import {
  StyleSheet,
  type ColorValue,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import type { SecureFieldRef, TextFieldRef } from '@expo/ui/swift-ui';

export type InputVariant = 'outline' | 'soft' | 'subtle' | 'underline';
type ColorScheme = 'light' | 'dark';

const themedColorConfig = (
  color: UIColor,
  colorScheme: ColorScheme,
  tone: 50 | 950,
): Record<InputVariant, InputColorConfig> => {
  const isDark = colorScheme === 'dark';
  const bgColor = getColorValue(color, tone);
  const placeholderColor = getColorValue(color, isDark ? 800 : 300);

  return {
    outline: {
      backgroundColor: 'transparent',
      borderColor: bgColor,
      textColor: bgColor,
      placeholderColor,
      borderWidth: 1,
    },
    soft: {
      backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
      borderColor: 'transparent',
      textColor: bgColor,
      placeholderColor,
      borderWidth: 0,
    },
    subtle: {
      backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
      borderColor: bgColor,
      textColor: bgColor,
      placeholderColor,
      borderWidth: 1,
    },
    underline: {
      backgroundColor: 'transparent',
      borderColor: bgColor,
      textColor: bgColor,
      placeholderColor,
      borderWidth: 1,
    },
  };
};

export const generateVariantConfig = (
  color: UIColor,
  colorScheme: ColorScheme,
): Record<InputVariant, InputColorConfig> => {
  if (color === 'black') {
    return themedColorConfig('black', colorScheme, 50);
  }
  if (color === 'white') {
    return themedColorConfig('white', colorScheme, 950);
  }

  const isDark = colorScheme === 'dark';
  return generateVariantConfigFromBase(
    getColorValue(color, isDark ? 500 : 600),
    colorScheme,
  );
};

export const generateVariantConfigFromBase = (
  baseHex: string,
  colorScheme: ColorScheme,
): Record<InputVariant, InputColorConfig> => {
  const isDark = colorScheme === 'dark';
  const placeholderColor = `${baseHex}${isDark ? '99' : '66'}`;

  return {
    outline: {
      backgroundColor: 'transparent',
      borderColor: baseHex,
      textColor: baseHex,
      placeholderColor,
      borderWidth: 1,
    },
    soft: {
      backgroundColor: `${baseHex}${isDark ? '20' : '10'}`,
      borderColor: 'transparent',
      textColor: baseHex,
      placeholderColor,
      borderWidth: 0,
    },
    subtle: {
      backgroundColor: `${baseHex}${isDark ? '20' : '10'}`,
      borderColor: baseHex,
      textColor: baseHex,
      placeholderColor,
      borderWidth: 1,
    },
    underline: {
      backgroundColor: 'transparent',
      borderColor: baseHex,
      textColor: baseHex,
      placeholderColor,
      borderWidth: 1,
    },
  };
};

export function valueOrDefault(
  value: string | undefined,
  defaultValue: string | undefined,
) {
  return value !== undefined ? value : (defaultValue ?? '');
}

export function currentInputRef({
  secureTextEntry,
  secureFieldRef,
  textFieldRef,
}: {
  secureTextEntry?: boolean;
  secureFieldRef: RefObject<SecureFieldRef | null>;
  textFieldRef: RefObject<TextFieldRef | null>;
}) {
  return secureTextEntry ? secureFieldRef.current : textFieldRef.current;
}

export function colorValue(color: ColorValue | null | undefined): ColorValue {
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
  const maxHeight = numberValue(style.maxHeight);

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

export function fontModifiersForStyle(
  style: TextStyle & ViewStyle,
): ViewModifier[] {
  const size = numberValue(style.fontSize);
  const weight = fontWeightForStyle(style.fontWeight);

  if (size === undefined && weight === undefined) {
    return [];
  }

  return [font({ size, weight })];
}

export function radiusForStyle(style: TextStyle & ViewStyle) {
  return numberValue(style.borderRadius) ?? 0;
}

export function borderWidthForStyle(style: TextStyle & ViewStyle) {
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

export function buildTextFieldModifiers({
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
  const heightFrame = frameForStyle(style, multiline ? 'topLeading' : 'center');
  const keyboard = keyboardTypeForInput(inputMode, keyboardType);
  const submit = submitLabelForInput(enterKeyHint, returnKeyType);
  const autocapitalization = autocapitalizationForInput(autoCapitalize);
  const contentType = contentTypeForInput(textContentType, autoComplete);
  const textAlignment = textAlignmentForInput(textAlign ?? style.textAlign);

  if (heightFrame) {
    modifiers.push(frame(heightFrame));
  }
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

export function buildContainerModifiers({
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

export function shouldBlurOnSubmit({
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

export function pickHostStyle(style: TextStyle & ViewStyle): ViewStyle {
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

export function textChangeEvent(text: string) {
  return {
    nativeEvent: { text },
  } as Parameters<NonNullable<TextInputProps['onChange']>>[0];
}

export function endEditingEvent(text: string) {
  return {
    nativeEvent: { text },
  } as Parameters<NonNullable<TextInputProps['onEndEditing']>>[0];
}

export const styles = StyleSheet.create({
  host: { width: '100%' },
  input: { paddingHorizontal: 16, width: '100%' },
  lg: { height: 56 },
  md: { height: 48 },
  sm: { height: 36 },
  xl: { height: 64 },
  xs: { height: 28 },
  xxl: { height: 72 },
});

export const SIZE_STYLES = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
  '2xl': styles.xxl,
} as const;

export const FONT_SIZE_STYLES = {
  xs: { fontSize: 12 },
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
  xl: { fontSize: 20 },
  '2xl': { fontSize: 22 },
} as const;

export const fallbackAccentColor = (scheme: ColorScheme) => colors[scheme].tint;
