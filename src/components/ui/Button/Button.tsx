/* eslint-disable no-restricted-imports */
import { useAccentColor } from '@app/context/AccentColorContext';
import { impact } from '@app/lib/haptics';
import { colors } from '@app/styles/colors';
import {
  UIColor,
  ColorConfig,
  getColorValue,
  UIRadius,
  UISize,
  RADIUS_VALUES,
} from '@app/styles/ui';
import { SFSymbol, SymbolView } from 'expo-symbols';
import { PressableScale } from 'pressto';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
import type { ReactNode } from 'react';

type ButtonVariant = 'solid' | 'outline' | 'soft' | 'subtle' | 'link';

const generateVariantConfig = (
  color: UIColor,
  colorScheme: 'light' | 'dark',
): Record<ButtonVariant, ColorConfig> => {
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
      link: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: bgColor,
        borderWidth: 0,
      },
    };
  }

  if (color === 'white') {
    const bgColor = getColorValue('white', 950); // Full white
    const textColor = getColorValue('white', 50); // Full black
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
      link: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: bgColor,
        borderWidth: 0,
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
      link: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: bgColor,
        borderWidth: 0,
      },
    };
  }

  if (color === 'transparent') {
    const textColor = isDark
      ? getColorValue('white', 950)
      : getColorValue('black', 950);
    const subtleBorderColor = isDark
      ? getColorValue('gray', 700)
      : getColorValue('gray', 300);

    return {
      solid: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: subtleBorderColor,
        textColor,
        borderWidth: 1,
      },
      soft: {
        backgroundColor: `${subtleBorderColor}${isDark ? '20' : '10'}`,
        borderColor: 'transparent',
        textColor,
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: `${subtleBorderColor}${isDark ? '20' : '10'}`,
        borderColor: subtleBorderColor,
        textColor,
        borderWidth: 1,
      },
      link: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor,
        borderWidth: 0,
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
    link: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: getColorValue(color, isDark ? 500 : 600),
      borderWidth: 0,
    },
  };
};

const generateVariantConfigFromBase = (
  baseHex: string,
  colorScheme: 'light' | 'dark',
): Record<ButtonVariant, ColorConfig> => {
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
    link: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: baseHex,
      borderWidth: 0,
    },
  };
};

interface ConfirmationAlert {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
}

interface ButtonProps {
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  color?: UIColor;
  size?: UISize;
  radius?: UIRadius;
  style?: ViewStyle;
  symbol?: string;
  haptic?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  confirmationAlert?: ConfirmationAlert;
}

export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'outline',
  color,
  size = 'md',
  radius = 'md',
  style,
  symbol,
  haptic = false,
  hapticStyle = 'light',
  confirmationAlert,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const { accentHex } = useAccentColor();

  const scheme = (colorScheme ?? 'light') as 'light' | 'dark';
  const variants = color
    ? generateVariantConfig(color, scheme)
    : generateVariantConfigFromBase(accentHex || colors[scheme].tint, scheme);
  const variantConfig = variants[variant];

  const isDisabled = disabled || loading;

  const baseStyles: ViewStyle = {
    ...styles.button,
    ...SIZE_STYLES[size],
    backgroundColor: variantConfig.backgroundColor,
    borderColor: variantConfig.borderColor,
    borderWidth: variantConfig.borderWidth,
    borderRadius: RADIUS_VALUES[radius],
  };
  const buttonStyles = [baseStyles, style];

  const textStyles = [
    styles.buttonText,
    TEXT_SIZE_STYLES[size],
    { color: variantConfig.textColor },
  ];

  const iconColor = variantConfig.textColor;
  const displayIcon: SFSymbol = loading
    ? 'arrow.2.circlepath'
    : (symbol as SFSymbol);

  const handlePress = () => {
    if (!isDisabled) {
      // Haptic feedback
      if (haptic) {
        void impact(hapticStyle);
      }
      if (confirmationAlert) {
        Alert.alert(confirmationAlert.title, confirmationAlert.message, [
          {
            text: confirmationAlert.cancelText || 'Cancel',
            style: 'cancel',
            onPress: confirmationAlert.onCancel,
          },
          {
            text: confirmationAlert.confirmText || 'Confirm',
            style: 'default',
            onPress: confirmationAlert.onConfirm || onPress,
          },
        ]);
      } else {
        onPress();
      }
    }
  };

  let buttonIcon: ReactNode = null;
  if (loading) {
    buttonIcon = <ActivityIndicator color={iconColor} />;
  } else if (displayIcon) {
    buttonIcon = (
      <SymbolView
        name={displayIcon}
        size={SYMBOL_SIZE[size]}
        tintColor={iconColor}
      />
    );
  }

  return (
    <PressableScale
      style={buttonStyles}
      onPress={isDisabled ? undefined : handlePress}
    >
      {buttonIcon}
      {title && <Text style={textStyles}>{title}</Text>}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    transform: [{ perspective: 1 }],
    width: '100%',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    willChange: 'transform',
  },
  buttonText: { fontWeight: '600', textAlign: 'center' },
  // eslint-disable-next-line react-native/no-unused-styles
  disabled: { opacity: 0.5 },
  // eslint-disable-next-line react-native/no-unused-styles
  iconOnly: {
    gap: 0,
    justifyContent: 'center',
  },
  lg: { height: 56 },
  lgText: { fontSize: 18 },
  md: { height: 48 },
  mdText: { fontSize: 16 },
  // eslint-disable-next-line react-native/no-unused-styles
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
    transitionDuration: '150ms',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-in-out',
  },
  sm: { height: 36 },
  smText: { fontSize: 14 },
  xl: { height: 64 },
  xlText: { fontSize: 20 },
  xs: { height: 28 },
  xsText: { fontSize: 12 },
  xxl: { height: 72 },
  xxlText: { fontSize: 22 },
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
