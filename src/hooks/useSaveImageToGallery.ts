import { Platform } from 'react-native';

import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { saveFilesToAppAlbum } from '@app/utils/image/saveFilesToAppAlbum';
import { ensureMediaLibraryPermission } from '@app/utils/media/ensureMediaLibraryPermission';

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

      const granted = await ensureMediaLibraryPermission();
      if (!granted) {
        throw new Error('Permission not granted');
      }

      const directory = new Directory(Paths.cache, Crypto.randomUUID());

      directory.create({
        intermediates: true,
        idempotent: true,
        overwrite: true,
      });

      const downloadAndSave = async () => {
        const file = await File.downloadFileAsync(url, directory);
        await saveFilesToAppAlbum(file.uri);
      };

      await downloadAndSave().finally(() => {
        directory.delete();
      });
    },
  });

  return {
    isSaving: isPending,
    saveImage: mutate,
  };
}
