/* eslint-disable react-native/no-unused-styles */
import { useThemeColor } from '@app/hooks/useThemeColor';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
  StyleSheet,
  // eslint-disable-next-line no-restricted-imports
  type TextProps as RNTextProps,
  type TextLayoutLine,
} from 'react-native';

export type TextProps = RNTextProps & {
  children?: ReactNode;
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'base'
    | 'xs'
    | 'sm'
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

  weight?:
    | 'ultralight'
    | 'thin'
    | 'light'
    | 'normal'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'heavy'
    | 'black';

  variant?: 'serif' | 'poster';

  /**
   * When true, balances text across lines to create visually pleasing text blocks.
   * Uses onTextLayout to measure lines and constrains width for balanced wrapping.
   * Best for headlines and short text blocks (2-6 lines).
   * @see https://developer.chrome.com/docs/css-ui/css-text-wrap-balance
   */
  textBalance?: boolean;
};

export function Text({
  style,
  lightColor,
  darkColor,
  type = 'default',
  weight,
  variant,
  textBalance,
  onTextLayout: userOnTextLayout,
  ...rest
}: TextProps) {
  const color = useThemeColor('text', { light: lightColor, dark: darkColor });

  const sizeStyle = sizeStyles[type];

  const selectedFont = getSelectedFont(variant);

  const fontFamilyStyle = selectedFont
    ? getFontFamilyStyle(selectedFont, weight)
    : undefined;

  let adjustedSizeStyle:
    | ReturnType<typeof getBodoniAdjustedSizeStyle>
    | undefined;

  if (selectedFont?.includes('bodoni-moda')) {
    adjustedSizeStyle = getBodoniAdjustedSizeStyle(type);
  } else if (selectedFont === 'oswald') {
    adjustedSizeStyle = getOswaldAdjustedSizeStyle(type);
  }

  const systemFontWeightStyle =
    !selectedFont && weight ? getSystemFontWeightStyle(weight) : undefined;

  const [balanceState, setBalanceState] = useState<{
    width?: number;
    ready: boolean;
  }>(() => ({ ready: !textBalance })); // Ready immediately if not balancing

  const hasProcessed = useRef(false);
  const pendingLines = useRef<TextLayoutLine[] | null>(null);

  const handleTextLayout = useCallback(
    (e: Parameters<NonNullable<RNTextProps['onTextLayout']>>[0]) => {
      userOnTextLayout?.(e);

      if (!textBalance || hasProcessed.current) {
        return;
      }

      pendingLines.current = e.nativeEvent.lines;
      setBalanceState(prev => ({ ...prev })); // Force a re-render
    },
    [textBalance, userOnTextLayout],
  );

  /**
   * Process balance syncronously with Fabric's useLayoutEffect
   * runs after render but before paint
   */
  useLayoutEffect(() => {
    if (!textBalance || hasProcessed.current || !pendingLines.current) {
      return;
    }

    const lines = pendingLines.current;
    hasProcessed.current = true;
    pendingLines.current = null;

    // only balance 2-6 lines for perf
    if (lines.length < 2 || lines.length > 6) {
      setBalanceState({ ready: true });
      return;
    }

    const lineWidths = lines.map(line => line.width);
    const maxLineWidth = Math.max(...lineWidths);
    const totalWidth = lineWidths.reduce((sum, w) => sum + w, 0);
    const avgWidth = totalWidth / lines.length;

    /**
     * Calculate target width that would create more balanced lines
     * similar to the browser algorithm. Find smallest width that maintains line count
     */

    const targetWidth = Math.ceil(
      Math.max(avgWidth * 1.05, maxLineWidth * 0.82),
    );

    /**
     * Only apply if it would actually reduce the max width in a meaningful way
     */
    if (targetWidth < maxLineWidth - 10) {
      setBalanceState({ width: targetWidth, ready: true });
    }

    setBalanceState({ ready: true });
  }, [textBalance, balanceState]);

  /**
   * - Hidden (opacity: 0) while measuring to prevent visual shift
   * - Constrained width and aligned to start once balanced
   */
  let balanceStyle:
    | {
        maxWidth?: number;
        alignSelf?: 'flex-start';
        opacity?: number;
      }
    | undefined;

  if (textBalance) {
    balanceStyle = {};

    if (balanceState.width) {
      balanceStyle.maxWidth = balanceState.width;
      balanceStyle.alignSelf = 'flex-start';
    }

    // Hide until ready - Fabric ensures this happens before paint
    if (!balanceState.ready) {
      balanceStyle.opacity = 0;
    }
  }

  return (
    <RNText
      style={[
        { color },
        sizeStyle,
        adjustedSizeStyle,
        fontFamilyStyle,
        systemFontWeightStyle,
        balanceStyle,
        style,
      ]}
      textBreakStrategy="simple"
      onTextLayout={textBalance ? handleTextLayout : userOnTextLayout}
      {...rest}
    />
  );
}

function getSelectedFont(variant?: string): string | undefined {
  switch (variant) {
    case 'serif':
      return 'bodoni-moda';
    case 'poster':
      return 'oswald';
    default:
      return undefined;
  }
}

