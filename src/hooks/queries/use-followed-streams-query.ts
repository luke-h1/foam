import { followedStreamsQueryOptions } from '@app/lib/react-query/queries/twitch';
import type { TwitchStream } from '@app/services/twitch-service';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

type FollowedStreamsQueryOptions = Omit<
  UseQueryOptions<TwitchStream[], Error>,
  'queryKey' | 'queryFn' | 'staleTime'
>;

export function useFollowedStreamsQuery(
  userId: string,
  options?: FollowedStreamsQueryOptions,
) {
  return useQuery({
    ...followedStreamsQueryOptions(userId),
    ...options,
  });
}
