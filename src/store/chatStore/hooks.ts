import { useSelector } from '@legendapp/state/react';
import { useMemo } from 'react';

import { useEmoteRenderPreferences } from '../preferenceStore';
import {
  emptyEmoteData,
  type ChannelCacheType,
  type UserPaint,
} from './constants';
import { chatStore$ } from './state';

export const useLoadingState = () => useSelector(chatStore$.loadingState);
export const useCurrentChannelId = () =>
  useSelector(chatStore$.currentChannelId);
export const useMessages = () => useSelector(chatStore$.messages);
export const useTtvUsers = () => useSelector(chatStore$.ttvUsers);
export const useBits = () => useSelector(chatStore$.bits);
export const useEmojis = () => useSelector(chatStore$.emojis);

function resolveEmoteData(
  cache: ChannelCacheType | undefined,
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

export const useCurrentEmoteData = () => {
  const cache = useSelector(() => {
    const channelId = chatStore$.currentChannelId.get();
    return channelId
      ? chatStore$.persisted.channelCaches[channelId]?.get()
      : undefined;
  });
  const preferences = useEmoteRenderPreferences();
  return resolveEmoteData(cache, preferences);
};

export const useChannelEmoteData = (channelId: string | null) => {
  const cache = useSelector(() =>
    channelId
      ? chatStore$.persisted.channelCaches[channelId]?.get()
      : undefined,
  );
  const preferences = useEmoteRenderPreferences();
  return resolveEmoteData(cache, preferences);
};

export const usePaints = () => useSelector(chatStore$.paints);
export const useUserPaintIds = () => useSelector(chatStore$.userPaintIds);

export const useUserPaints = (): Record<string, UserPaint> => {
  const paints = useSelector(chatStore$.paints);
  const userPaintIds = useSelector(chatStore$.userPaintIds);
  return useMemo(
    () =>
      Object.entries(userPaintIds).reduce<Record<string, UserPaint>>(
        (resolved, [userId, paintId]) => {
          const paint = paints[paintId];
          if (paint) {
            resolved[userId] = { ...paint, ttv_user_id: userId };
          }
          return resolved;
        },
        {},
      ),
    [paints, userPaintIds],
  );
};
