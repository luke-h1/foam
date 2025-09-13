import { useCallback, useEffect, useState } from 'react';
import { MEDIA_LIBRARY_PHOTOS_LIMIT } from '../CachedPhotosProvider/useCachedPhotos';
import { isImageFile, sortByName } from './filesystem/files.web';
import * as filesystem from './filesystem/filesystem.web';
import {
  Directory,
  FilesystemDirectory,
  FileEntry,
  API,
  WebkitDirectory,
} from './filesystem/types.web';
import * as webkit from './filesystem/webkit.web';

export type MediaLibraryPhoto = FileEntry;

export type MediaLibraryLoadingState = 'IDLE' | 'LOADING' | 'COMPLETED';

export function useMediaLibraryPhotos(directory: Directory | null, api: API) {
  const [loadingState, setLoadingState] =
    useState<MediaLibraryLoadingState>('IDLE');

  const [photos, setPhotos] = useState<MediaLibraryPhoto[]>([]);

  // Reloads all the photos
  const reloadPhotos = useCallback(async () => {
    if (!directory) {
      setPhotos([]);
      return;
    }

    setLoadingState('LOADING');

    // Depending on the type of directory (webkit vs filesystem), use different file loading API
    const photoFiles =
      api === 'filesystem'
        ? await filesystem.loadAllFiles(
            directory as FilesystemDirectory,
            MEDIA_LIBRARY_PHOTOS_LIMIT,
            isImageFile<FileEntry>,
            sortByName<FileEntry>,
          )
        : webkit.loadAllFiles(
            directory as WebkitDirectory,
            MEDIA_LIBRARY_PHOTOS_LIMIT,
            isImageFile<File>,
            sortByName<FileEntry>,
          );
    setPhotos(photoFiles);

    setLoadingState('COMPLETED');
  }, [directory, api]);

  // Add useEffect to reload photos automatically after every directory change
  useEffect(() => {
    void reloadPhotos();
  }, [directory, reloadPhotos]);

  return {
    mediaLibraryPhotosCount: photos.length,
    mediaLibraryPhotos: photos,
    mediaLibraryLoadingState: loadingState,
    reloadMediaLibraryPhotos: reloadPhotos,
  };
}
