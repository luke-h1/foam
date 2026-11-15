import type { StyleProp, ViewStyle } from 'react-native';

import type { ImageProps as ExpoImageProps } from 'expo-image';

type ImageCacheVariant = 'emote' | 'badge' | 'avatar' | 'thumbnail' | 'image';

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: StyleProp<ViewStyle>;
  trackLoadContext?: string;
  cacheToFile?: boolean;
  cacheVariant?: ImageCacheVariant;
  source?: string | { uri: string } | number;
}
