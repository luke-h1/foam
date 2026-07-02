import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { followedChannelsQueryOptions } from '@app/lib/react-query/queries/twitch';
import type { FollowedChannelWithProfile } from '@app/types/twitch/channel';

type FollowedChannelsQueryOptions = Omit<
  UseQueryOptions<FollowedChannelWithProfile[], Error>,
  'queryKey' | 'queryFn' | 'staleTime'
>;

export function useFollowedChannelsQuery(
  userId: string,
  options?: FollowedChannelsQueryOptions,
) {
  return useQuery({
    ...followedChannelsQueryOptions(userId),
    ...options,
  });
}
