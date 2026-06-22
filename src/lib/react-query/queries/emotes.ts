import { queryOptions } from '@tanstack/react-query';

import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import type { SanitisedEmote } from '@app/types/emote';

import { emoteKeys } from '../query-keys';

const GLOBAL_STALE_TIME = 60 * 60 * 1000;

export interface GlobalEmoteData {
  bttvGlobalEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];
  twitchGlobalEmotes: SanitisedEmote[];
}

async function fetchOrEmpty<TItem>(
  fetcher: () => Promise<TItem[]>,
): Promise<TItem[]> {
  try {
    return await fetcher();
  } catch {
    return [];
  }
}

export function globalEmotesQueryOptions() {
  return queryOptions<GlobalEmoteData>({
    queryKey: emoteKeys.globalEmotes(),
    staleTime: GLOBAL_STALE_TIME,
    queryFn: async () => {
      const [
        sevenTvGlobalEmotes,
        twitchGlobalEmotes,
        bttvGlobalEmotes,
        ffzGlobalEmotes,
      ] = await Promise.all([
        fetchOrEmpty(() => sevenTvService.getSanitisedEmoteSet('global')),
        fetchOrEmpty(() => twitchEmoteService.getGlobalEmotes()),
        fetchOrEmpty(() => bttvEmoteService.getSanitisedGlobalEmotes()),
        fetchOrEmpty(() => ffzService.getSanitisedGlobalEmotes()),
      ]);

      return {
        bttvGlobalEmotes,
        ffzGlobalEmotes,
        sevenTvGlobalEmotes,
        twitchGlobalEmotes,
      };
    },
  });
}

export function globalBadgesQueryOptions() {
  return queryOptions<SanitisedBadgeSet[]>({
    queryKey: emoteKeys.globalBadges(),
    staleTime: GLOBAL_STALE_TIME,
    queryFn: async () => {
      const [twitchGlobalBadges, ffzGlobalBadges] = await Promise.all([
        fetchOrEmpty(() => twitchBadgeService.listSanitisedGlobalBadges()),
        fetchOrEmpty(() => ffzService.getSanitisedGlobalBadges()),
      ]);

      return [...twitchGlobalBadges, ...ffzGlobalBadges];
    },
  });
}
