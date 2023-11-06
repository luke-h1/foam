/* eslint-disable react/no-unused-prop-types */
import {
  layout,
  opacity,
  spacing,
  useResponsiveProp,
  useRestyle,
  color,
  composeRestyleFunctions,
  SpacingProps,
  LayoutProps,
  OpacityProps,
  createRestyleComponent,
  ColorProps,
} from '@shopify/restyle';
import React, { FC } from 'react';
import { ViewProps, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { Theme } from '../styles/theme';

export interface SvgIconProps
  extends ColorProps<Theme>,
    SpacingProps<Theme>,
    LayoutProps<Theme>,
    OpacityProps<Theme>,
    Pick<ViewProps, 'testID'> {
  icon: FC<SvgProps>;
  style?: ViewStyle;
}
const DEFAULT_SVG_ICON_SIZE = 24;

type RestyleProps = ColorProps<Theme> &
  SpacingProps<Theme> &
  LayoutProps<Theme> &
  OpacityProps<Theme>;

const SVGIcon = ({
  icon: Icon,
  height: receivedHeight = DEFAULT_SVG_ICON_SIZE,
  width: receivedWidth = DEFAULT_SVG_ICON_SIZE,
  ...props
}: SvgIconProps) => {
  // @ts-expect-error restyle issues
  const height = useResponsiveProp(receivedHeight);
  // @ts-expect-error restyle issues
  const width = useResponsiveProp(receivedWidth);

  const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
    spacing,
    layout,
    opacity,
    color,
  ]);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   @ts-ignore
  const rootProps = useRestyle(restyleFunctions, props);

  const Component = createRestyleComponent<RestyleProps, Theme>(
    [spacing, layout, opacity, color],
    Icon,
  );

  // @ts-expect-error restyle issues
  return <Component {...{ width, height, ...rootProps }} />;
};

export default SVGIcon;
