import { ImageProps as ExpoImageProps } from 'expo-image';
import { StyleProp, ViewStyle } from 'react-native';
import type { ImageCachePriority } from '@app/utils/image/image-cache';

export interface ImageProps extends Omit<
  ExpoImageProps,
  'source' | 'transition'
> {
  containerStyle?: StyleProp<ViewStyle>;
  useNitro?: boolean;
  trackLoadTime?: boolean;
  trackLoadContext?: string;
  cachePriority?: ImageCachePriority;
  cacheToFile?: boolean;
  cacheVariant?: string;
  source?: string | { uri: string } | number;
}
