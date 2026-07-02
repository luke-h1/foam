import { getColorValue, InputColorConfig, UIColor } from '@app/styles/ui';

export type InputVariant = 'outline' | 'soft' | 'subtle' | 'underline';

const buildVariants = (
  mainColor: string,
  placeholderColor: string,
  softAlpha: string,
): Record<InputVariant, InputColorConfig> => {
  const softBackground =
    mainColor === 'transparent' ? 'transparent' : `${mainColor}${softAlpha}`;

  return {
    outline: {
      backgroundColor: 'transparent',
      borderColor: mainColor,
      textColor: mainColor,
      placeholderColor,
      borderWidth: 1,
    },
    soft: {
      backgroundColor: softBackground,
      borderColor: 'transparent',
      textColor: mainColor,
      placeholderColor,
      borderWidth: 0,
    },
    subtle: {
      backgroundColor: softBackground,
      borderColor: mainColor,
      textColor: mainColor,
      placeholderColor,
      borderWidth: 1,
    },
    underline: {
      backgroundColor: 'transparent',
      borderColor: mainColor,
      textColor: mainColor,
      placeholderColor,
      borderWidth: 1,
    },
  };
};

export const generateVariantConfig = (
  color: UIColor,
  colorScheme: 'light' | 'dark',
): Record<InputVariant, InputColorConfig> => {
  const isDark = colorScheme === 'dark';
  const softAlpha = isDark ? '20' : '10';

  if (color === 'black') {
    return buildVariants(
      getColorValue('black', 50),
      getColorValue('black', isDark ? 800 : 300),
      softAlpha,
    );
  }

  if (color === 'white') {
    return buildVariants(
      getColorValue('white', 950),
      getColorValue('white', isDark ? 800 : 300),
      softAlpha,
    );
  }

  return buildVariants(
    getColorValue(color, isDark ? 500 : 600),
    getColorValue(color, isDark ? 800 : 300),
    softAlpha,
  );
};

export const generateVariantConfigFromBase = (
  baseHex: string,
  colorScheme: 'light' | 'dark',
): Record<InputVariant, InputColorConfig> => {
  const isDark = colorScheme === 'dark';

  return buildVariants(
    baseHex,
    `${baseHex}${isDark ? '99' : '66'}`,
    isDark ? '20' : '10',
  );
};
