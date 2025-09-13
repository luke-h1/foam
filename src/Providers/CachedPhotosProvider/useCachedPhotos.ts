import { IS_WIDE_SCREEN } from '@app/config/image-caching';
import { logPerformance } from '@app/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGalleryUISettings } from '../GalleryUISettingsProvider';
import { useMediaLibraryPhotos } from '../MediaLibraryPhotosProvider';
import { useScreenDimensions } from '../ScreenDimensionsProvider';
import { calculateNewCachePhoto } from '../utils/calculateNewCachePhoto/calculateNewCachePhoto';
import {
  CachedPhotoType,
  clearCache,
  getPhotoFromCache,
  loadAllPhotosFromCache,
  setPhotoInCache,
} from './cache-service';

// A limitation for photos loaded in photos gallery from device / local filesystem
// - Set to Infinity if you want to disable it
export const MEDIA_LIBRARY_PHOTOS_LIMIT = Infinity;

// ------------------
// UI config - images
// ------------------

// Decides whether to use image native components from expo-image or react-native-image
export const IMAGE_NATIVE_PRESET: 'expo' | 'rni' = 'expo';

// ----------------------
// UI config - UI scaling
// ----------------------

// A relative screen size preset for UI scaling (phone, tablet or fullhd)
export const UI_DESIGN_PRESET: 'phone' | 'tablet' | 'fullhd' = 'phone';

// How should UI be scaled for custom device screen (via screen height or diagonal)
export const UI_SCALING_METHOD: 'height' | 'diagonal' = 'height';

/**
 * Upon scenario that we have a lot of photos to process (e.g. when resetting the cache),
 * we want to process them in batches in order to retain some UI responsiveness.
 */
const PROCESSING_BATCH_SIZE_LIMIT = 25;

/**
 * Helper definitions - loading state
 *
 * "IDLE" works as a default state, which is neither running nor completed
 */

export type CachedPhotosLoadingState =
  | 'IDLE'
  | 'RESTORING_FROM_CACHE'
  | 'RESTORED_FROM_CACHE'
  | 'CALCULATING'
  | 'COMPLETED';

// Helper function - detect completed loading
export function isCompleted(state: CachedPhotosLoadingState) {
  return state === 'RESTORED_FROM_CACHE' || state === 'COMPLETED';
}

// Helper function - detect active loading
export function isLoading(state: CachedPhotosLoadingState) {
  return state === 'RESTORING_FROM_CACHE' || state === 'CALCULATING';
}

/**
 * Queries the cache for photos based on the UI settings.
 * Ensures we have all the photos coming from {@link useMediaLibraryPhotos} properly processed and stored in the cache.
 */
export const useCachedPhotos = () => {
  const { dimensions } = useScreenDimensions();
  const {
    numberOfColumns,
    stateRestorationStatus: galleryUISettingsStateRestorationStatus,
  } = useGalleryUISettings();

  const {
    mediaLibraryPhotos,
    mediaLibraryLoadingState,
    stateRestorationStatus: mediaLibraryStateRestorationStatus,
  } = useMediaLibraryPhotos();

  const [state, setState] = useState<{
    cachedPhotos: CachedPhotoType[];
    cachedPhotosLoadingState: CachedPhotosLoadingState;
  }>({
    cachedPhotos: [],
    cachedPhotosLoadingState: 'IDLE',
  });

  const relevantDimension = IS_WIDE_SCREEN
    ? dimensions.width
    : Math.min(dimensions.width, dimensions.height);

  /**
   * Calculate estimated target image size based on screen dimensions
   * We use a rough heuristic, since neither overestimating nor underestimating by 10 pixels hurts us
   */
  const targetImageSize = useMemo(
    () => relevantDimension / numberOfColumns,
    [relevantDimension, numberOfColumns],
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
      const processedPhotos: CachedPhotoType[] = [];

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
    clearCache();

    await calculateCachedPhotos();
  }, [state.cachedPhotosLoadingState, calculateCachedPhotos]);

  /**
   * This effect restores cached photos for the given mipmap width.
   * When there's no cache, then it's no-op in terms of data.
   */
  useEffect(() => {
    if (
      galleryUISettingsStateRestorationStatus === 'RESTORING' ||
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

    const cachedPhotos = loadAllPhotosFromCache(
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
    galleryUISettingsStateRestorationStatus,
    mediaLibraryStateRestorationStatus,
    targetImageSize,
    mediaLibraryLoadingState,
    mediaLibraryPhotos,
    state.cachedPhotosLoadingState,
  ]);

  /**
   * Once we've restored cached photos for a given mipmap width,
   * we can actually do a proper cache calculation for every MediaLibrary photo.
   */
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

const generateCachedPhoto = async (
  photoUri: string,
  mipmapWidth: number,
): Promise<CachedPhotoType> => {
  const cached = await getPhotoFromCache({
    originalPhotoUri: photoUri,
    mipmapWidth,
  });
  /**
   * Cache hit, early return.
   */
  if (cached) {
    return cached;
  }

  const result = await calculateNewCachePhoto(photoUri, mipmapWidth);

  const cachedPhoto = setPhotoInCache(
    {
      originalPhotoUri: photoUri,
      mipmapWidth,
    },
    result.uri,
  );

  return cachedPhoto;
};
