import { ImageProps as ExpoImageProps } from 'expo-image';
import { StyleProp, ViewStyle } from 'react-native';
import type { ImageCachePriority } from '@app/utils/image/image-cache';

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: StyleProp<ViewStyle>;
  trackLoadContext?: string;
  cachePriority?: ImageCachePriority;
  cacheToFile?: boolean;
  cacheVariant?: string;
  source?: string | { uri: string } | number;
}
