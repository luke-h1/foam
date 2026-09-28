import { useMemo } from 'react';

import { MEDIA_THUMBNAIL_SIZE } from '@app/components/live-stream-card/util/thumbnail-sizes';
import type { TwitchStream } from '@app/types/twitch/stream';
import type { UserInfoResponse } from '@app/types/twitch/user';

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
        ? thumbnailUrl
            .replace('{width}', MEDIA_THUMBNAIL_SIZE.width)
            .replace('{height}', MEDIA_THUMBNAIL_SIZE.height)
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
