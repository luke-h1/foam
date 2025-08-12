import { ViewStyle } from 'react-native';
import { UnistylesThemes } from 'react-native-unistyles';

export const spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 56,
  '7xl': 64,
  headerHeight: 56,
  tabBarHeight: 70,
} as const;

export type Spacing = keyof typeof spacing;

export type MarginToken = '0' | 'auto' | Spacing | `-${Spacing}` | number;

export interface MarginProps {
  m?: MarginToken;
  mb?: MarginToken;
  ml?: MarginToken;
  mr?: MarginToken;
  mt?: MarginToken;
  mx?: MarginToken;
  my?: MarginToken;
}

export function getMargin(theme: UnistylesThemes['dark']) {
  return function styles({ m, mb, ml, mr, mt, mx, my }: MarginProps) {
    const style: ViewStyle = {};

    if (m) {
      style.margin = getSpace(theme, m);
    }

    if (mb) {
      style.marginBottom = getSpace(theme, mb);
    }

    if (ml) {
      style.marginLeft = getSpace(theme, ml);
    }

    if (mr) {
      style.marginRight = getSpace(theme, mr);
    }

    if (mt) {
      style.marginTop = getSpace(theme, mt);
    }

    if (mx) {
      style.marginHorizontal = getSpace(theme, mx);
    }

    if (my) {
      style.marginVertical = getSpace(theme, my);
    }

    return style;
  };
}

export type PaddingToken = '0' | Spacing | `-${Spacing}` | number;

export interface PaddingProps {
  p?: PaddingToken;
  pb?: PaddingToken;
  pl?: PaddingToken;
  pr?: PaddingToken;
  pt?: PaddingToken;
  px?: PaddingToken;
  py?: PaddingToken;
}

export function getPadding(theme: UnistylesThemes['dark']) {
  return function styles({ p, pb, pl, pr, pt, px, py }: PaddingProps) {
    const style: ViewStyle = {};

    if (p) {
      style.padding = getSpace(theme, p);
    }

    if (pb) {
      style.paddingBottom = getSpace(theme, pb);
    }

    if (pl) {
      style.paddingLeft = getSpace(theme, pl);
    }

    if (pr) {
      style.paddingRight = getSpace(theme, pr);
    }

    if (pt) {
      style.paddingTop = getSpace(theme, pt);
    }

    if (px) {
      style.paddingHorizontal = getSpace(theme, px);
    }

    if (py) {
      style.paddingVertical = getSpace(theme, py);
    }

    return style;
  };
}

function getSpace(
  theme: UnistylesThemes['dark'],
  key: MarginToken | PaddingToken,
) {
  if (typeof key === 'number') {
    return key;
  }

  if (key === '0') {
    return 0;
  }

  if (key === 'auto') {
    return 'auto';
  }

  const negative = key.startsWith('-');

  const token = (key.startsWith('-') ? key.slice(1) : key) as Spacing;

  const value = theme.spacing[token];

  if (negative) {
    return -value;
  }

  return value;
}
