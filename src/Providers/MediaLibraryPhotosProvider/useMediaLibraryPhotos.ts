import { usePersistedState } from '@app/hooks';
import { logger } from '@app/utils/logger';
import { logPerformance } from '@app/utils/performance';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { MEDIA_LIBRARY_PHOTOS_LIMIT } from '../CachedPhotosProvider/useCachedPhotos';

/**
 * Determines how many MediaLibrary photos will be loaded in one batch.
 */
export const LOAD_BATCH_SIZE = Platform.select({
  /**
   * iOS can provide results much faster than Android.
   */
  ios: Math.min(50, MEDIA_LIBRARY_PHOTOS_LIMIT),
  default: Math.min(30, MEDIA_LIBRARY_PHOTOS_LIMIT),
});

export type MediaLibraryLoadingState = 'IDLE' | 'LOADING' | 'COMPLETED';

export type MediaLibraryPermissionsStatus =
  | 'GRANTED'
  | 'DENIED'
  | 'UNDETERMINED';

export type MediaLibraryPhoto = {
  uri: string;
};

/**
 * Reads photos from MediaLibrary.
 */
export const useMediaLibraryPhotos = () => {
  const [, requestPermission] = MediaLibrary.usePermissions({
    get: true,
    request: true,
    granularPermissions: ['photo'],
  });

  /**
   * We need to be sure that the restoration logic is called only once. No matter React running `useEffect` multiple times.
   */
  const didRunOnceFlag = useRef(false);
  const [state, setState, stateRestorationStatus] = usePersistedState<{
    mediaLibraryPermissionsStatus: MediaLibraryPermissionsStatus;
    mediaLibraryPhotosCount: number | undefined;
    mediaLibraryLoadingState: MediaLibraryLoadingState;
    mediaLibraryPhotos: MediaLibraryPhoto[];
  }>('mediaLibrary', {
    mediaLibraryLoadingState: 'IDLE',
    mediaLibraryPermissionsStatus: 'UNDETERMINED',
    mediaLibraryPhotosCount: undefined,
    mediaLibraryPhotos: [],
  });

  const loadMediaLibraryPhotos = useCallback(async () => {
    await logPerformance(async () => {
      try {
        logger.main.info('🛫 Starting reading MediaLibrary photos...');

        logger.main.info('🔄 Checking MediaLibrary permissions...');
        if (
          (await MediaLibrary.getPermissionsAsync()).status !==
          MediaLibrary.PermissionStatus.GRANTED
        ) {
          const { status } = await requestPermission();
          if (status !== MediaLibrary.PermissionStatus.GRANTED) {
            logger.main.info('❌ MediaLibrary permission not granted');
            setState(prev => ({
              ...prev,
              mediaLibraryPermissionsStatus: 'DENIED',
            }));
            return;
          }
        }

        setState(prev => ({
          ...prev,
          mediaLibraryPermissionsStatus: 'GRANTED',
          mediaLibraryLoadingState: 'LOADING',
        }));

        const devicePhotos = await MediaLibrary.getAssetsAsync({
          first: 0,
          mediaType: 'photo',
          sortBy: [['modificationTime', true]],
        });

        let photosCount = Math.min(
          devicePhotos.totalCount,
          MEDIA_LIBRARY_PHOTOS_LIMIT,
        );

        if (photosCount === state.mediaLibraryPhotosCount) {
          logger.main.info(
            `✅ MediaLibrary photos count (${photosCount}) is the same as the previous count, skipping batched loading as we assume we have the same data.`,
          );
          setState(prev => ({
            ...prev,
            mediaLibraryLoadingState: 'COMPLETED',
          }));
          return;
        }

        setState({
          mediaLibraryPhotosCount: photosCount,
          mediaLibraryPhotos: [],
          mediaLibraryPermissionsStatus: 'GRANTED',
          mediaLibraryLoadingState: 'LOADING',
        });

        logger.main.info(
          `🔄 MediaLibrary photos count: ${photosCount}, number of reading batches: ${Math.ceil(
            photosCount / LOAD_BATCH_SIZE,
          )}`,
        );
        setState(prev => ({
          ...prev,
          mediaLibraryPhotosCount: photosCount,
        }));

        let hasNextPage = true;
        let endCursor: string | undefined;
        const photos: MediaLibraryPhoto[] = [];

        while (hasNextPage && photos.length < photosCount) {
          // eslint-disable-next-line no-await-in-loop
          const batch = await MediaLibrary.getAssetsAsync({
            first: LOAD_BATCH_SIZE,
            after: endCursor,
            mediaType: 'photo',
            sortBy: [['creationTime', false]],
          });

          const newAssets = batch.assets.map(({ uri }) => ({ uri }));
          photos.push(...newAssets);

          photosCount = Math.min(MEDIA_LIBRARY_PHOTOS_LIMIT, batch.totalCount);

          // eslint-disable-next-line no-loop-func
          setState(prev => ({
            ...prev,
            mediaLibraryPhotosCount: photosCount,
            mediaLibraryPhotos: [...prev.mediaLibraryPhotos, ...newAssets],
          }));

          hasNextPage = batch.hasNextPage;
          endCursor = batch.endCursor;
        }

        logger.main.info(
          `✅ Reading MediaLibrary completed (photos count: ${photosCount})`,
        );

        setState(prev => ({
          ...prev,
          mediaLibraryLoadingState: 'COMPLETED',
        }));
      } catch (e) {
        logger.main.error('❌ Error while reading MediaLibrary', e);
        setState(prev => ({
          mediaLibraryLoadingState: 'IDLE',
          mediaLibraryPhotosCount: undefined,
          mediaLibraryPhotos: [],
          mediaLibraryPermissionsStatus: prev.mediaLibraryPermissionsStatus,
        }));
      }
    }, ['loadMediaLibraryPhotos']);
  }, [requestPermission, setState, state.mediaLibraryPhotosCount]);

  const reloadMediaLibraryPhotos = useCallback(async () => {
    if (state.mediaLibraryLoadingState === 'LOADING') {
      return;
    }

    await loadMediaLibraryPhotos();
  }, [loadMediaLibraryPhotos, state.mediaLibraryLoadingState]);

  /**
   * Read MediaLibrary photos automatically upon app start..
   */
  useEffect(() => {
    if (stateRestorationStatus === 'RESTORING') {
      return;
    }

    if (didRunOnceFlag.current) {
      return;
    }

    // Ensure we're not re-running this auto-restoration logic more than once.
    didRunOnceFlag.current = true;

    logger.main.info('Automatic MediaLibrary photo load start');
    void loadMediaLibraryPhotos();
  }, [
    stateRestorationStatus,
    state.mediaLibraryLoadingState,
    loadMediaLibraryPhotos,
  ]);

  return {
    ...state,
    stateRestorationStatus,
    reloadMediaLibraryPhotos,
  };
};
