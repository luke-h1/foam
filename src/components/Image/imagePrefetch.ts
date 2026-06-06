import { Image as ExpoImage } from 'expo-image';
import { cacheImageFromUrl } from '@app/utils/image/image-cache';

export const prefetchImage = (source: string | string[]) =>
  ExpoImage.prefetch(source);

export const prefetchImageWeb = async (source: string | string[]) => {
  const sources = Array.isArray(source) ? source : [source];

  const results = await Promise.all(
    sources.map(async uri => {
      try {
        await cacheImageFromUrl(uri, { priority: 'background' });
        return true;
      } catch {
        return ExpoImage.prefetch(uri);
      }
    }),
  );

  return results.every(Boolean);
};
