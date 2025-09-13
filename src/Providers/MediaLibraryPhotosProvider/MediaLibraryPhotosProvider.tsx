import { PersistedStateStatus } from '@app/hooks';
import { createContext, PropsWithChildren, use, useMemo } from 'react';
import {
  MediaLibraryLoadingState,
  MediaLibraryPermissionsStatus,
  MediaLibraryPhoto,
  useMediaLibraryPhotos as useMediaLibraryPhotosHook,
} from './useMediaLibraryPhotos';

type MediaLibraryPhotosDataType = {
  mediaLibraryPermissionsStatus: MediaLibraryPermissionsStatus;
  mediaLibraryPhotosCount: number | undefined;
  mediaLibraryLoadingState: MediaLibraryLoadingState;
  mediaLibraryPhotos: MediaLibraryPhoto[];
  reloadMediaLibraryPhotos: () => Promise<void>;
  stateRestorationStatus: PersistedStateStatus;
};

const MediaLibraryPhotosContext = createContext<
  MediaLibraryPhotosDataType | undefined
>(undefined);

/**
 * Provides the device photos.
 */
export const MediaLibraryPhotosProvider = ({ children }: PropsWithChildren) => {
  const {
    mediaLibraryPhotosCount,
    mediaLibraryLoadingState,
    mediaLibraryPhotos,
    mediaLibraryPermissionsStatus,
    reloadMediaLibraryPhotos,
    stateRestorationStatus,
  } = useMediaLibraryPhotosHook();

  return (
    <MediaLibraryPhotosContext
      value={useMemo(
        () => ({
          mediaLibraryPermissionsStatus,
          mediaLibraryPhotosCount,
          mediaLibraryLoadingState,
          mediaLibraryPhotos,
          reloadMediaLibraryPhotos,
          stateRestorationStatus,
        }),
        [
          mediaLibraryPermissionsStatus,
          mediaLibraryPhotosCount,
          mediaLibraryLoadingState,
          mediaLibraryPhotos,
          reloadMediaLibraryPhotos,
          stateRestorationStatus,
        ],
      )}
    >
      {children}
    </MediaLibraryPhotosContext>
  );
};

export const useMediaLibraryPhotos = (): MediaLibraryPhotosDataType => {
  const context = use(MediaLibraryPhotosContext);

  if (context === undefined) {
    throw new Error(
      'useMediaLibraryPhotos must be used within an MediaLibraryPhotosProvider',
    );
  }

  return context;
};
