import { queryOptions } from '@tanstack/react-query';

import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { emoteKeys } from '../query-keys';

const GLOBAL_STALE_TIME = 60 * 60 * 1000;

/**
 * Freshness window when at least one provider failed, so the hole is retried
 * on the next mount instead of being cached as complete for the full hour.
 */
const PARTIAL_STALE_TIME = 60 * 1000;

export interface GlobalEmoteData {
  bttvGlobalEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];
  twitchGlobalEmotes: SanitisedEmote[];
  /**
   * True when any provider fetch failed and its slice is an empty
   * placeholder rather than a real result.
   */
  partial: boolean;
}

async function fetchOrNull<TItem>(
  fetcher: () => Promise<TItem[]>,
): Promise<TItem[] | null> {
  try {
    return await fetcher();
  } catch {
    return null;
  }
}

export function globalEmotesQueryOptions() {
  return queryOptions<GlobalEmoteData>({
    queryKey: emoteKeys.globalEmotes(),
    staleTime: query =>
      query.state.data?.partial ? PARTIAL_STALE_TIME : GLOBAL_STALE_TIME,
    queryFn: async () => {
      const [
        sevenTvGlobalEmotes,
        twitchGlobalEmotes,
        bttvGlobalEmotes,
        ffzGlobalEmotes,
      ] = await Promise.all([
        fetchOrNull(() => sevenTvService.getSanitisedEmoteSet('global')),
        fetchOrNull(() => twitchEmoteService.getGlobalEmotes()),
        fetchOrNull(() => bttvEmoteService.getSanitisedGlobalEmotes()),
        fetchOrNull(() => ffzService.getSanitisedGlobalEmotes()),
      ]);

      return {
        bttvGlobalEmotes: bttvGlobalEmotes ?? [],
        ffzGlobalEmotes: ffzGlobalEmotes ?? [],
        sevenTvGlobalEmotes: sevenTvGlobalEmotes ?? [],
        twitchGlobalEmotes: twitchGlobalEmotes ?? [],
        partial: [
          sevenTvGlobalEmotes,
          twitchGlobalEmotes,
          bttvGlobalEmotes,
          ffzGlobalEmotes,
        ].some(result => result === null),
      };
    },
  });
}

// Badge fetch failures propagate so react-query retries them with backoff —
// swallowing them into [] would cache the empty result as fresh for an hour.
export function globalBadgesQueryOptions() {
  return queryOptions<SanitisedBadgeSet[]>({
    queryKey: emoteKeys.globalBadges(),
    staleTime: GLOBAL_STALE_TIME,
    queryFn: () => twitchBadgeService.listSanitisedGlobalBadges(),
  });
}

export function sevenTvBadgesQueryOptions() {
  return queryOptions<SanitisedBadgeSet[]>({
    queryKey: emoteKeys.sevenTvBadges(),
    staleTime: GLOBAL_STALE_TIME,
    queryFn: () => sevenTvService.fetchAllBadges(),
  });
}
