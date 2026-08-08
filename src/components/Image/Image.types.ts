import { StyleProp, ViewStyle } from 'react-native';

import { ImageProps as ExpoImageProps } from 'expo-image';

/**
 * Closed on purpose: the variant is part of the file-cache key, so a freeform
 * string silently forks the cache for the same url.
 */
export type ImageCacheVariant =
  'emote' | 'badge' | 'avatar' | 'thumbnail' | 'image';

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: StyleProp<ViewStyle>;
  trackLoadContext?: string;
  cacheToFile?: boolean;
  cacheVariant?: ImageCacheVariant;
  source?: string | { uri: string } | number;
}
