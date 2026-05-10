import { Color, type ColorShade } from './pallete';

export type UISize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type UIRadius =
  | 'none'
  | 'xxs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'default'
  | 'lg'
  | 'xl'
  | 'full';

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
  | 'lime'
  | 'green'
  | 'emerald'
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

export const RADIUS_VALUES: Record<UIRadius, number> = {
  none: 0,
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  default: 14,
  lg: 16,
  xl: 20,
  full: 32,
};

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

  if (color === 'black') {
    return Color.grayscale[shade] || Color.grayscale[500];
  }
  if (color === 'white') {
    return Color.grayscale[shade] || Color.grayscale[500];
  }

  const colorObj: PaletteColorScale = Color[color];
  return colorObj[shade] || colorObj[500];
};
