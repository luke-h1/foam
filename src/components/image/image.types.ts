import type { StyleProp, ViewStyle } from 'react-native';

import type { ImageProps as ExpoImageProps } from 'expo-image';

/**
 * Closed on purpose: the variant is part of the file-cache key, so a freeform
 * string silently forks the cache for the same url.
 */
export type ImageCacheVariant =
  | 'emote'
  | 'badge'
  | 'avatar'
  | 'thumbnail'
  | 'image';

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: StyleProp<ViewStyle> | undefined;
  trackLoadContext?: string | undefined;
  cacheToFile?: boolean | undefined;
  cacheVariant?: ImageCacheVariant | undefined;
  source?: string | { uri: string } | number | undefined;
}
