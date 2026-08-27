import { useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { usersByIdsQueryOptions } from '@app/lib/react-query/queries/twitch';
import type { TwitchStream } from '@app/types/twitch/stream';

/**
 * Enriches streams with `profilePicture` via one batched `/users` lookup - the streams endpoints have no avatars and a per-card request is an N+1 against the Helix rate limit. Resolved ids are cached and excluded from the next lookup so appended infinite-query pages do not re-fetch every seen `user_id`; `enabled: false` returns the input untouched.
 */
export function useStreamProfilePictures(
  streams: TwitchStream[],
  enabled: boolean,
): TwitchStream[] {
  // eslint-disable-next-line react-doctor/no-derived-state -- accumulates across pages
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
    // eslint-disable-next-line react-doctor/js-tosorted-immutable -- Hermes lacks toSorted
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
    // eslint-disable-next-line react-doctor/no-derived-state -- accumulates across pages
    // react-doctor-disable-next-line react-hooks-js/set-state-in-effect -- merges resolved ids across query pages
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
