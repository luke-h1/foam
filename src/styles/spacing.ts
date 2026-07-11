import type { AppTheme } from './themes';

export type Spacing =
  'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '6xl';

export interface MarginProps {
  m?: Spacing | number;
  mb?: Spacing | number;
  ml?: Spacing | number;
  mr?: Spacing | number;
  mt?: Spacing | number;
  mx?: Spacing | number;
  my?: Spacing | number;
}

export function resolveSpacingValue(theme: AppTheme, value?: Spacing | number) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  switch (value) {
    case 'xs':
      return theme.space8;
    case 'sm':
      return theme.space12;
    case 'md':
      return theme.space16;
    case 'lg':
      return theme.space20;
    case 'xl':
      return theme.space28;
    case '2xl':
      return theme.space36;
    case '3xl':
      return theme.space44;
    case '4xl':
      return theme.space56;
    case '6xl':
      return theme.space72;
    default:
      return undefined;
  }
}

const NO_MARGIN = Object.freeze({});

export function getMargin(theme: AppTheme) {
  return ({ m, mb, ml, mr, mt, mx, my }: MarginProps) => {
    /**
     * Chat spans route every rendered text through this on the hottest path in
     * the app, and almost none of them pass margin props - skip the fourteen
     * resolve calls and seven conditional spreads for that case.
     */
    if (
      m === undefined &&
      mb === undefined &&
      ml === undefined &&
      mr === undefined &&
      mt === undefined &&
      mx === undefined &&
      my === undefined
    ) {
      return NO_MARGIN;
    }
    return buildMargin(theme, { m, mb, ml, mr, mt, mx, my });
  };
}

function buildMargin(
  theme: AppTheme,
  { m, mb, ml, mr, mt, mx, my }: MarginProps,
) {
  return {
    ...(resolveSpacingValue(theme, m) !== undefined
      ? { margin: resolveSpacingValue(theme, m) }
      : null),
    ...(resolveSpacingValue(theme, mb) !== undefined
      ? { marginBottom: resolveSpacingValue(theme, mb) }
      : null),
    ...(resolveSpacingValue(theme, ml) !== undefined
      ? { marginLeft: resolveSpacingValue(theme, ml) }
      : null),
    ...(resolveSpacingValue(theme, mr) !== undefined
      ? { marginRight: resolveSpacingValue(theme, mr) }
      : null),
    ...(resolveSpacingValue(theme, mt) !== undefined
      ? { marginTop: resolveSpacingValue(theme, mt) }
      : null),
    ...(resolveSpacingValue(theme, mx) !== undefined
      ? { marginHorizontal: resolveSpacingValue(theme, mx) }
      : null),
    ...(resolveSpacingValue(theme, my) !== undefined
      ? { marginVertical: resolveSpacingValue(theme, my) }
      : null),
  };
}
