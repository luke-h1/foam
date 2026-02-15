import { ThemeColor } from '@app/styles/colors';
import { getMargin, MarginProps } from '@app/styles/spacing';
import { ColorScale } from '@app/styles/util/createPallete';
import { forwardRef, LegacyRef, ReactNode } from 'react';

import {
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
  // eslint-disable-next-line no-restricted-imports
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

// Helper type for nested color paths
type NestedColorPath = `${ThemeColor}.${ColorScale | 'contrast'}`;

function getNestedColor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any,
  colorPath: ThemeColor | NestedColorPath,
): string {
  if (colorPath.includes('.')) {
    const [colorName, colorScale] = colorPath.split('.') as [
      ThemeColor,
      ColorScale | 'contrast',
    ];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return theme.colors[colorName]?.[colorScale] || theme.colors.gray.text;
  }

  const color = colorPath as ThemeColor;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return theme.colors[color]?.text || theme.colors.gray.text;
}

export type TextType =
  | 'default'
  | 'base'
  | 'xxxs'
  | 'xxs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | '8xl'
  | '9xl'
  | '10xl'
  | '11xl'
  | '12xl'
  | 'title'
  | 'subtitle'
  | 'link'
  | 'body'
  | 'caption';

export type TextWeight =
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

export type TextVariant = 'default' | 'mono';

export interface TextProps extends RNTextProps, MarginProps {
  children?: ReactNode;
  type?: TextType;
  weight?: TextWeight;
  variant?: TextVariant;
  color?: ThemeColor | NestedColorPath;
  contrast?: boolean;
  highContrast?: boolean;
  italic?: boolean;
  tabular?: boolean;
  align?: 'left' | 'center' | 'right';
}

// Font weight mapping
const weightMap: Record<TextWeight, TextStyle['fontWeight']> = {
  black: '900',
  bold: '700',
  heavy: '800',
  light: '300',
  medium: '500',
  normal: '400',
  semibold: '600',
  thin: '200',
  ultralight: '100',
};

// Size styles with fontSize and lineHeight
const sizeStyles = StyleSheet.create({
  '10xl': { fontSize: 128, lineHeight: 154 },
  '11xl': { fontSize: 160, lineHeight: 192 },
  '12xl': { fontSize: 192, lineHeight: 230 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 28, lineHeight: 36 },
  '4xl': { fontSize: 32, lineHeight: 44 },
  '5xl': { fontSize: 36, lineHeight: 48 },
  '6xl': { fontSize: 48, lineHeight: 58 },
  '7xl': { fontSize: 60, lineHeight: 72 },
  '8xl': { fontSize: 72, lineHeight: 86 },
  '9xl': { fontSize: 96, lineHeight: 116 },
  base: { fontSize: 16, lineHeight: 24 },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  default: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 28 },
  link: { fontSize: 16, lineHeight: 24 },
  md: { fontSize: 18, lineHeight: 28 },
  sm: { fontSize: 16, lineHeight: 24 },
  subtitle: { fontSize: 20, lineHeight: 28 },
  title: { fontSize: 32, lineHeight: 40 },
  xl: { fontSize: 22, lineHeight: 28 },
  xs: { fontSize: 14, lineHeight: 20 },
  xxs: { fontSize: 12, lineHeight: 16 },
  xxxs: { fontSize: 10, lineHeight: 14 },
});

export const Text = forwardRef<RNText, TextProps>(
  (
    {
      type = 'default',
      weight = 'normal',
      variant = 'default',
      color = 'gray',
      contrast = color === 'gray',
      highContrast,
      italic,
      tabular,
      align = 'left',
      children,
      style,
      // Margin props
      m,
      mb,
      ml,
      mr,
      mt,
      mx,
      my,
      ...props
    }: TextProps,
    ref: LegacyRef<RNText>,
  ) => {
    const { theme } = useUnistyles();

    // Resolve color
    let resolvedColor: string;

    if (typeof color === 'string' && color.includes('.')) {
      resolvedColor = getNestedColor(theme, color as NestedColorPath);
    } else {
      const baseColor = color as ThemeColor;
      const resolvedHighContrast = highContrast ?? baseColor === 'gray';
      // eslint-disable-next-line no-nested-ternary
      const contrastLevel = contrast
        ? 'contrast'
        : resolvedHighContrast
          ? 'text'
          : 'textLow';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      resolvedColor = (theme.colors as any)[baseColor][contrastLevel];
    }

    const sizeStyle = sizeStyles[type];

    const textStyle: TextStyle = {
      ...getMargin(theme)({ m, mb, ml, mr, mt, mx, my }),
      color: resolvedColor,
      fontFamily: variant === 'mono' ? 'monospace' : undefined,
      fontStyle: italic ? 'italic' : 'normal',
      fontVariant: tabular ? ['tabular-nums'] : undefined,
      fontWeight: weightMap[weight],
      textAlign: align,
    };

    return (
      <RNText
        ref={ref}
        textBreakStrategy="simple"
        {...props}
        style={[sizeStyle, textStyle, style]}
      >
        {children}
      </RNText>
    );
  },
);

Text.displayName = 'Text';

// Helper function to increment/decrement text size
export function addTextSize(type: TextType, by: number): TextType {
  const sizeOrder: TextType[] = [
    'xxxs',
    'xxs',
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl',
    '4xl',
    '5xl',
    '6xl',
    '7xl',
    '8xl',
    '9xl',
    '10xl',
    '11xl',
    '12xl',
  ];

  // Handle semantic types by mapping to their closest size
  const semanticMapping: Record<string, TextType> = {
    base: 'sm',
    body: 'xs',
    caption: 'xxs',
    default: 'sm',
    link: 'sm',
    subtitle: 'lg',
    title: '4xl',
  };

  const normalizedType = semanticMapping[type] || type;
  const currentIndex = sizeOrder.indexOf(normalizedType);

  if (currentIndex === -1) {
    return type;
  }

  const nextIndex = currentIndex + by;

  if (nextIndex < 0) {
    return 'xxxs';
  }

  if (nextIndex >= sizeOrder.length) {
    return '12xl';
  }

  return sizeOrder[nextIndex] ?? 'default';
}
