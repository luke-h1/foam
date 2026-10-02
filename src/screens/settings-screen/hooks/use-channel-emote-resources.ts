import { useQuery } from '@tanstack/react-query';

import { userQueryOptions } from '@app/lib/react-query/queries/twitch';
import { sevenTvService } from '@app/services/seven-tv-service';
import {
  buildBadgeResourceSpecs,
  buildEmoteResourceSpecs,
  settleSpecs,
} from '@app/store/chat/actions/channel-resources';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

export interface ChannelEmoteResources {
  bttvChannelEmotes: SanitisedEmote[];
  ffzChannelEmotes: SanitisedEmote[];
  sevenTvChannelEmotes: SanitisedEmote[];
  twitchChannelEmotes: SanitisedEmote[];
  channelBadges: SanitisedBadgeSet[];
}

async function fetchChannelEmoteResources(
  channelId: string,
): Promise<ChannelEmoteResources> {
  // Channel scope only: the global sets already come from the shared caches,
  // and subscriber emotes need the viewer's own token.
  const emoteSpecs = buildEmoteResourceSpecs({
    channelId,
    sevenTvSetId: sevenTvService.getEmoteSetId(channelId),
  }).filter(
    spec => spec.scope === 'channel' && spec.key !== 'twitchSubscriberEmotes',
  );

  const badgeSpecs = buildBadgeResourceSpecs({ channelId }).filter(
    spec => spec.scope === 'channel',
  );

  const [emotes, badges] = await Promise.all([
    settleSpecs(emoteSpecs),
    settleSpecs(badgeSpecs),
  ]);

  const valueOf = (key: string) => {
    const result = emotes.find(entry => entry.spec.key === key)?.result;
    return result?.status === 'fulfilled' ? result.value : [];
  };

  return {
    bttvChannelEmotes: valueOf('bttvChannelEmotes'),
    ffzChannelEmotes: valueOf('ffzChannelEmotes'),
    sevenTvChannelEmotes: valueOf('sevenTvChannelEmotes'),
    twitchChannelEmotes: valueOf('twitchChannelEmotes'),
    channelBadges: badges.flatMap(entry =>
      entry.result.status === 'fulfilled' ? entry.result.value : [],
    ),
  };
}

/**
 * Loads one channel's own emotes and badges for the viewer, without touching
 * the live chat store. `login` is null when no channel is chosen.
 */
export function useChannelEmoteResources(login: string | null) {
  const userQuery = useQuery({
    ...userQueryOptions(login ?? ''),
    enabled: Boolean(login),
  });

  const channelId = userQuery.data?.id;

  const resourcesQuery = useQuery({
    queryKey: ['emote-badge-viewer', 'channel', channelId],
    // SAFETY: the query is only enabled once channelId is set.
    queryFn: () => fetchChannelEmoteResources(channelId as string),
    enabled: Boolean(channelId),
    staleTime: 5 * 60 * 1000,
  });

  return {
    channel: userQuery.data,
    // An unknown login resolves with no user; a failed request is an error.
    isChannelMissing:
      Boolean(login) &&
      userQuery.isFetched &&
      !userQuery.isError &&
      !userQuery.data,
    isError: Boolean(login) && (userQuery.isError || resourcesQuery.isError),
    isLoading:
      Boolean(login) && (userQuery.isLoading || resourcesQuery.isLoading),
    resources: resourcesQuery.data,
  };
}
