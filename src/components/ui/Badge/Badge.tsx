import { useAccentColor } from '@app/context/AccentColorContext';
import { colors } from '@app/styles/colors';
import {
  UIColor,
  ColorConfig,
  getColorValue,
  UISize,
  UIRadius,
  RADIUS_VALUES,
} from '@app/styles/ui';
import { SFSymbol } from 'expo-symbols';
import React, { useMemo } from 'react';
import { StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
import { Icon } from '../Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';

type BadgeVariant = 'solid' | 'outline' | 'soft' | 'subtle';

const generateVariantConfig = (
  color: UIColor,
  colorScheme: 'light' | 'dark',
): Record<BadgeVariant, ColorConfig> => {
  const isDark = colorScheme === 'dark';

  if (color === 'black') {
    const bgColor = getColorValue('black', 50);
    const textColor = getColorValue('black', 950);
    const borderColor = bgColor;

    return {
      solid: {
        backgroundColor: bgColor,
        borderColor,
        textColor,
        borderWidth: 1,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor,
        textColor: bgColor,
        borderWidth: 1,
      },
      soft: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor: 'transparent',
        textColor: bgColor,
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor,
        textColor: bgColor,
        borderWidth: 1,
      },
    };
  }

  if (color === 'white') {
    const bgColor = getColorValue('white', 950);
    const textColor = getColorValue('white', 50);
    const borderColor = bgColor;

    return {
      solid: {
        backgroundColor: bgColor,
        borderColor,
        textColor,
        borderWidth: 1,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor,
        textColor: bgColor,
        borderWidth: 1,
      },
      soft: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor: 'transparent',
        textColor: bgColor,
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor,
        textColor: bgColor,
        borderWidth: 1,
      },
    };
  }

  if (color === 'neutral') {
    const bgColor = isDark
      ? getColorValue('white', 950)
      : getColorValue('black', 50);
    const textColor = isDark
      ? getColorValue('white', 50)
      : getColorValue('black', 950);
    const borderColor = bgColor;
    return {
      solid: {
        backgroundColor: bgColor,
        borderColor,
        textColor,
        borderWidth: 1,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor,
        textColor: bgColor,
        borderWidth: 1,
      },
      soft: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor: 'transparent',
        textColor: bgColor,
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor,
        textColor: bgColor,
        borderWidth: 1,
      },
    };
  }

  return {
    solid: {
      backgroundColor: getColorValue(color, isDark ? 500 : 600),
      borderColor: getColorValue(color, isDark ? 500 : 600),
      textColor: getColorValue(color, isDark ? 950 : 50),
      borderWidth: 1,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: getColorValue(color, isDark ? 500 : 600),
      textColor: getColorValue(color, isDark ? 500 : 600),
      borderWidth: 1,
    },
    soft: {
      backgroundColor: `${getColorValue(color, isDark ? 500 : 600)}${
        isDark ? '20' : '10'
      }`,
      borderColor: 'transparent',
      textColor: getColorValue(color, isDark ? 500 : 600),
      borderWidth: 0,
    },
    subtle: {
      backgroundColor: `${getColorValue(color, isDark ? 500 : 600)}${
        isDark ? '20' : '10'
      }`,
      borderColor: getColorValue(color, isDark ? 500 : 600),
      textColor: getColorValue(color, isDark ? 500 : 600),
      borderWidth: 1,
    },
  };
};

const generateVariantConfigFromBase = (
  baseHex: string,
  colorScheme: 'light' | 'dark',
): Record<BadgeVariant, ColorConfig> => {
  const isDark = colorScheme === 'dark';
  const highContrastText = isDark
    ? getColorValue('zinc', 950)
    : getColorValue('zinc', 50);

  return {
    solid: {
      backgroundColor: baseHex,
      borderColor: baseHex,
      textColor: highContrastText,
      borderWidth: 1,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: baseHex,
      textColor: baseHex,
      borderWidth: 1,
    },
    soft: {
      backgroundColor: `${baseHex}${isDark ? '20' : '10'}`,
      borderColor: 'transparent',
      textColor: baseHex,
      borderWidth: 0,
    },
    subtle: {
      backgroundColor: `${baseHex}${isDark ? '20' : '10'}`,
      borderColor: baseHex,
      textColor: baseHex,
      borderWidth: 1,
    },
  };
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  color?: UIColor;
  size?: UISize;
  radius?: UIRadius;
  style?: ViewStyle;
  symbol?: string;
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

  const variantConfig = useMemo(() => {
    if (color) {
      const variants = generateVariantConfig(color, scheme);
      return variants[variant];
    }
    const baseHex = accentHex || colors[scheme].tint;
    const variants = generateVariantConfigFromBase(baseHex, scheme);
    return variants[variant];
  }, [accentHex, color, scheme, variant]);

  const badgeStyles = useMemo(() => {
    const baseStyles: ViewStyle = {
      ...styles.badge,
      ...SIZE_STYLES[size],
      backgroundColor: variantConfig.backgroundColor,
      borderColor: variantConfig.borderColor,
      borderWidth: variantConfig.borderWidth,
      borderRadius: RADIUS_VALUES[radius],
    };

    return [baseStyles, style];
  }, [size, variantConfig, style, radius]);

  const textStyles = useMemo(() => {
    return [
      styles.badgeText,
      TEXT_SIZE_STYLES[size],
      { color: variantConfig.textColor },
    ];
  }, [size, variantConfig]);

  const iconColor = variantConfig.textColor;
  const shouldCenterIcon = !children && symbol;

  return (
    <View style={[...badgeStyles, shouldCenterIcon && styles.iconOnly]}>
      {symbol && (
        <Icon symbol={symbol as SFSymbol} size={size} color={iconColor} />
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
