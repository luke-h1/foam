import {
  CachedImage,
  imageCacheService,
} from '@app/Providers/CachedPhotosProvider/image-cache-service';
import { generateCachedPhoto } from '@app/Providers/CachedPhotosProvider/useCachedPhotos';
import { useMediaLibraryPhotos } from '@app/Providers/MediaLibraryPhotosProvider';
import { useScreenDimensions } from '@app/Providers/ScreenDimensionsProvider';
import { IS_WIDE_SCREEN } from '@app/config/image-caching';
import { logPerformance } from '@app/utils';
import { logger } from '@app/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
/**
 * Upon scenario that we have a lot of photos to process (e.g. when resetting the cache),
 * we want to process them in batches in order to retain some UI responsiveness.
 */
const PROCESSING_BATCH_SIZE_LIMIT = 25;

export type CachedPhotosLoadingState =
  | 'IDLE'
  | 'RESTORING_FROM_CACHE'
  | 'RESTORED_FROM_CACHE'
  | 'CALCULATING'
  | 'COMPLETED';

export function isCompleted(state: CachedPhotosLoadingState) {
  return state === 'RESTORED_FROM_CACHE' || state === 'COMPLETED';
}

export function isLoading(state: CachedPhotosLoadingState) {
  return state === 'RESTORING_FROM_CACHE' || state === 'CALCULATING';
}

/**
 * Queries the cache for photos based on the UI settings.
 * Ensures we have all the photos coming from {@link useMediaLibraryPhotos} properly processed and stored in the cache.
 */
