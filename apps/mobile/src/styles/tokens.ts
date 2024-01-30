import { createTokens } from 'tamagui';
import { iconSizes } from './iconSizes';

export interface Color {
  primary: string;
  black: string;
  gray: string;
  tag: string;
  green: string;
  red: string;
  purple: string;
}

const lightColors: Color = {
  // light
  primary: '#f7f7f8',
  black: '#000014',
  gray: '#3a3a44',
  tag: '#323235',
  green: '#14b866',
  red: '#ec1414',
  purple: '#bf94ff',
};

const darkColors: Color = {
  primary: '#000014',
  black: '#efeff1',
  gray: '#7f7f8b',
  tag: '#323235',
  green: '#14b866',
  red: '#ec1414',
  purple: '#bf94ff',
};

const iconSize = {
  true: iconSizes.icon40,
  8: iconSizes.icon8,
  12: iconSizes.icon12,
  16: iconSizes.icon16,
  20: iconSizes.icon20,
  24: iconSizes.icon24,
  28: iconSizes.icon28,
  36: iconSizes.icon36,
  40: iconSizes.icon40,
  64: iconSizes.icon64,
};

export type IconSizeTokens = `$icon.${keyof typeof iconSize}`;

export const tokens = createTokens({
  color: {
    lightPrimary: lightColors.primary,
    lightBlack: lightColors.black,
    lightGray: lightColors.gray,
    lightTag: lightColors.tag,
    lightGreen: lightColors.green,
    lightRed: lightColors.red,
    lightPurple: lightColors.purple,

    darkPrimary: darkColors.primary,
    darkBlack: darkColors.black,
    darkGray: darkColors.gray,
    darkTag: darkColors.tag,
    darkGreen: darkColors.green,
    darkRed: darkColors.red,
    darkPurple: darkColors.purple,
  },
  size: {
    0: 0,
    0.25: 2,
    0.5: 4,
    0.75: 8,
    1: 20,
    1.5: 24,
    2: 28,
    2.5: 32,
    3: 36,
    3.5: 40,
    4: 44,
    true: 44,
    4.5: 48,
    5: 52,
    5.5: 59,
    6: 64,
    6.5: 69,
    7: 74,
    7.6: 79,
    8: 84,
    8.5: 89,
    9: 94,
    9.5: 99,
    10: 104,
    11: 124,
    12: 144,
    13: 164,
    14: 184,
    15: 204,
    16: 224,
    17: 224,
    18: 244,
    19: 264,
    20: 284,
  },
  radius: {
    0: 0,
    1: 3,
    2: 5,
    3: 7,
    4: 9,
    true: 9,
    5: 10,
    6: 16,
    7: 19,
    8: 22,
    9: 26,
    10: 34,
    11: 42,
    12: 50,
  },
  space: {
    0: 0,
    0.25: 2,
    0.5: 4,
    0.75: 8,
    1: 20,
    1.5: 24,
    2: 28,
    2.5: 32,
    3: 36,
    3.5: 40,
    4: 44,
    true: 44,
    4.5: 48,
    5: 52,
    5.5: 59,
    6: 64,
    6.5: 69,
    7: 74,
    7.6: 79,
    8: 84,
    8.5: 89,
    9: 94,
    9.5: 99,
    10: 104,
    11: 124,
    12: 144,
    13: 164,
    14: 184,
    15: 204,
    16: 224,
    17: 224,
    18: 244,
    19: 264,
    20: 284,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
});
