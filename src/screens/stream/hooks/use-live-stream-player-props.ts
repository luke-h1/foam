import { useMemo } from 'react';

import { MEDIA_THUMBNAIL_SIZE } from '@app/components/live-stream-card/util/thumbnailSizes';
import type { TwitchStream } from '@app/types/twitch/stream';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { getTwitchThumbnailUrl } from '@app/utils/twitch/getTwitchThumbnailUrl';

interface UseLiveStreamPlayerPropsOptions {
  isStreamEnabled: boolean;
  resolvedChannelLogin: string;
  stream: TwitchStream | undefined;
  user: UserInfoResponse | undefined;
}

/**
 * The poster and the overlay's stream info. The poster request size matches
 * the live-stream card's, so it is already a cache hit from the stream list.
 */
export function useLiveStreamPlayerProps({
  isStreamEnabled,
  resolvedChannelLogin,
  stream,
  user,
}: UseLiveStreamPlayerPropsOptions) {
  const thumbnailUrl = stream?.thumbnail_url;

  const posterUrl = useMemo(
    () =>
      thumbnailUrl
        ? getTwitchThumbnailUrl(thumbnailUrl, MEDIA_THUMBNAIL_SIZE)
        : undefined,
    [thumbnailUrl],
  );

  const streamInfo = useMemo(
    () =>
      isStreamEnabled && resolvedChannelLogin
        ? {
            userName: stream?.user_name ?? user?.display_name,
            userLogin: resolvedChannelLogin,
            viewerCount: stream?.viewer_count,
            startedAt: stream?.started_at,
            gameName: stream?.game_name,
          }
        : undefined,
    [
      isStreamEnabled,
      resolvedChannelLogin,
      stream?.user_name,
      user?.display_name,
      stream?.viewer_count,
      stream?.started_at,
      stream?.game_name,
    ],
  );

  return { posterUrl, streamInfo };
}
