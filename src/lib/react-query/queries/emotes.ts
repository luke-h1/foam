import { queryOptions } from '@tanstack/react-query';

import { sevenTvService } from '@app/services/seventv-service';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { emoteKeys } from '../query-keys';

const GLOBAL_STALE_TIME = 60 * 60 * 1000;

const PARTIAL_STALE_TIME = 60 * 1000;

async function fetchOrNull<TItem>(
  fetcher: () => Promise<TItem[]>,
): Promise<TItem[] | null> {
  try {
    return await fetcher();
  } catch {
    return null;
  }
}

/**
 * The 7TV badge roster exists only here: the chat store holds per-user
 * entitled badges, never the full roster, so this stays Query-owned per
 * ADR-0005 (screen-only, refetchable, not read by ingest).
 */
export function sevenTvBadgesQueryOptions() {
  return queryOptions<SanitisedBadgeSet[]>({
    queryKey: emoteKeys.sevenTvBadges(),
    staleTime: query =>
      query.state.data?.length ? GLOBAL_STALE_TIME : PARTIAL_STALE_TIME,
    queryFn: async () =>
      (await fetchOrNull(() => sevenTvService.fetchAllBadges())) ?? [],
  });
}
