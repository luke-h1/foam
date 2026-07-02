import { getColorValue, InputColorConfig, UIColor } from '@app/styles/ui';

export type InputVariant = 'outline' | 'soft' | 'subtle' | 'underline';

export const generateVariantConfig = (
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

export const generateVariantConfigFromBase = (
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
