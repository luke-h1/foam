import { useAccentColor } from '@app/context/AccentColorContext';
import { colors } from '@app/styles/colors';
import {
  getColorValue,
  InputColorConfig,
  RADIUS_VALUES,
  UIColor,
  UIRadius,
  UISize,
} from '@app/styles/ui';
import type { Ref } from 'react';
import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
  useColorScheme,
} from 'react-native';

type InputVariant = 'outline' | 'soft' | 'subtle' | 'underline';
export type InputRef = TextInput;
export type InputSelection = { start: number; end: number };

const generateVariantConfig = (
  color: UIColor,
  colorScheme: 'light' | 'dark',
): Record<InputVariant, InputColorConfig> => {
  const isDark = colorScheme === 'dark';

  if (color === 'black') {
    const bgColor = getColorValue('black', 50);
    const borderColor = getColorValue('black', 50);
    const placeholderColor = getColorValue('black', isDark ? 800 : 300);

    return {
      outline: {
        backgroundColor: 'transparent',
        borderColor,
        textColor: getColorValue('black', 50),
        placeholderColor,
        borderWidth: 1,
      },
      soft: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor: 'transparent',
        textColor: getColorValue('black', 50),
        placeholderColor,
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor,
        textColor: getColorValue('black', 50),
        placeholderColor,
        borderWidth: 1,
      },
      underline: {
        backgroundColor: 'transparent',
        borderColor,
        textColor: getColorValue('black', 50),
        placeholderColor,
        borderWidth: 1,
      },
    };
  }

  if (color === 'white') {
    const bgColor = getColorValue('white', 950);
    const borderColor = getColorValue('white', 950);
    const placeholderColor = getColorValue('white', isDark ? 800 : 300);

    return {
      outline: {
        backgroundColor: 'transparent',
        borderColor,
        textColor: getColorValue('white', 950),
        placeholderColor,
        borderWidth: 1,
      },
      soft: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor: 'transparent',
        textColor: getColorValue('white', 950),
        placeholderColor,
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: `${bgColor}${isDark ? '20' : '10'}`,
        borderColor,
        textColor: getColorValue('white', 950),
        placeholderColor,
        borderWidth: 1,
      },
      underline: {
        backgroundColor: 'transparent',
        borderColor,
        textColor: getColorValue('white', 950),
        placeholderColor,
        borderWidth: 1,
      },
    };
  }

  return {
    outline: {
      backgroundColor: 'transparent',
      borderColor: getColorValue(color, isDark ? 500 : 600),
      textColor: getColorValue(color, isDark ? 500 : 600),
      placeholderColor: getColorValue(color, isDark ? 800 : 300),
      borderWidth: 1,
    },
    soft: {
      backgroundColor: `${getColorValue(color, isDark ? 500 : 600)}${
        isDark ? '20' : '10'
      }`,
      borderColor: 'transparent',
      textColor: getColorValue(color, isDark ? 500 : 600),
      placeholderColor: getColorValue(color, isDark ? 800 : 300),
      borderWidth: 0,
    },
    subtle: {
      backgroundColor: `${getColorValue(color, isDark ? 500 : 600)}${
        isDark ? '20' : '10'
      }`,
      borderColor: getColorValue(color, isDark ? 500 : 600),
      textColor: getColorValue(color, isDark ? 500 : 600),
      placeholderColor: getColorValue(color, isDark ? 800 : 300),
      borderWidth: 1,
    },
    underline: {
      backgroundColor: 'transparent',
      borderColor: getColorValue(color, isDark ? 500 : 600),
      textColor: getColorValue(color, isDark ? 500 : 600),
      placeholderColor: getColorValue(color, isDark ? 800 : 300),
      borderWidth: 1,
    },
  };
};

const generateVariantConfigFromBase = (
  baseHex: string,
  colorScheme: 'light' | 'dark',
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

export function Input({
  onBlur,
  onContentSizeChange,
  onFocus,
  onSelectionChange,
  onSubmitEditing,
  style,
  placeholderTextColor,
  size = 'md',
  variant = 'outline',
  color,
  radius = 'default',
  ref,
  ...rest
}: ThemedInputProps) {
  const colorScheme = useColorScheme();
  const { accentHex } = useAccentColor();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

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

  return (
    <TextInput
      ref={ref}
      onBlur={onBlur ? () => onBlur() : undefined}
      onContentSizeChange={
        onContentSizeChange
          ? event => onContentSizeChange(event.nativeEvent.contentSize)
          : undefined
      }
      onFocus={onFocus ? () => onFocus() : undefined}
      onSelectionChange={
        onSelectionChange
          ? event => onSelectionChange(event.nativeEvent.selection)
          : undefined
      }
      onSubmitEditing={
        onSubmitEditing
          ? event => onSubmitEditing(event.nativeEvent.text)
          : undefined
      }
      placeholderTextColor={
        placeholderTextColor || variantConfig.placeholderColor
      }
      style={inputStyles}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
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
