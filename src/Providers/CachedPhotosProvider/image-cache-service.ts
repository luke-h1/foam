/* eslint-disable no-shadow */
import { storageService } from '@app/services';
import { Platform } from 'react-native';

export type CacheKey = Pick<CachedImage, 'originalImageUri' | 'mipmapWidth'>;

export interface CachedImage {
  // /**
  //  * The ID of the emote
  //  */
  // id: string;

  // /**
  //  * The channelId where this image was cached from
  //  */
  // channelId: string;

  // /**
  //  * Is it a channel or global badge/emote
  //  */
  // scope: 'channel' | 'global';

  // /**
  //  * Badge or emote
  //  */
  // type: 'badge' | 'emote';

  /**
   * The CDN URI of the badge/image
   */
  originalImageUri: string;
  mipmapWidth: number;

  /**
   * The URI of the image cached on disk
   */
  cachedImageUri: string;
}

export const imageCacheService = {
  getImageFromCache: async (
    key: CacheKey,
  ): Promise<CachedImage | undefined> => {
    if (!imageCacheService.existsInCache(key)) {
      return;
    }

    const cachedImageUri = storageService.getString<string>(
      cacheKeyToString(key),
    );

    if (!cachedImageUri) {
      return;
    }

    /**
     * Since expo-file-system does not support web, we need to omit this step in case of web build
     */
    if (Platform.OS !== 'web') {
      const { File } = await import('expo-file-system/next');

      const fileInfo = new File(cachedImageUri);

      if (!fileInfo.exists) {
        return;
      }

      return {
        cachedImageUri,
        mipmapWidth: key.mipmapWidth,
        originalImageUri: key.originalImageUri,
      };
    }

    /**
     * Not implemented for web
     */
    return undefined;
  },

  existsInCache: (key: CacheKey) => {
    return Boolean(
      storageService.getString(cacheKeyToString(key), 'image_cache'),
    );
  },

  clearCache: () => {
    return storageService.clearImageCache();
  },

  /**
   * Loads all photos from the cache that match the {@link minmapWidth} and
   * {@link mediaLibraryPhotos} unless there's no match even for a single photo
   * @returns photos that match the {@link id} and {@link minmapWidth}
   */
  loadAllImagesFromCache: (
    libraryImages: { uri: string }[],
    mipmapWidth: number,
  ): CachedImage[] => {
    const results = storageService.getAllKeys('image_cache');
    const pairs = results.map(k => [k, storageService.getString(k)]);

    const sizeMatchingImages = pairs
      .map(pair => {
        if (!pair[0] || !pair[1]) {
          return;
        }

        const { mipmapWidth, originalImageUri } = cacheKeyFromString(pair[0]);

        return {
          originalImageUri,
          cachedImageUri: pair[1],
          mipmapWidth,
        } satisfies CachedImage;
      })
      .filter(
        (image): image is NonNullable<typeof image> => image !== undefined,
      )
      .filter(image => image.mipmapWidth === Number(mipmapWidth.toFixed(2)))
      .reduce(
        (acc, el) => {
          acc[el.originalImageUri] = el;
          return acc;
        },
        {} as Record<string, CachedImage>,
      );

    const matchingImages = libraryImages
      .map(image => {
        const cachedImage = sizeMatchingImages[image.uri];

        if (!cachedImage) {
          return;
        }

        return cachedImage;
      })
      .filter(
        (image): image is NonNullable<typeof image> => image !== undefined,
      );

    return matchingImages.length === libraryImages.length ? matchingImages : [];
  },
  setImageInCache: (
    cackeKey: CacheKey,
    cachedPhotoUri: string,
  ): CachedImage => {
    storageService.set(
      cacheKeyToString(cackeKey),
      cachedPhotoUri,
      'image_cache',
    );

    return {
      cachedImageUri: cachedPhotoUri,
      mipmapWidth: cackeKey.mipmapWidth,
      originalImageUri: cackeKey.originalImageUri,
    };
  },
} as const;

export const cacheKeyToString = (cacheKey: CacheKey): string => {
  return `${cacheKey.originalImageUri}--${cacheKey.mipmapWidth.toFixed(2)}`;
};

export const cacheKeyFromString = (photoKeyString: string): CacheKey => {
  const [originalImageUri, mipmapWidth] = photoKeyString.split('--');
  return {
    originalImageUri: originalImageUri as string,
    mipmapWidth: Number(parseFloat(mipmapWidth as string).toFixed(2)),
  };
};
