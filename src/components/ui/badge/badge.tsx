import React from 'react';
import { StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';

import { SFSymbol, SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { useAccentColor } from '@app/context/accent-color-context';
import { colors } from '@app/styles/colors';
import {
  ColorConfig,
  getColorValue,
  RADIUS_VALUES,
  UIColor,
  UIRadius,
  UISize,
} from '@app/styles/ui';

type BadgeVariant = 'solid' | 'outline' | 'soft' | 'subtle';

/**
 * One resolved ColorConfig per badge variant, for a single colour and scheme.
 */
interface BadgeVariantColors {
  solid: ColorConfig;
  outline: ColorConfig;
  soft: ColorConfig;
  subtle: ColorConfig;
}

const buildVariantColors = (
  baseHex: string,
  solidTextColor: string,
  isDark: boolean,
): BadgeVariantColors => {
  const tintedBackground = `${baseHex}${isDark ? '20' : '10'}`;

  return {
    solid: {
      backgroundColor: baseHex,
      borderColor: baseHex,
      textColor: solidTextColor,
      borderWidth: 1,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: baseHex,
      textColor: baseHex,
      borderWidth: 1,
    },
    soft: {
      backgroundColor: tintedBackground,
      borderColor: 'transparent',
      textColor: baseHex,
      borderWidth: 0,
    },
    subtle: {
      backgroundColor: tintedBackground,
      borderColor: baseHex,
      textColor: baseHex,
      borderWidth: 1,
    },
  };
};

const generateVariantConfig = (
  color: UIColor,
  colorScheme: 'light' | 'dark',
): BadgeVariantColors => {
  const isDark = colorScheme === 'dark';
  const isWhite = color === 'white' || (color === 'neutral' && isDark);
  const isBlack = color === 'black' || (color === 'neutral' && !isDark);

  if (isWhite) {
    return buildVariantColors(
      getColorValue('white', 950),
      getColorValue('white', 50),
      isDark,
    );
  }

  if (isBlack) {
    return buildVariantColors(
      getColorValue('black', 50),
      getColorValue('black', 950),
      isDark,
    );
  }

  return buildVariantColors(
    getColorValue(color, isDark ? 500 : 600),
    getColorValue(color, isDark ? 950 : 50),
    isDark,
  );
};

const generateVariantConfigFromBase = (
  baseHex: string,
  colorScheme: 'light' | 'dark',
): BadgeVariantColors => {
  const isDark = colorScheme === 'dark';

  return buildVariantColors(
    baseHex,
    getColorValue('zinc', isDark ? 950 : 50),
    isDark,
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  color?: UIColor;
  size?: UISize;
  radius?: UIRadius;
  style?: ViewStyle;
  symbol?: SFSymbol;
}

export function Badge({
  children,
  variant = 'soft',
  color,
  size = 'sm',
  radius = 'full',
  style,
  symbol,
}: BadgeProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const { accentHex } = useAccentColor();

  const variantConfig = color
    ? generateVariantConfig(color, scheme)[variant]
    : generateVariantConfigFromBase(accentHex || colors[scheme].tint, scheme)[
        variant
      ];

  const badgeStyles = [
    {
      ...styles.badge,
      ...SIZE_STYLES[size],
      backgroundColor: variantConfig.backgroundColor,
      borderColor: variantConfig.borderColor,
      borderWidth: variantConfig.borderWidth,
      borderRadius: RADIUS_VALUES[radius],
      borderCurve: 'continuous',
    },
    style,
  ];

  const textStyles = [
    styles.badgeText,
    TEXT_SIZE_STYLES[size],
    { color: variantConfig.textColor },
  ];

  const iconColor = variantConfig.textColor;
  const shouldCenterIcon = !children && symbol;

  return (
    <View style={[...badgeStyles, shouldCenterIcon && styles.iconOnly]}>
      {symbol && (
        <SymbolView
          name={symbol}
          size={SYMBOL_SIZE[size]}
          tintColor={iconColor}
        />
      )}
      {children && <Text style={textStyles}>{children}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  iconOnly: {
    gap: 0,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  lg: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  lgText: { fontSize: 16 },
  md: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mdText: { fontSize: 14 },
  sm: {
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smText: { fontSize: 12 },
  xl: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  xlText: { fontSize: 18 },
  xs: {
    minHeight: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  xsText: { fontSize: 10 },
  xxl: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  xxlText: { fontSize: 20 },
});

const SIZE_STYLES = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
  '2xl': styles.xxl,
} as const;

const TEXT_SIZE_STYLES = {
  xs: styles.xsText,
  sm: styles.smText,
  md: styles.mdText,
  lg: styles.lgText,
  xl: styles.xlText,
  '2xl': styles.xxlText,
} as const;

const SYMBOL_SIZE = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 30,
  '2xl': 34,
} satisfies Record<UISize, number>;
