import { useSelector } from '@legendapp/state/react';

import { getBttvBadges } from '@app/store/chat/actions/bttv-badges/getBttvBadges';
import { getChatterinoBadges } from '@app/store/chat/actions/chatterinoBadges';
import { useEmoteRenderPreferences } from '@app/store/preference-store';
import type { SanitisedEmote } from '@app/types/emote';

import { getChannelPersonalEmotes } from '../actions/personal-emotes';
import { chatStore$ } from '../observables/chat-store';
import {
  ALL_SLICE_KEYS,
  CHANNEL_SLICE_KEYS,
  type ChatResourceSliceKey,
  type ChatResourceSliceRecord,
  gateEmoteData,
  gateSessionEmoteExtras,
  GLOBAL_SLICE_KEYS,
  mapSlices,
} from '../types/chat-resource-slices';
import type { ChannelCacheType } from '../types/constants';

export const useMessages = () => useSelector(chatStore$.messages);
export const useEmojis = () => useSelector(chatStore$.emojis);

interface ChannelEmoteCache extends ChatResourceSliceRecord<ChatResourceSliceKey> {
  sevenTvPersonalEmotes: Record<string, SanitisedEmote[]>;
  twitchSubscriberChannelProfiles: NonNullable<
    ChannelCacheType['twitchSubscriberChannelProfiles']
  >;
}

const EMPTY_ITEMS: never[] = [];

const EMPTY_SUBSCRIBER_PROFILES: ChannelEmoteCache['twitchSubscriberChannelProfiles'] =
  {};

const EMPTY_PERSONAL_EMOTES: Record<string, SanitisedEmote[]> = {};

const emptyChannelEmoteCache: ChannelEmoteCache = {
  ...mapSlices(ALL_SLICE_KEYS, () => EMPTY_ITEMS),
  sevenTvPersonalEmotes: EMPTY_PERSONAL_EMOTES,
  twitchSubscriberChannelProfiles: EMPTY_SUBSCRIBER_PROFILES,
};

function readSlices(
  channelId: string,
): ChatResourceSliceRecord<ChatResourceSliceKey> {
  const cache$ = chatStore$.persisted.channelCaches[channelId];
  const globalCache$ = chatStore$.persisted.globalCaches;

  return {
    ...mapSlices(CHANNEL_SLICE_KEYS, key => cache$?.[key].get() ?? EMPTY_ITEMS),
    ...mapSlices(
      GLOBAL_SLICE_KEYS,
      key => globalCache$[key].get() ?? EMPTY_ITEMS,
    ),
  };
}

function getChannelEmoteData(channelId: string | null): ChannelEmoteCache {
  if (!channelId) {
    return emptyChannelEmoteCache;
  }

  // Personal emotes live in a plain session Map; `personalEmotesVersion` is
  // the observable edge that re-runs this selector when they change.
  chatStore$.personalEmotesVersion.get();

  return {
    ...readSlices(channelId),
    sevenTvPersonalEmotes: getChannelPersonalEmotes(channelId),
    twitchSubscriberChannelProfiles:
      chatStore$.persisted.channelCaches[
        channelId
      ]?.twitchSubscriberChannelProfiles.get() ?? EMPTY_SUBSCRIBER_PROFILES,
  };
}

export const useCurrentEmoteData = () => {
  const cache = useSelector(() => {
    const channelId = chatStore$.currentChannelId.get();
    return getChannelEmoteData(channelId);
  });

  const preferences = useEmoteRenderPreferences();

  return {
    ...gateEmoteData({
      slices: cache,
      preferences,
      chatterinoBadges: getChatterinoBadges(),
      bttvBadges: getBttvBadges(),
    }),
    ...gateSessionEmoteExtras(cache, emptyChannelEmoteCache, preferences),
  };
};

export const useChannelEmoteDataForReprocess = (channelId: string | null) => {
  // Omits sevenTvPersonalEmotes on purpose: that map churns per chatter and
  // would re-storm the channel reprocess.
  return useSelector(() => (channelId ? readSlices(channelId) : null));
};

export const useGlobalEmoteBadgeCaches = () =>
  useSelector(() =>
    mapSlices(
      GLOBAL_SLICE_KEYS,
      key => chatStore$.persisted.globalCaches[key].get() ?? EMPTY_ITEMS,
    ),
  );

export const usePaints = () => useSelector(chatStore$.paints);

export const useCosmeticBindingsVersion = () =>
  useSelector(chatStore$.cosmeticBindingsVersion);

export const usePersonalEmotesVersion = () =>
  useSelector(chatStore$.personalEmotesVersion);
