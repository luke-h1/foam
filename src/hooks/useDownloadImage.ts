import { getAppAlbum } from '@app/utils';
import { createId } from '@paralleldrive/cuid2';
import { useMutation } from '@tanstack/react-query';
import { Directory, File, Paths } from 'expo-file-system/next';
import * as MediaLibrary from 'expo-media-library';

interface DownloadImageVariables {
  url: string;
}

export function useDownloadImage() {
  const { isError, isPending, isSuccess, mutate } = useMutation<
    unknown,
    Error,
    DownloadImageVariables
  >({
    mutationFn: async ({ url }) => {
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

      const file = await File.downloadFileAsync(url, directory);

      const album = await getAppAlbum();
      const asset = await MediaLibrary.createAssetAsync(file.uri);

      await MediaLibrary.addAssetsToAlbumAsync([asset], album);

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
