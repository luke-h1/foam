import { useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { usersByIdsQueryOptions } from '@app/lib/react-query/queries/twitch';
import type { TwitchStream } from '@app/types/twitch/stream';

/**
 * Batch-resolves profile pictures for a list of streams and returns the
 * streams enriched with `profilePicture`. The streams endpoints don't include
 * avatars, and fetching one `/users` request per visible card is an N+1
 * against the Helix rate limit — `getUsersById` batches 100 ids per request.
 *
 * `streams` typically grows as an infinite query appends pages, so ids
 * already resolved are cached here and excluded from the next lookup —
 * otherwise each appended page would key a brand new query off the whole
 * accumulated list and re-fetch every previously seen `user_id`.
 *
 * Pass `enabled: false` (e.g. for the compact layout, which shows no avatar)
 * to skip the lookup entirely; the input array is returned untouched.
 */
export function useStreamProfilePictures(
  streams: TwitchStream[],
  enabled: boolean,
): TwitchStream[] {
  // eslint-disable-next-line react-doctor/no-derived-state -- accumulates across pages/query resolutions, not derivable from a single input
  const [profileImageById, setProfileImageById] = useState<Map<string, string>>(
    () => new Map(),
  );

  const missingUserIds = useMemo(() => {
    if (!enabled) {
      return [];
    }
    const missing = new Set<string>();
    for (const stream of streams) {
      if (!profileImageById.has(stream.user_id)) {
        missing.add(stream.user_id);
      }
    }
    // eslint-disable-next-line react-doctor/js-tosorted-immutable -- Hermes lacks Array.prototype.toSorted (throws "undefined is not a function"); copy-then-sort is the safe equivalent
    return [...missing].sort();
  }, [streams, enabled, profileImageById]);

  const { data: users } = useQuery({
    ...usersByIdsQueryOptions(missingUserIds),
    enabled: enabled && missingUserIds.length > 0,
  });

  useEffect(() => {
    if (!users || users.length === 0) {
      return;
    }
    // eslint-disable-next-line react-doctor/no-derived-state -- accumulates across pages/query resolutions, not derivable from a single input
    setProfileImageById(current => {
      const next = new Map(current);
      for (const user of users) {
        next.set(user.id, user.profile_image_url);
      }
      return next;
    });
  }, [users]);

  return useMemo(() => {
    if (!enabled || profileImageById.size === 0) {
      return streams;
    }
    return streams.map(stream => {
      const profilePicture = profileImageById.get(stream.user_id);
      return profilePicture ? { ...stream, profilePicture } : stream;
    });
  }, [streams, enabled, profileImageById]);
}
