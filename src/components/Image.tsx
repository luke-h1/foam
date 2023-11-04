import {
  BackgroundColorProps,
  BorderProps,
  LayoutProps,
  SpacingProps,
  backgroundColor,
  border,
  createRestyleComponent,
  layout,
  spacing,
} from '@shopify/restyle';
import { Image as RNImage, ImageProps as RNImageProps } from 'react-native';
import { Theme } from '../styles/theme';

type ImageProps = SpacingProps<Theme> &
  LayoutProps<Theme> &
  BackgroundColorProps<Theme> &
  BorderProps<Theme> &
  Omit<RNImageProps, 'height' | 'width' | 'borderRadius'>;

const Component = createRestyleComponent<ImageProps, Theme>(
  [spacing, backgroundColor, border, layout],
  RNImage,
);

const Image = ({ ...props }: ImageProps) => {
  return <Component {...props} />;
};
export default Image;
