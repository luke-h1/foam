import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { usersByIdsQueryOptions } from '@app/lib/react-query/queries/twitch';
import type { TwitchStream } from '@app/types/twitch/stream';

/**
 * Batch-resolves profile pictures for a list of streams and returns the
 * streams enriched with `profilePicture`. The streams endpoints don't include
 * avatars, and fetching one `/users` request per visible card is an N+1
 * against the Helix rate limit — `getUsersById` batches 100 ids per request.
 *
 * Pass `enabled: false` (e.g. for the compact layout, which shows no avatar)
 * to skip the lookup entirely; the input array is returned untouched.
 */
export function useStreamProfilePictures(
  streams: TwitchStream[],
  enabled: boolean,
): TwitchStream[] {
  const userIds = useMemo(
    () => [...new Set(streams.map(stream => stream.user_id))].toSorted(),
    [streams],
  );

  const { data: users } = useQuery({
    ...usersByIdsQueryOptions(userIds),
    enabled: enabled && userIds.length > 0,
  });

  return useMemo(() => {
    if (!enabled || !users || users.length === 0) {
      return streams;
    }
    const profileImageById = new Map(
      users.map(user => [user.id, user.profile_image_url]),
    );
    return streams.map(stream => {
      const profilePicture = profileImageById.get(stream.user_id);
      return profilePicture ? { ...stream, profilePicture } : stream;
    });
  }, [streams, users, enabled]);
}
