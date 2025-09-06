/* eslint-disable no-nested-ternary */
import { FlexStyle } from 'react-native';
import { UnistylesThemes } from 'react-native-unistyles';
import {
  getMargin,
  getPadding,
  MarginProps,
  PaddingProps,
  Spacing,
} from '../spacing';

export type ViewStyleProps = {
  align?: 'baseline' | 'center' | 'end' | 'start' | 'stretch';
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flex?: number;
  flexBasis?: number;
  flexGrow?: number;
  flexShrink?: number;
  gap?: Spacing | number;
  gapX?: Spacing | number;
  gapY?: Spacing | number;
  height?: Spacing | number;
  justify?: 'between' | 'center' | 'end' | 'start';
  self?: 'center' | 'end' | 'start' | 'stretch';
  width?: Spacing | number;
  wrap?: 'nowrap' | 'wrap-reverse' | 'wrap';
} & MarginProps &
  PaddingProps;

export function getViewStyles(theme: UnistylesThemes['dark']) {
  return function styles({
    align,
    direction,
    flex,
    flexBasis,
    flexGrow,
    flexShrink,
    gap,
    gapX,
    gapY,
    height,
    justify,
    self,
    width,
    wrap,
    ...props
  }: ViewStyleProps) {
    const alignItems: FlexStyle['alignItems'] =
      align === 'baseline'
        ? 'baseline'
        : align === 'center'
          ? 'center'
          : align === 'end'
            ? 'flex-end'
            : align === 'start'
              ? 'flex-start'
              : align === 'stretch'
                ? 'stretch'
                : undefined;

    const justifyContent: FlexStyle['justifyContent'] =
      justify === 'between'
        ? 'space-between'
        : justify === 'center'
          ? 'center'
          : justify === 'end'
            ? 'flex-end'
            : justify === 'start'
              ? 'flex-start'
              : undefined;

    const alignSelf: FlexStyle['alignSelf'] =
      self === 'center'
        ? 'center'
        : self === 'stretch'
          ? 'stretch'
          : self === 'end'
            ? 'flex-end'
            : self === 'start'
              ? 'flex-start'
              : undefined;

    return {
      ...getMargin(theme)(props),
      ...getPadding(theme)(props),
      alignItems,
      alignSelf,
      columnGap: getSpacing(theme, gapY),
      flex,
      flexBasis,
      flexDirection: direction,
      flexGrow,
      flexShrink,
      flexWrap: wrap,
      gap: getSpacing(theme, gap),
      height: getSpacing(theme, height),
      justifyContent,
      rowGap: getSpacing(theme, gapX),
      width: getSpacing(theme, width),
    };
  };
}

function getSpacing(theme: UnistylesThemes['dark'], key?: Spacing | number) {
  if (!key) {
    return;
  }

  if (typeof key === 'number') {
    return key;
  }

  return theme.spacing[key];
}
