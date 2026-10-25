import { Image as ExpoImage } from 'expo-image';

/**
 * The only allowed expo-image prefetch: 'memory-disk' poisons the memory
 * cache with full-resolution bitmaps nothing on screen renders.
 */
export function prefetchToDisk(urls: string[]): Promise<boolean> {
  return ExpoImage.prefetch(urls, 'disk');
}
