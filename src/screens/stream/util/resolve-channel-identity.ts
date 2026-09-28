import type { TwitchStream } from '@app/types/twitch/stream';
import type { UserInfoResponse } from '@app/types/twitch/user';

/**
 * A channel's identity can arrive from the stream payload or the user payload,
 * whichever lands first, so both are folded into one shape here rather than
 * re-picked at each use site.
 */
export function resolveChannelIdentity({
  normalizedLogin,
  stream,
  user,
}: {
  normalizedLogin: string;
  stream: TwitchStream | undefined;
  user: UserInfoResponse | undefined;
}) {
  return {
    broadcasterName: stream?.user_name ?? user?.display_name ?? undefined,
    displayName: user?.display_name,
    profileImageUrl: user?.profile_image_url,
    resolvedChannelId: stream?.user_id ?? user?.id,
    resolvedChannelLogin: stream?.user_login ?? user?.login ?? normalizedLogin,
  };
}
