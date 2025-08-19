/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { FontSize, FontWeight, ThemeColor } from '@app/styles';
import { getMargin, MarginProps } from '@app/styles/spacing';
import { ColorScale, Colors } from '@app/styles/util/createPallete';
import { forwardRef, LegacyRef, ReactNode } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Text, TextProps, type FontVariant } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

// Helper type for nested color paths
type NestedColorPath = `${ThemeColor}.${ColorScale | 'contrast'}`;

function getNestedColor(
  // clean me up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any,
  colorPath: ThemeColor | NestedColorPath,
): string {
  if (colorPath.includes('.')) {
    const [colorName, colorScale] = colorPath.split('.') as [
      ThemeColor,
      ColorScale | 'contrast',
    ];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return theme.colors[colorName]?.[colorScale] || theme.colors.gray.text;
  }

  // Fallback to existing logic for backward compatibility
  const color = colorPath as ThemeColor;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return theme.colors[color]?.text || theme.colors.gray.text;
}

export type TypographyStyleProps = {
  align?: 'left' | 'center' | 'right';
  color?: ThemeColor | NestedColorPath;
  contrast?: boolean;
  highContrast?: boolean;
  italic?: boolean;
  size?: FontSize;
  tabular?: boolean;
  fontFamily?: 'SFPro' | 'mono';
  fontWeight?: FontWeight;
} & MarginProps;

export interface TypographyProps
  extends TextProps,
    Partial<TypographyStyleProps> {
  children: ReactNode;
  animated?: boolean;
}

export function addTextSize(size: FontSize, by: number): FontSize {
  const sizeOrder: FontSize[] = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl',
    '4xl',
    '5xl',
  ];
  const currentIndex = sizeOrder.indexOf(size);
  const nextIndex = currentIndex + by;

  if (nextIndex < 0) {
    return 'xs';
  }

  if (nextIndex >= sizeOrder.length) {
    return '5xl';
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return sizeOrder[nextIndex]!;
}

export const Typography = forwardRef<Text, TypographyProps>(
  (
    {
      size = 'md',
      color = 'gray',
      align = 'left',
      contrast = color === 'gray',
      highContrast,
      italic,
      tabular,
      fontWeight = 'regular',
      children,
      style,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      animated,
      // Margin props
      m,
      mb,
      ml,
      mr,
      mt,
      mx,
      my,
      ...props
    }: TypographyProps,
    ref: LegacyRef<Text>,
  ) => {
    const { theme } = useUnistyles();

    // Handle nested color paths or fallback to existing logic
    let resolvedColor: string;

    if (typeof color === 'string' && color.includes('.')) {
      // Handle nested color paths like "gray.accent.ui"
      resolvedColor = getNestedColor(theme, color as NestedColorPath);
    } else {
      // Existing logic for backward compatibility
      const baseColor = color as ThemeColor;
      const resolvedHighContrast = highContrast ?? baseColor === 'gray';
      // eslint-disable-next-line no-nested-ternary
      const contrastLevel = contrast
        ? 'contrast'
        : resolvedHighContrast
          ? 'text'
          : 'textLow';

      resolvedColor =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        theme.colors[baseColor as keyof typeof theme.colors][contrastLevel];
    }

    // Build font variant array
    const fontVariant: FontVariant[] = ['no-contextual', 'stylistic-four'];
    if (tabular) {
      fontVariant.push('tabular-nums');
    }

    // Create style object directly
    const textStyle = {
      ...getMargin(theme)({ m, mb, ml, mr, mt, mx, my }),
      color: resolvedColor,
      fontSize: theme.font.fontSize[size],
      fontStyle: italic ? 'italic' : 'normal',
      fontVariant,
      fontWeight: theme.font.fontWeight[fontWeight],
      // lineHeight: theme.font.fontSize[size].lineHeight * rt.fontScale,
      textAlign: align,
    };

    return (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      <Text ref={ref} {...props} style={[textStyle, style]}>
        {children}
      </Text>
    );
  },
);

Typography.displayName = 'Typography';
