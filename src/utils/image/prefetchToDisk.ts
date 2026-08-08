import { Image as ExpoImage } from 'expo-image';

/**
 * The only allowed expo-image prefetch. 'disk' is hard-coded: 'memory-disk'
 * decodes every prefetched url into the memory cache at full source
 * resolution, poisoning it with bitmaps nothing on screen renders.
 */
export function prefetchToDisk(urls: string[]): Promise<boolean> {
  return ExpoImage.prefetch(urls, 'disk');
}
