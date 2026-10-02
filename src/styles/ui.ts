import { Color, type ColorShade } from './palette';
import { theme } from './themes';

export type UISize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type UIRadius = 'none' | keyof typeof theme.radius;

export type UIColor =
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'black'
  | 'white'
  | 'transparent';

export const RADIUS_VALUES = {
  none: 0,
  ...theme.radius,
} satisfies Record<UIRadius, number>;

export interface ColorConfig {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  borderWidth: number;
}

export interface InputColorConfig extends ColorConfig {
  placeholderColor: string;
}

type PaletteColorName = Exclude<UIColor, 'black' | 'white' | 'transparent'>;
type PaletteColorScale = (typeof Color)[PaletteColorName];

export const getColorValue = (
  color: UIColor,
  shade: ColorShade = 500,
): string => {
  if (color === 'transparent') {
    return 'transparent';
  }

  if (color === 'black' || color === 'white') {
    return Color.grayscale[shade];
  }

  const colorObj: PaletteColorScale = Color[color];
  return colorObj[shade];
};
