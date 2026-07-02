import { Platform } from 'react-native';

import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { saveFilesToAppAlbum } from '@app/utils/image/saveFilesToAppAlbum';

interface SaveImageToGalleryVariables {
  url: string;
}

export function useSaveImageToGallery() {
  // eslint-disable-next-line react-doctor/query-mutation-missing-invalidation
  const { isPending, mutate } = useMutation<
    unknown,
    Error,
    SaveImageToGalleryVariables
  >({
    mutationFn: async ({ url }) => {
      if (!url) {
        throw new Error('No image source to save');
      }

      if (Platform.OS === 'web') {
        openLinkInBrowser(url);
        return;
      }

      const { granted } = await MediaLibrary.requestPermissionsAsync();

      if (!granted) {
        throw new Error('Permission not granted');
      }

      const directory = new Directory(Paths.cache, Crypto.randomUUID());

      directory.create({
        intermediates: true,
        idempotent: true,
        overwrite: true,
      });

      try {
        const file = await File.downloadFileAsync(url, directory);
        await saveFilesToAppAlbum(file.uri);
      } finally {
        directory.delete();
      }
    },
  });

  return {
    isSaving: isPending,
    saveImage: mutate,
  };
}
