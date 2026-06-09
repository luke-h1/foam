import { useSelector } from '@legendapp/state/react';

import { useEmoteRenderPreferences } from '../../preferences/selectors';
import {
  emptyEmoteData,
  type ChannelCacheType,
  type PaintData,
  type SanitisedBadgeSet,
  type SanitisedEmote,
} from '../types/constants';
import { chatStore$ } from '../observables/chatStore';

export const useMessages = () => useSelector(chatStore$.messages);
export const useTtvUsers = () => useSelector(chatStore$.ttvUsers);
export const useEmojis = () => useSelector(chatStore$.emojis);
export const useMentionLoginRevision = () =>
  useSelector(chatStore$.mentionLoginRevision);

type ChannelEmoteData = Pick<
  ChannelCacheType,
  | 'twitchChannelEmotes'
  | 'twitchGlobalEmotes'
  | 'twitchSubscriberEmotes'
  | 'twitchSubscriberChannelProfiles'
  | 'sevenTvChannelEmotes'
  | 'sevenTvGlobalEmotes'
  | 'ffzChannelEmotes'
  | 'ffzGlobalEmotes'
  | 'bttvGlobalEmotes'
  | 'bttvChannelEmotes'
  | 'twitchChannelBadges'
  | 'twitchGlobalBadges'
  | 'ffzChannelBadges'
  | 'ffzGlobalBadges'
  | 'chatterinoBadges'
>;

const EMPTY_EMOTES: SanitisedEmote[] = [];
const EMPTY_BADGES: SanitisedBadgeSet[] = [];
const EMPTY_PROFILES: Record<
  string,
  { name: string; profileImageUrl: string }
> = {};

function resolveEmoteData(
  cache: ChannelEmoteData | undefined,
  preferences: ReturnType<typeof useEmoteRenderPreferences>,
) {
  if (!cache) {
    return emptyEmoteData;
  }

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
      : [],
    twitchSubscriberEmotes: preferences.showTwitchEmotes
      ? (cache.twitchSubscriberEmotes ?? [])
      : [],
    twitchSubscriberChannelProfiles:
      cache.twitchSubscriberChannelProfiles ?? {},
    sevenTvChannelEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvChannelEmotes ?? [])
      : [],
    sevenTvGlobalEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvGlobalEmotes ?? [])
      : [],
    ffzChannelEmotes: preferences.showFFzEmotes
      ? (cache.ffzChannelEmotes ?? [])
      : [],
    ffzGlobalEmotes: preferences.showFFzEmotes
      ? (cache.ffzGlobalEmotes ?? [])
      : [],
    bttvGlobalEmotes: preferences.showBttvEmotes
      ? (cache.bttvGlobalEmotes ?? [])
      : [],
    bttvChannelEmotes: preferences.showBttvEmotes
      ? (cache.bttvChannelEmotes ?? [])
      : [],
    twitchChannelBadges: preferences.showTwitchBadges
      ? (cache.twitchChannelBadges ?? [])
      : [],
    twitchGlobalBadges: preferences.showTwitchBadges
      ? (cache.twitchGlobalBadges ?? [])
      : [],
    ffzChannelBadges: preferences.showFFzBadges
      ? (cache.ffzChannelBadges ?? [])
      : [],
    ffzGlobalBadges: preferences.showFFzBadges
      ? (cache.ffzGlobalBadges ?? [])
      : [],
    chatterinoBadges: preferences.showChatterinoEmotes
      ? (cache.chatterinoBadges ?? [])
      : [],
  };
}

function getChannelEmoteData(channelId: string | null): ChannelEmoteData {
  if (!channelId) {
    return emptyEmoteData;
  }

  const cache$ = chatStore$.persisted.channelCaches[channelId];

  return {
    twitchChannelEmotes: cache$?.twitchChannelEmotes.get() ?? EMPTY_EMOTES,
    twitchGlobalEmotes: cache$?.twitchGlobalEmotes.get() ?? EMPTY_EMOTES,
    twitchSubscriberEmotes:
      cache$?.twitchSubscriberEmotes.get() ?? EMPTY_EMOTES,
    twitchSubscriberChannelProfiles:
      cache$?.twitchSubscriberChannelProfiles.get() ?? EMPTY_PROFILES,
    sevenTvChannelEmotes: cache$?.sevenTvChannelEmotes.get() ?? EMPTY_EMOTES,
    sevenTvGlobalEmotes: cache$?.sevenTvGlobalEmotes.get() ?? EMPTY_EMOTES,
    ffzChannelEmotes: cache$?.ffzChannelEmotes.get() ?? EMPTY_EMOTES,
    ffzGlobalEmotes: cache$?.ffzGlobalEmotes.get() ?? EMPTY_EMOTES,
    bttvGlobalEmotes: cache$?.bttvGlobalEmotes.get() ?? EMPTY_EMOTES,
    bttvChannelEmotes: cache$?.bttvChannelEmotes.get() ?? EMPTY_EMOTES,
    twitchChannelBadges: cache$?.twitchChannelBadges.get() ?? EMPTY_BADGES,
    twitchGlobalBadges: cache$?.twitchGlobalBadges.get() ?? EMPTY_BADGES,
    ffzChannelBadges: cache$?.ffzChannelBadges.get() ?? EMPTY_BADGES,
    ffzGlobalBadges: cache$?.ffzGlobalBadges.get() ?? EMPTY_BADGES,
    chatterinoBadges: cache$?.chatterinoBadges.get() ?? EMPTY_BADGES,
  };
}

export const useCurrentEmoteData = () => {
  const cache = useSelector(() => {
    const channelId = chatStore$.currentChannelId.get();
    return getChannelEmoteData(channelId);
  });
  const preferences = useEmoteRenderPreferences();
  return resolveEmoteData(cache, preferences);
};

export const useChannelEmoteData = (channelId: string | null) => {
  const cache = useSelector(() => getChannelEmoteData(channelId));
  const preferences = useEmoteRenderPreferences();
  return resolveEmoteData(cache, preferences);
};

export const usePaints = () => useSelector(chatStore$.paints);

export const useUserPaint = (userId?: string): PaintData | null =>
  useSelector(() => {
    if (!userId) {
      return null;
    }

    const paintId = chatStore$.userPaintIds[userId]?.get();
    return paintId ? (chatStore$.paints[paintId]?.get() ?? null) : null;
  });