export const useCachedImages = () => {
  const { dimensions } = useScreenDimensions();

  const {
    mediaLibraryPhotos,
    mediaLibraryLoadingState,
    stateRestorationStatus: mediaLibraryStateRestorationStatus,
  } = useMediaLibraryPhotos();

  const [state, setState] = useState<{
    cachedPhotos: CachedImage[];
    cachedPhotosLoadingState: CachedPhotosLoadingState;
  }>({
    cachedPhotos: [],
    cachedPhotosLoadingState: 'IDLE',
  });

  const relevantDimension = IS_WIDE_SCREEN
    ? dimensions.width
    : Math.min(dimensions.width, dimensions.height);

  const targetImageSize = useMemo(
    () => relevantDimension / 4,
    [relevantDimension],
  );

  const calculateCachedPhotos = useCallback(async () => {
    /**
     * useWindowDimensions hook sometimes might cause 2 or 3 rerenders in a short time, including the initialization stage
     * That's why we need to be careful and check for other ongoing calculations
     */

    if (
      state.cachedPhotosLoadingState === 'CALCULATING' ||
      state.cachedPhotosLoadingState === 'RESTORING_FROM_CACHE'
    ) {
      logger.cachedPhotos.warn(
        '❌ Calculate cached photos is already in progress, skipping',
      );
      return;
    }
    setState({
      cachedPhotos: [],
      cachedPhotosLoadingState: 'CALCULATING',
    });

    await logPerformance(async () => {
      let processedPhotosCount = 0;

      const photosCountToProcess = mediaLibraryPhotos.length;
      const processedPhotos: CachedImage[] = [];

      const expectedBatchesCount = Math.ceil(
        photosCountToProcess / PROCESSING_BATCH_SIZE_LIMIT,
      );
      logger.cachedPhotos.info(
        `🔄 Starting cached photos calculations (expects ${expectedBatchesCount} batches)`,
      );

      while (processedPhotosCount < photosCountToProcess) {
        const nextPhotosBatch = mediaLibraryPhotos.slice(
          processedPhotosCount,
          processedPhotosCount + PROCESSING_BATCH_SIZE_LIMIT,
        );

        logger.cachedPhotos.info(
          `⚙️  Processing next batch of photos (${processedPhotosCount} / ${photosCountToProcess}): ${processedPhotosCount} -> ${processedPhotosCount + nextPhotosBatch.length}`,
        );

        // eslint-disable-next-line no-await-in-loop
        const newCachedPhotosBatch = await Promise.all(
          nextPhotosBatch.map(photo =>
            generateCachedPhoto(photo.uri, targetImageSize),
          ),
        );
        processedPhotosCount += nextPhotosBatch.length;
        processedPhotos.push(...newCachedPhotosBatch);

        setState(prev => {
          const cachedPhotos = [...prev.cachedPhotos, ...newCachedPhotosBatch];

          return {
            cachedPhotos,
            cachedPhotosLoadingState:
              cachedPhotos.length === mediaLibraryPhotos.length
                ? 'COMPLETED'
                : 'CALCULATING',
          };
        });
      }

      logger.cachedPhotos.info(
        `✅ Calculated ${processedPhotos.length} cached photos`,
      );
    }, ['calculateCachedPhotos']);
  }, [mediaLibraryPhotos, targetImageSize, state.cachedPhotosLoadingState]);

  const recalculateCachedPhotos = useCallback(async () => {
    if (
      state.cachedPhotosLoadingState === 'CALCULATING' ||
      state.cachedPhotosLoadingState === 'RESTORING_FROM_CACHE'
    ) {
      logger.cachedPhotos.warn(
        '❌ Recalculate cached photos is already in progress, skipping',
      );
      return;
    }

    logger.cachedPhotos.info('🔄 Recalculating cached photos');
    imageCacheService.clearCache();

    await calculateCachedPhotos();
  }, [state.cachedPhotosLoadingState, calculateCachedPhotos]);

  /**
   * This effect restores cached photos for the given mipmap width.
   * When there's no cache, then it's no-op in terms of data.
   */
  useEffect(() => {
    if (
      mediaLibraryStateRestorationStatus === 'RESTORING' ||
      mediaLibraryLoadingState !== 'COMPLETED'
    ) {
      /**
       * The state we depend on is still being restored from the disk. Let's wait for it a bit longer.
       */
      return;
    }

    if (state.cachedPhotosLoadingState !== 'IDLE') {
      /**
       * The cache is not yet restored, let's not do it again.
       */
      return;
    }

    logger.cachedPhotos.info(
      `🔄 Restoring cached photos from disk (expects ${mediaLibraryPhotos.length} photos of size ${targetImageSize.toFixed(2)})`,
    );

    setState({
      cachedPhotos: [],
      cachedPhotosLoadingState: 'RESTORING_FROM_CACHE',
    });

    const cachedPhotos = imageCacheService.loadAllImagesFromCache(
      mediaLibraryPhotos,
      targetImageSize,
    );

    if (cachedPhotos.length === 0) {
      logger.cachedPhotos.info(
        '❌ No cached photos found. Will calculate cache.',
      );
      setState({
        cachedPhotos: [],
        cachedPhotosLoadingState: 'RESTORED_FROM_CACHE',
      });
      return;
    }

    logger.cachedPhotos.info(
      `📤 Restored all ${cachedPhotos.length} cached photos from disk`,
    );

    setState({
      cachedPhotos,
      cachedPhotosLoadingState:
        cachedPhotos.length === mediaLibraryPhotos.length
          ? 'COMPLETED'
          : 'RESTORED_FROM_CACHE',
    });
  }, [
    mediaLibraryStateRestorationStatus,
    targetImageSize,
    mediaLibraryLoadingState,
    mediaLibraryPhotos,
    state.cachedPhotosLoadingState,
  ]);

  useEffect(() => {
    /**
     * The cache is being restored or we're not ready yet, do nothing for now.
     */
    if (state.cachedPhotosLoadingState !== 'RESTORED_FROM_CACHE') {
      return;
    }

    void calculateCachedPhotos();
  }, [
    state.cachedPhotosLoadingState,
    state.cachedPhotos.length,
    mediaLibraryLoadingState,
    mediaLibraryPhotos.length,
    targetImageSize,
    calculateCachedPhotos,
  ]);

  return {
    ...state,
    recalculateCachedPhotos,
  };
};
