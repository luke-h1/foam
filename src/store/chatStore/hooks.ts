import { useSelector } from '@legendapp/state/react';

import { usePreferences } from '../preferenceStore';
import type { UserPaint } from './constants';
import { emptyEmoteData } from './constants';
import { chatStore$ } from './state';

export const useLoadingState = () => useSelector(chatStore$.loadingState);
export const useCurrentChannelId = () =>
  useSelector(chatStore$.currentChannelId);
export const useMessages = () => useSelector(chatStore$.messages);
export const useTtvUsers = () => useSelector(chatStore$.ttvUsers);
export const useBits = () => useSelector(chatStore$.bits);
export const useEmojis = () => useSelector(chatStore$.emojis);

export const useCurrentEmoteData = () => {
  const channelId = useSelector(chatStore$.currentChannelId);
  const caches = useSelector(chatStore$.persisted.channelCaches);
  const preferences = usePreferences();
  if (!channelId) return emptyEmoteData;
  const cache = caches?.[channelId];
  if (!cache) return emptyEmoteData;
  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
      : [],
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
};

export const useChannelEmoteData = (channelId: string | null) => {
  const caches = useSelector(chatStore$.persisted.channelCaches);
  const preferences = usePreferences();
  if (!channelId) return emptyEmoteData;
  const cache = caches?.[channelId];
  if (!cache) return emptyEmoteData;
  return {
    twitchChannelEmotes: preferences.showTwitchEmotes
      ? (cache.twitchChannelEmotes ?? [])
      : [],
    twitchGlobalEmotes: preferences.showTwitchEmotes
      ? (cache.twitchGlobalEmotes ?? [])
      : [],
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
};

export const usePaints = () => useSelector(chatStore$.paints);
export const useUserPaintIds = () => useSelector(chatStore$.userPaintIds);

export const useUserPaints = (): Record<string, UserPaint> => {
  const paints = useSelector(chatStore$.paints);
  const userPaintIds = useSelector(chatStore$.userPaintIds);
  return Object.entries(userPaintIds).reduce<Record<string, UserPaint>>(
    (resolved, [userId, paintId]) => {
      const paint = paints[paintId];
      if (paint) {
        resolved[userId] = { ...paint, ttv_user_id: userId };
      }
      return resolved;
    },
    {},
  );
};
