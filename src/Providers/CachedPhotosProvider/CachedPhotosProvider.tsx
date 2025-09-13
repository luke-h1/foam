import { createContext, PropsWithChildren, use, useMemo } from "react";
import { CachedPhotoType } from "./cache-service";
import {
  CachedPhotosLoadingState,
  useCachedPhotos as useCachedPhotosData,
} from "./useCachedPhotos";

type CachedPhotosDataType = {
  cachedPhotos: CachedPhotoType[];
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
    useCachedPhotosData();

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
      "useCachedPhotos must be used within an CachedPhotosProvider",
    );
  }

  return context;
};
