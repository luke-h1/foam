import type { TwitchStream } from '@app/types/twitch/stream';
import type { UserInfoResponse } from '@app/types/twitch/user';

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
    broadcasterName: stream?.user_name ?? user?.display_name,
    displayName: user?.display_name,
    profileImageUrl: user?.profile_image_url,
    resolvedChannelId: stream?.user_id ?? user?.id,
    resolvedChannelLogin: stream?.user_login ?? user?.login ?? normalizedLogin,
  };
}