function getFontFamilyStyle(fontFamily: string, weight?: string) {
  const isItalic = fontFamily.includes('italic');

  if (fontFamily.includes('bodoni-moda')) {
    const weightMap: Record<string, string> = {
      ultralight: isItalic
        ? 'BodoniModa_400Regular_Italic'
        : 'BodoniModa_400Regular', // No ultralight, fallback to regular
      thin: isItalic ? 'BodoniModa_400Regular_Italic' : 'BodoniModa_400Regular', // No thin, fallback to regular
      light: isItalic
        ? 'BodoniModa_400Regular_Italic'
        : 'BodoniModa_400Regular', // No light, fallback to regular
      normal: isItalic
        ? 'BodoniModa_400Regular_Italic'
        : 'BodoniModa_400Regular',
      medium: isItalic ? 'BodoniModa_500Medium_Italic' : 'BodoniModa_500Medium',
      semibold: isItalic
        ? 'BodoniModa_600SemiBold_Italic'
        : 'BodoniModa_600SemiBold',
      bold: isItalic ? 'BodoniModa_700Bold_Italic' : 'BodoniModa_700Bold',
      heavy: isItalic
        ? 'BodoniModa_800ExtraBold_Italic'
        : 'BodoniModa_800ExtraBold',
      black: isItalic ? 'BodoniModa_900Black_Italic' : 'BodoniModa_900Black',
    };
    return { fontFamily: weightMap[weight || 'normal'] };
  }

  if (fontFamily === 'oswald') {
    const weightMap: Record<string, string> = {
      ultralight: 'Oswald_200ExtraLight',
      thin: 'Oswald_200ExtraLight',
      light: 'Oswald_300Light',
      normal: 'Oswald_400Regular',
      medium: 'Oswald_500Medium',
      semibold: 'Oswald_600SemiBold',
      bold: 'Oswald_700Bold',
      heavy: 'Oswald_700Bold',
      black: 'Oswald_700Bold',
    };
    return { fontFamily: weightMap[weight || 'normal'] };
  }

  return undefined;
}

function getBodoniAdjustedSizeStyle(type: string) {
  const adjustments: Record<string, { lineHeight: number }> = {
    xs: { lineHeight: 18 },
    sm: { lineHeight: 22 },
    default: { lineHeight: 28 },
    base: { lineHeight: 28 },
    lg: { lineHeight: 32 },
    xl: { lineHeight: 32 },
    '2xl': { lineHeight: 36 },
    '3xl': { lineHeight: 42 },
    '4xl': { lineHeight: 50 },
    '5xl': { lineHeight: 66 },
    '6xl': { lineHeight: 80 },
    '7xl': { lineHeight: 96 },
    '8xl': { lineHeight: 128 },
    '9xl': { lineHeight: 168 },
    '10xl': { lineHeight: 208 },
    '11xl': { lineHeight: 248 },
    '12xl': { lineHeight: 288 },
    title: { lineHeight: 40 },
    subtitle: { lineHeight: 32 },
    body: { lineHeight: 24 },
    caption: { lineHeight: 18 },
    link: { lineHeight: 34 },
  };

  return adjustments[type] || {};
}

function getOswaldAdjustedSizeStyle(type: string) {
  const adjustments: Record<string, { lineHeight: number }> = {
    '8xl': { lineHeight: 120 },
    '9xl': { lineHeight: 160 },
    '10xl': { lineHeight: 200 },
    '11xl': { lineHeight: 240 },
    '12xl': { lineHeight: 280 },
  };

  return adjustments[type] || {};
}

function getSystemFontWeightStyle(weight: string) {
  const weightStyles: Record<
    string,
    {
      fontWeight:
        | '100'
        | '200'
        | '300'
        | '400'
        | '500'
        | '600'
        | '700'
        | '800'
        | '900';
    }
  > = {
    ultralight: { fontWeight: '100' },
    thin: { fontWeight: '200' },
    light: { fontWeight: '300' },
    normal: { fontWeight: '400' },
    medium: { fontWeight: '500' },
    semibold: { fontWeight: '600' },
    bold: { fontWeight: '700' },
    heavy: { fontWeight: '800' },
    black: { fontWeight: '900' },
  };

  return weightStyles[weight] || { fontWeight: '400' };
}

const sizeStyles = StyleSheet.create({
  '10xl': { fontSize: 160, lineHeight: 192 },
  '11xl': { fontSize: 192, lineHeight: 230 },
  '12xl': { fontSize: 220, lineHeight: 268 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 44 },
  '5xl': { fontSize: 48, lineHeight: 58 },
  '6xl': { fontSize: 60, lineHeight: 72 },
  '7xl': { fontSize: 72, lineHeight: 86 },
  '8xl': { fontSize: 96, lineHeight: 116 },
  '9xl': { fontSize: 128, lineHeight: 154 },
  base: { fontSize: 16, lineHeight: 24 },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  default: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  link: { fontSize: 16, lineHeight: 30 },
  sm: { fontSize: 14, lineHeight: 20 },
  subtitle: { fontSize: 20, lineHeight: 28 },
  title: { fontSize: 32, lineHeight: 32 },
  xl: { fontSize: 20, lineHeight: 28 },
  xs: { fontSize: 12, lineHeight: 16 },
});
