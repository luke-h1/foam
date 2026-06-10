import { Image as ExpoImage } from 'expo-image';

export const prefetchImage = (source: string | string[]) =>
  ExpoImage.prefetch(source);
