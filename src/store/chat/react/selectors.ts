import { useSelector } from '@legendapp/state/react';

import { useEmoteRenderPreferences } from '@app/store/preferences/selectors';
import { getChatterinoBadges } from '@app/utils/chat/chatterinoBadges';

import { chatStore$ } from '../observables/chatStore';
import {
  type ChannelCacheType,
  emptyEmoteData,
  emptyResolvedEmoteData,
  type SanitisedBadgeSet,
  type SanitisedEmote,
} from '../types/constants';

export const useMessages = () => useSelector(chatStore$.messages);
export const useEmojis = () => useSelector(chatStore$.emojis);

type ChannelEmoteCache = Pick<
  ChannelCacheType,
  | 'twitchChannelEmotes'
  | 'twitchGlobalEmotes'
  | 'twitchSubscriberEmotes'
  | 'twitchSubscriberChannelProfiles'
  | 'sevenTvPersonalEmotes'
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
>;

type ChannelEmoteData = ChannelEmoteCache & {
  chatterinoBadges: SanitisedBadgeSet[];
};

const EMPTY_EMOTES: SanitisedEmote[] = [];
const EMPTY_BADGES: SanitisedBadgeSet[] = [];
const EMPTY_SUBSCRIBER_PROFILES: NonNullable<
  ChannelCacheType['twitchSubscriberChannelProfiles']
> = {};
const EMPTY_PERSONAL_EMOTES: ChannelCacheType['sevenTvPersonalEmotes'] = {};

function resolveEmoteData(
  cache: ChannelEmoteCache | undefined,
  preferences: ReturnType<typeof useEmoteRenderPreferences>,
): ChannelEmoteData {
  if (!cache) {
    return emptyResolvedEmoteData;
  }

  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? EMPTY_EMOTES)
      : EMPTY_EMOTES,
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? EMPTY_EMOTES)
      : EMPTY_EMOTES,
    twitchSubscriberEmotes: preferences.showTwitchEmotes
      ? (cache.twitchSubscriberEmotes ?? EMPTY_EMOTES)
      : EMPTY_EMOTES,
    twitchSubscriberChannelProfiles: preferences.showTwitchEmotes
      ? (cache.twitchSubscriberChannelProfiles ?? EMPTY_SUBSCRIBER_PROFILES)
      : EMPTY_SUBSCRIBER_PROFILES,
    sevenTvPersonalEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvPersonalEmotes ?? EMPTY_PERSONAL_EMOTES)
      : EMPTY_PERSONAL_EMOTES,
    sevenTvChannelEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvChannelEmotes ?? EMPTY_EMOTES)
      : EMPTY_EMOTES,
    sevenTvGlobalEmotes: preferences.show7TvEmotes
      ? (cache.sevenTvGlobalEmotes ?? EMPTY_EMOTES)
      : EMPTY_EMOTES,
    ffzChannelEmotes: preferences.showFFzEmotes
      ? (cache.ffzChannelEmotes ?? EMPTY_EMOTES)
      : EMPTY_EMOTES,
    ffzGlobalEmotes: preferences.showFFzEmotes
      ? (cache.ffzGlobalEmotes ?? EMPTY_EMOTES)
      : EMPTY_EMOTES,
    bttvGlobalEmotes: preferences.showBttvEmotes
      ? (cache.bttvGlobalEmotes ?? EMPTY_EMOTES)
      : EMPTY_EMOTES,
    bttvChannelEmotes: preferences.showBttvEmotes
      ? (cache.bttvChannelEmotes ?? EMPTY_EMOTES)
      : EMPTY_EMOTES,
    twitchChannelBadges: preferences.showTwitchBadges
      ? (cache.twitchChannelBadges ?? EMPTY_BADGES)
      : EMPTY_BADGES,
    twitchGlobalBadges: preferences.showTwitchBadges
      ? (cache.twitchGlobalBadges ?? EMPTY_BADGES)
      : EMPTY_BADGES,
    ffzChannelBadges: preferences.showFFzBadges
      ? (cache.ffzChannelBadges ?? EMPTY_BADGES)
      : EMPTY_BADGES,
    ffzGlobalBadges: preferences.showFFzBadges
      ? (cache.ffzGlobalBadges ?? EMPTY_BADGES)
      : EMPTY_BADGES,
    chatterinoBadges: preferences.showChatterinoEmotes
      ? getChatterinoBadges()
      : EMPTY_BADGES,
  };
}

function getChannelEmoteData(channelId: string | null): ChannelEmoteCache {
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
      cache$?.twitchSubscriberChannelProfiles.get() ??
      EMPTY_SUBSCRIBER_PROFILES,
    sevenTvPersonalEmotes:
      cache$?.sevenTvPersonalEmotes.get() ?? EMPTY_PERSONAL_EMOTES,
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

export const useChannelEmoteDataForReprocess = (channelId: string | null) => {
  return useSelector(() => {
    if (!channelId) {
      return null;
    }
    const cache$ = chatStore$.persisted.channelCaches[channelId];
    return {
      twitchChannelEmotes: cache$?.twitchChannelEmotes.get() ?? EMPTY_EMOTES,
      twitchGlobalEmotes: cache$?.twitchGlobalEmotes.get() ?? EMPTY_EMOTES,
      twitchSubscriberEmotes:
        cache$?.twitchSubscriberEmotes.get() ?? EMPTY_EMOTES,
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
    };
  });
};

export const usePaints = () => useSelector(chatStore$.paints);
export const useCosmeticBindingsVersion = () =>
  useSelector(chatStore$.cosmeticBindingsVersion);
export const usePersonalEmotesVersion = () =>
  useSelector(chatStore$.personalEmotesVersion);
