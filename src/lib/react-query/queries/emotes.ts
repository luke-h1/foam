import { queryOptions } from '@tanstack/react-query';

import { sevenTvService } from '@app/services/seven-tv-service';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { emoteKeys } from '../queryKeys';

const GLOBAL_STALE_TIME = 60 * 60 * 1000;

const PARTIAL_STALE_TIME = 60 * 1000;

export function sevenTvBadgesQueryOptions() {
  return queryOptions<SanitisedBadgeSet[]>({
    queryKey: emoteKeys.sevenTvBadges(),
    staleTime: query =>
      query.state.data?.length ? GLOBAL_STALE_TIME : PARTIAL_STALE_TIME,
    queryFn: () => sevenTvService.fetchAllBadges(),
  });
}
