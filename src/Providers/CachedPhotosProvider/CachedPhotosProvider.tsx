import {
  CachedPhotosLoadingState,
  useCachedImages,
} from '@app/hooks/useCachedImages';
import { createContext, PropsWithChildren, use, useMemo } from 'react';
import { CachedImage } from './image-cache-service';

type CachedPhotosDataType = {
  cachedPhotos: CachedImage[];
  cachedPhotosLoadingState: CachedPhotosLoadingState;
  recalculateCachedPhotos: () => Promise<void>;
};

const CachedPhotosContext = createContext<CachedPhotosDataType | undefined>(
  undefined,
);

/**
 * Provides the optimized version of the {@link MediaLibraryPhoto}
 */
export const CachedPhotosProvider = ({ children }: PropsWithChildren) => {
  const { cachedPhotos, cachedPhotosLoadingState, recalculateCachedPhotos } =
    useCachedImages();

  return (
    <CachedPhotosContext
      value={useMemo(
        () => ({
          cachedPhotos,
          cachedPhotosLoadingState,
          recalculateCachedPhotos,
        }),
        [cachedPhotos, cachedPhotosLoadingState, recalculateCachedPhotos],
      )}
    >
      {children}
    </CachedPhotosContext>
  );
};

export const useCachedPhotos = (): CachedPhotosDataType => {
  const context = use(CachedPhotosContext);

  if (context === undefined) {
    throw new Error(
      'useCachedPhotos must be used within an CachedPhotosProvider',
    );
  }

  return context;
};
