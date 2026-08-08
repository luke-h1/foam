import { StyleProp, ViewStyle } from 'react-native';

import { ImageProps as ExpoImageProps } from 'expo-image';

export interface ImageProps extends Omit<ExpoImageProps, 'source'> {
  containerStyle?: StyleProp<ViewStyle>;
  trackLoadContext?: string;
  cacheToFile?: boolean;
  cacheVariant?: string;
  source?: string | { uri: string } | number;
}
