import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useWindowDimensions } from 'react-native';

import type {
  LegendListRef,
  LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import {
  buildEmoteMenuProviders,
  type EmoteMenuListItem,
  type EmoteMenuProvider,
  type EmoteMenuProviderId,
  filterProviderSets,
  flattenProviderSets,
} from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { useAuthContext } from '@app/context/AuthContext';
import { cacheEmoteImages } from '@app/store/chat/actions/emoteImages';
import { useCurrentEmoteData } from '@app/store/chat/react/selectors';
import type { SanitisedEmote } from '@app/types/emote';

import { EmoteRow } from './EmoteRow';
import { EMOTE_SHEET_DETENT } from './emoteSheetLayout';
import type { EmotePickerItem } from './emoteSheetTypes';
import { SetHeader } from './SetHeader';

const EMPTY_PROVIDERS: EmoteMenuProvider[] = [];

const EMOTE_WARMUP_DELAY_MS = 250;
const MAX_WARMUP_EMOTES = 3;
const EMOTE_SHEET_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 10,
  minimumViewTime: 50,
} as const;

const emojiSection = (
  title: string,
  icon: `emoji:${string}`,
  data: string,
) => ({
  id: `emoji-${title.toLowerCase()}`,
  title,
  icon,
  data: data.split(' '),
});

const EMOJI_MENU_SECTIONS = [
  emojiSection(
    'Smileys',
    'emoji:😀',
    '😀 😂 😍 🥰 😎 😊 😉 😁 😭 😅 😆 😋 😜 😝 😏 😒 🤔 🤗 🤩 😬 😴 🥳 🥺 😈',
  ),
  emojiSection(
    'Gestures',
    'emoji:👍',
    '👍 👎 👏 🙌 🤝 🙏 ✌️ 🤞 👋 ✋ 🖐️ 🖖 👌 🤏 🤙 💪',
  ),
  emojiSection(
    'Hearts',
    'emoji:❤️',
    '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ❣️ 💕 💞 💓 💗 💖 💘',
  ),
];

