import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import {
  followedChannelProfileImagesQueryOptions,
  followedChannelsQueryOptions,
} from '@app/lib/react-query/queries/twitch';
import type { FollowedChannelWithProfile } from '@app/types/twitch/channel';

type FollowedChannelsQueryOptions = Omit<
  UseQueryOptions<FollowedChannelWithProfile[], Error>,
  'queryKey' | 'queryFn' | 'staleTime'
>;

/**
 * Channels render immediately; profile images merge in via a dependent query (text-avatar fallback until then). Both hops used to be serialized in one queryFn, so the list waited on the second request.
 */
export function useFollowedChannelsQuery(
  userId: string,
  options?: FollowedChannelsQueryOptions,
) {
  const channelsQuery = useQuery({
    ...followedChannelsQueryOptions(userId),
    ...options,
  });

  const broadcasterIds =
    channelsQuery.data?.map(channel => channel.broadcaster_id) ?? [];
  const profileImagesQuery = useQuery(
    followedChannelProfileImagesQueryOptions(broadcasterIds),
  );

  const profileImages = profileImagesQuery.data;
  const data =
    channelsQuery.data && profileImages
      ? channelsQuery.data.map(channel => ({
          ...channel,
          profile_image_url: profileImages.get(channel.broadcaster_id),
        }))
      : channelsQuery.data;

  return { ...channelsQuery, data };
}
