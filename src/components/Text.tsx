import { useAppTheme } from '@app/context/ThemeContext';
import { ThemedStyle, ThemedStyleArray } from '@app/theme';
import { typography } from '@app/theme/typography';
import { ReactNode } from 'react';
import {
  StyleProp,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';

type Sizes = keyof typeof sizeStyles;
type Weights = keyof typeof typography.primary;

type Presets =
  | 'default'
  | 'bold'
  | 'heading'
  | 'subheading'
  | 'formLabel'
  | 'formHelper';

export interface TextProps extends RNTextProps {
  text?: string;
  style?: StyleProp<TextStyle>;
  preset?: Presets;
  weight?: Weights;
  size?: Sizes;
  children?: ReactNode;
}

export default function Text({
  weight,
  size,
  preset: _preset,
  text,
  children,
  style: styleOverride,
  ...rest
}: TextProps) {
  const { themed } = useAppTheme();

  const content = text || children;

  const preset = _preset ?? 'default';

  const styles: StyleProp<TextStyle> = [
    themed(presets[preset]),
    weight && fontWeightStyles[weight],
    size && sizeStyles[size],
    styleOverride,
  ];

  return (
    <RNText {...rest} style={styles}>
      {content}
    </RNText>
  );
}

const sizeStyles = {
  xxl: { fontSize: 36, lineHeight: 44 } satisfies TextStyle,
  xl: { fontSize: 24, lineHeight: 34 } satisfies TextStyle,
  lg: { fontSize: 20, lineHeight: 32 } satisfies TextStyle,
  md: { fontSize: 18, lineHeight: 26 } satisfies TextStyle,
  sm: { fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  xs: { fontSize: 14, lineHeight: 21 } satisfies TextStyle,
  xxs: { fontSize: 12, lineHeight: 18 } satisfies TextStyle,
};

const fontWeightStyles = Object.entries(typography.primary).reduce(
  (acc, [weight, fontFamily]) => {
    return { ...acc, [weight]: { fontFamily } };
  },
  {},
) as Record<Weights, TextStyle>;

const baseStyle: ThemedStyle<TextStyle> = theme => ({
  ...sizeStyles.sm,
  ...fontWeightStyles.normal,
  color: theme.colors.text,
});

const presets: Record<Presets, ThemedStyleArray<TextStyle>> = {
  default: [baseStyle],
  bold: [baseStyle, { ...fontWeightStyles.bold }],
  heading: [
    baseStyle,
    {
      ...sizeStyles.xxl,
      ...fontWeightStyles.bold,
    },
  ],
  subheading: [baseStyle, { ...sizeStyles.lg, ...fontWeightStyles.medium }],
  formLabel: [baseStyle, { ...fontWeightStyles.medium }],
  formHelper: [baseStyle, { ...sizeStyles.sm, ...fontWeightStyles.normal }],
};
