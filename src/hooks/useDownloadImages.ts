import { saveFilesToAppAlbum } from '@app/utils/image/saveFilesToAppAlbum';
import { createId } from '@paralleldrive/cuid2';
import { useMutation } from '@tanstack/react-query';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

interface DownloadImageVariables {
  urls: string[];
}

export function useDownloadImages() {
  const { isError, isPending, isSuccess, mutate } = useMutation<
    unknown,
    Error,
    DownloadImageVariables
  >({
    mutationFn: async ({ urls }) => {
      const { granted } = await MediaLibrary.requestPermissionsAsync();

      if (!granted) {
        throw new Error('Permission not granted');
      }

      const directory = new Directory(Paths.cache, createId());

      directory.create({
        intermediates: true,
        idempotent: true,
        overwrite: true,
      });

      const files = await Promise.all(
        urls.map(url => File.downloadFileAsync(url, directory)),
      );

      await saveFilesToAppAlbum(files.map(file => file.uri));
      directory.delete();
    },
  });

  return {
    download: mutate,
    isError,
    isPending,
    isSuccess,
  };
}
