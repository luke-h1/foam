import { CachedPhotosLoadingState } from '@app/hooks/useCachedImages';
import { createContext, PropsWithChildren, use, useMemo } from 'react';
import { useMediaLibraryPhotos } from '../MediaLibraryPhotosProvider/MediaLibraryPhotosProvider.web';
import { CachedImage } from './image-cache-service';

type CachedPhotosDataType = {
  cachedPhotos: CachedImage[];
  cachedPhotosLoadingState: CachedPhotosLoadingState;
  recalculateCachedPhotos: () => void;
};

const CachedPhotosContext = createContext<CachedPhotosDataType | undefined>(
  undefined,
);

export const CachedPhotosProvider = ({ children }: PropsWithChildren) => {
  const mediaLibraryPhotosContext = useMediaLibraryPhotos();

  const contextValue: CachedPhotosDataType = useMemo(() => {
    return {
      cachedPhotos: mediaLibraryPhotosContext.mediaLibraryPhotos.map(item => ({
        originalImageUri: item.uri,
        mipmapWidth: 100,
        cachedImageUri: item.uri,
      })),
      cachedPhotosLoadingState:
        mediaLibraryPhotosContext.mediaLibraryLoadingState === 'COMPLETED'
          ? 'COMPLETED'
          : 'CALCULATING',

      recalculateCachedPhotos:
        mediaLibraryPhotosContext.reloadMediaLibraryPhotos,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CachedPhotosContext.Provider value={contextValue}>
      {children}
    </CachedPhotosContext.Provider>
  );
};

export const useCachedPhotos = (): CachedPhotosDataType => {
  const context = use(CachedPhotosContext);
  if (!context) {
    throw new Error(
      'useCachedPhotos must be used within a CachedPhotosProvider',
    );
  }
  return context;
};
