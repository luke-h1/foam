import { getAppAlbum } from '@app/utils/image/getAppAlbum';
import { createId } from '@paralleldrive/cuid2';
import { useMutation } from '@tanstack/react-query';
import { Directory, File, Paths } from 'expo-file-system/next';
import * as MediaLibrary from 'expo-media-library';
import compact from 'lodash/compact';

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

      const assets = await Promise.all(
        urls.map(async url => {
          const file = await File.downloadFileAsync(url, directory);

          return MediaLibrary.createAssetAsync(file.uri);
        }),
      );

      const album = await getAppAlbum();
      await MediaLibrary.addAssetsToAlbumAsync(compact(assets), album);
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
