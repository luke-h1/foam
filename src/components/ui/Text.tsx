import { colors, typography } from '@app/styles';
import React, { forwardRef, ReactNode } from 'react';
import {
  StyleProp,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';

type Sizes = keyof typeof $sizeStyles;
type Weights = keyof typeof typography.primary;
type Presets = keyof typeof $presets;

export interface TextProps extends RNTextProps {
  /**
   * The text to display
   */
  text?: string;
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<TextStyle>;
  /**
   * One of the different types of text presets.
   */
  preset?: Presets;
  /**
   * Text weight modifier.
   */
  weight?: Weights;
  /**
   * Text size modifier.
   */
  size?: Sizes;
  /**
   * Children components.
   */
  children?: ReactNode;
}

const letterSpacing = (value: number) => {
  return 0.16 * value;
};

export const Text = forwardRef<RNText, TextProps>(function Text(props, ref) {
  const {
    weight,
    size,
    text,
    children,
    style: $styleOverride,
    ...rest
  } = props;

  const content = text || children;

  const preset: Presets = props.preset ?? 'default';

  const $styles: StyleProp<TextStyle> | undefined = [
    $presets[preset],
    weight && $fontWeightStyles[weight],
    size && $sizeStyles[size],
    $styleOverride,
  ];

  return (
    <RNText ref={ref} {...rest} style={$styles}>
      {content}
    </RNText>
  );
});

const $sizeStyles = {
  xxxl: { fontSize: 42, lineHeight: 46.2 } satisfies TextStyle,
  xxl: { fontSize: 32, lineHeight: 35.2 } satisfies TextStyle,
  xl: { fontSize: 26, lineHeight: 28.6 } satisfies TextStyle,
  lg: { fontSize: 22, lineHeight: 24.2 } satisfies TextStyle,
  md: { fontSize: 18, lineHeight: 19.8 } satisfies TextStyle,
  sm: { fontSize: 16, lineHeight: 17.6 } satisfies TextStyle,
  xs: { fontSize: 14, lineHeight: 15.4 } satisfies TextStyle,
  xxs: { fontSize: 12, lineHeight: 13.2 } satisfies TextStyle,
};

const $fontWeightStyles = Object.entries(typography.primary).reduce(
  (acc, [weight, fontFamily]) => {
    return { ...acc, [weight]: { fontFamily } };
  },
  {} as Record<Weights, TextStyle>,
) satisfies Record<Weights, TextStyle>;

export const $baseStyle = [
  $sizeStyles.sm,
  $fontWeightStyles.book,
  {
    color: colors.text,
    lineHeight: 22,
  },
] satisfies StyleProp<TextStyle>;

const $secondaryFontWeightStyles = Object.entries(typography.secondary).reduce(
  (acc, [weight, fontFamily]) => {
    return {
      ...acc,
      [weight]: { fontFamily },
    };
  },
  {} as Record<Weights, TextStyle>,
) satisfies Record<Weights, TextStyle>;

export const $baseSecondaryStyle = [
  $sizeStyles.sm,
  $secondaryFontWeightStyles.book,
  {
    color: colors.text,
  },
] satisfies StyleProp<TextStyle>;

const $presets = {
  default: $baseStyle,

  bold: [$baseStyle, $fontWeightStyles.bold] satisfies StyleProp<TextStyle>,

  welcomeHeading: [
    $baseStyle,
    $sizeStyles.xxxl,
    $fontWeightStyles.bold,
  ] satisfies StyleProp<TextStyle>,

  screenHeading: [
    $baseStyle,
    $sizeStyles.xxl,
    $fontWeightStyles.bold,
  ] satisfies StyleProp<TextStyle>,

  cardFooterHeading: [
    $baseStyle,
    $sizeStyles.lg,
    $fontWeightStyles.bold,
  ] satisfies StyleProp<TextStyle>,

  companionHeading: [
    $baseStyle,
    $sizeStyles.md,
    $fontWeightStyles.medium,
  ] satisfies StyleProp<TextStyle>,

  subheading: [
    $baseStyle,
    $sizeStyles.lg,
    $fontWeightStyles.medium,
  ] satisfies StyleProp<TextStyle>,

  boldHeading: [
    $baseStyle,
    $sizeStyles.xl,
    $fontWeightStyles.bold,
  ] satisfies StyleProp<TextStyle>,

  infoText: [
    $baseStyle,
    $sizeStyles.xs,
    $fontWeightStyles.book,
    { lineHeight: 22 },
  ] satisfies StyleProp<TextStyle>,

  formLabel: [
    $baseStyle,
    $fontWeightStyles.medium,
  ] satisfies StyleProp<TextStyle>,

  formHelper: [
    $baseStyle,
    $sizeStyles.sm,
    $fontWeightStyles.book,
  ] satisfies StyleProp<TextStyle>,

  link: [
    $baseSecondaryStyle,
    $sizeStyles.xxs,
    $secondaryFontWeightStyles.medium,
  ] satisfies StyleProp<TextStyle>,

  primaryLabel: [
    $baseSecondaryStyle,
    $sizeStyles.xxs,
    $secondaryFontWeightStyles.medium,
    { color: colors.palette.primary500, textTransform: 'uppercase' },
  ] satisfies StyleProp<TextStyle>,

  streamTitle: [
    $baseSecondaryStyle,
    $sizeStyles.xxs,
    $secondaryFontWeightStyles.medium,
  ] satisfies StyleProp<TextStyle>,

  tag: [
    $baseSecondaryStyle,
    $sizeStyles.xs,
    $secondaryFontWeightStyles.medium,
  ] satisfies StyleProp<TextStyle>,

  navHeader: [
    $baseSecondaryStyle,
    $sizeStyles.sm,
    $secondaryFontWeightStyles.medium,
  ] satisfies StyleProp<TextStyle>,

  listHeading: [
    $baseSecondaryStyle,
    $sizeStyles.sm,
    $secondaryFontWeightStyles.bold,
    { letterSpacing: letterSpacing(8) },
  ] satisfies StyleProp<TextStyle>,

  label: [
    $baseSecondaryStyle,
    $sizeStyles.xxs,
    $secondaryFontWeightStyles.medium,
    { letterSpacing: letterSpacing(8), textTransform: 'uppercase' },
  ] satisfies StyleProp<TextStyle>,
};