export function useEmoteSheet({
  isPresented,
  onDismiss,
  onEmoteSelect,
  emoteListRef,
  layoutWidth,
}: {
  isPresented: boolean;
  onDismiss: () => void;
  onEmoteSelect?: (item: EmotePickerItem) => void;
  emoteListRef: React.RefObject<LegendListRef | null>;
  layoutWidth: number;
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const sheetWidth = layoutWidth > 0 ? layoutWidth : screenWidth;
  const sheetHeight = Math.round(screenHeight * EMOTE_SHEET_DETENT);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [activeProviderId, setActiveProviderId] =
    useState<EmoteMenuProviderId | null>(null);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  // The provider/emote build below is O(all emotes) — grouping, sorting and
  // flattening thousands of 7TV emotes. Running it in the mount render blocks the
  // sheet's present, so we hold it off for one frame: the sheet animates in with
  // a spinner, then the lists build once the open is underway.
  const [contentReady, setContentReady] = useState(false);

  const { user } = useAuthContext();
  const {
    bttvChannelEmotes,
    bttvGlobalEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    sevenTvChannelEmotes,
    sevenTvGlobalEmotes,
    sevenTvPersonalEmotes,
    twitchChannelEmotes,
    twitchGlobalEmotes,
    twitchSubscriberEmotes,
    twitchSubscriberChannelProfiles,
  } = useCurrentEmoteData();
  const currentUserPersonalEmotes = user?.id
    ? sevenTvPersonalEmotes[user.id]
    : undefined;

  const gridWidth = sheetWidth - 16 * 2;
  const columns = Math.max(
    4,
    Math.min(8, Math.floor((gridWidth + 4) / (38 + 4))),
  );
  const cellSize = Math.min(
    50,
    Math.max(38, (gridWidth - 4 * (columns - 1)) / columns),
  );

  useEffect(() => {
    if (!isPresented) {
      return undefined;
    }
    const frame = requestAnimationFrame(() => {
      startTransition(() => setContentReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [isPresented]);

  const providers = useMemo(
    () =>
      contentReady
        ? buildEmoteMenuProviders({
            bttvChannelEmotes,
            bttvGlobalEmotes,
            ffzChannelEmotes,
            ffzGlobalEmotes,
            sevenTvChannelEmotes,
            sevenTvGlobalEmotes,
            sevenTvPersonalEmotes: currentUserPersonalEmotes,
            twitchChannelEmotes,
            twitchGlobalEmotes,
            twitchSubscriberEmotes,
            twitchSubscriberChannelProfiles,
            emojiSets: EMOJI_MENU_SECTIONS,
          })
        : EMPTY_PROVIDERS,
    [
      contentReady,
      bttvChannelEmotes,
      bttvGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      currentUserPersonalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      twitchSubscriberEmotes,
      twitchSubscriberChannelProfiles,
    ],
  );

  const effectiveActiveProviderId =
    providers.length === 0
      ? null
      : activeProviderId &&
          providers.some(provider => provider.id === activeProviderId)
        ? activeProviderId
        : (providers[0]?.id ?? null);

  const activeProvider = providers.find(
    provider => provider.id === effectiveActiveProviderId,
  );

  const filteredSets = useMemo(
    () => filterProviderSets(activeProvider, deferredSearchQuery),
    [activeProvider, deferredSearchQuery],
  );

  const defaultSetId = filteredSets[0]?.id ?? null;
  const effectiveActiveSetId =
    activeSetId && filteredSets.some(set => set.id === activeSetId)
      ? activeSetId
      : defaultSetId;

  useEffect(() => {
    emoteListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [deferredSearchQuery, effectiveActiveProviderId, emoteListRef]);

  const { items: listItems, setStartIndices } = useMemo(
    () => flattenProviderSets(filteredSets, columns),
    [filteredSets, columns],
  );

  useEffect(() => {
    if (!isPresented) {
      return undefined;
    }

    const visibleSet =
      filteredSets.find(set => set.id === effectiveActiveSetId) ??
      filteredSets[0];
    const preloadVisibleEmotes =
      visibleSet?.emotes
        .filter((item): item is SanitisedEmote => typeof item === 'object')
        .slice(0, Math.min(columns, MAX_WARMUP_EMOTES)) ?? [];

    if (preloadVisibleEmotes.length === 0) {
      return undefined;
    }

    const controller = new AbortController();
    const warmupTimer = setTimeout(() => {
      void cacheEmoteImages(
        preloadVisibleEmotes,
        controller.signal,
        'background',
      );
    }, EMOTE_WARMUP_DELAY_MS);

    return () => {
      clearTimeout(warmupTimer);
      controller.abort();
    };
  }, [effectiveActiveSetId, columns, filteredSets, isPresented]);

  const handleDismiss = useCallback(() => {
    setSearchQuery('');
    onDismiss();
  }, [onDismiss]);

  const handleEmotePress = useCallback(
    (item: EmotePickerItem) => {
      onEmoteSelect?.(item);
    },
    [onEmoteSelect],
  );

  const handleScrollToSet = useCallback(
    (setId: string) => {
      const index =
        setStartIndices[filteredSets.findIndex(set => set.id === setId)];
      if (typeof index !== 'number') {
        return;
      }

      setActiveSetId(setId);
      emoteListRef.current?.scrollToIndex({
        index,
        animated: true,
      });
    },
    [setStartIndices, filteredSets, emoteListRef],
  );

  const handleProviderPress = useCallback((providerId: EmoteMenuProviderId) => {
    setActiveProviderId(providerId);
  }, []);

  const handleSearchChange = useCallback((value?: string) => {
    startTransition(() => {
      setSearchQuery(value ?? '');
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const onViewableItemsChanged = useCallback(
    (info: {
      viewableItems: { index: number | null; item: EmoteMenuListItem }[];
    }) => {
      let firstVisible: (typeof info.viewableItems)[number] | undefined;
      let minIndex = Number.POSITIVE_INFINITY;

      for (const item of info.viewableItems) {
        if (item.index == null) {
          continue;
        }

        if (item.index < minIndex) {
          minIndex = item.index;
          firstVisible = item;
        }
      }

      if (!firstVisible?.item?.setId) {
        return;
      }

      setActiveSetId(firstVisible.item.setId);
    },
    [],
  );

  const viewabilityConfig = EMOTE_SHEET_VIEWABILITY_CONFIG;

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<EmoteMenuListItem>) => {
      if (item.type === 'header') {
        const set = filteredSets.find(set => set.id === item.setId);
        if (!set) {
          return null;
        }

        return <SetHeader set={set} />;
      }

      return (
        <EmoteRow
          cellSize={cellSize}
          items={item.items ?? []}
          onPress={handleEmotePress}
        />
      );
    },
    [filteredSets, cellSize, handleEmotePress],
  );

  const showPlaceholder = !contentReady || providers.length === 0;
  const showEmpty = providers.length > 0 && filteredSets.length === 0;

  return {
    activeProviderId: effectiveActiveProviderId,
    activeSetId: effectiveActiveSetId,
    cellSize,
    filteredSets,
    handleClearSearch,
    handleDismiss,
    handleProviderPress,
    handleScrollToSet,
    handleSearchChange,
    listItems,
    onViewableItemsChanged,
    providers,
    renderItem,
    searchQuery,
    sheetHeight,
    sheetWidth,
    showEmpty,
    showPlaceholder,
    viewabilityConfig,
  };
}
