import { useAuthContext } from '@app/context/AuthContext';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { createId } from '@paralleldrive/cuid2';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { twitchService, type TwitchClip } from '@app/services/twitch-service';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { saveFilesToAppAlbum } from '@app/utils/image/saveFilesToAppAlbum';

interface DownloadTwitchClipVariables {
  clip: TwitchClip;
}

export function useDownloadTwitchClip() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { isPending, mutate, variables } = useMutation<
    unknown,
    Error,
    DownloadTwitchClipVariables
  >({
    mutationFn: async ({ clip }) => {
      if (!user?.id) {
        throw new Error('Sign in with Twitch to download clips');
      }

      const download = await twitchService.getClipDownload({
        broadcasterId: clip.broadcaster_id,
        clipId: clip.id,
        editorId: user.id,
      });

      const downloadUrl =
        download?.landscape_download_url ?? download?.portrait_download_url;

      if (!downloadUrl) {
        throw new Error('Twitch did not return a clip download URL');
      }

      if (Platform.OS === 'web') {
        openLinkInBrowser(downloadUrl);
        return;
      }

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

      const file = await File.downloadFileAsync(downloadUrl, directory);

      await saveFilesToAppAlbum(file.uri);
      directory.delete();
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: twitchKeys.clips() });
    },
  });

  return {
    downloadingClipId: isPending ? variables?.clip.id : undefined,
    download: mutate,
    isPending,
  };
}
