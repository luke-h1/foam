import { cacheEmoteImages } from '@app/store/chat/actions/emoteImages';
import { useCurrentEmoteData } from '@app/store/chat/react/selectors';
import type { SanitisedEmote } from '@app/types/emote';
import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from 'react';
import { useWindowDimensions } from 'react-native';
import type { LegendListRef, LegendListRenderItemProps } from '@legendapp/list';

import { EmoteRow } from './EmoteRow';
import { SetHeader } from './SetHeader';
import {
  buildEmoteMenuProviders,
  type EmoteMenuListItem,
  type EmoteMenuProviderId,
  filterProviderSets,
  flattenProviderSets,
} from './emoteMenuData';
import type { EmotePickerItem } from './emoteSheetTypes';
import { EMOTE_SHEET_DETENT } from './emoteSheetLayout';

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

  const {
    bttvChannelEmotes,
    bttvGlobalEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    sevenTvChannelEmotes,
    sevenTvGlobalEmotes,
    twitchChannelEmotes,
    twitchGlobalEmotes,
    twitchSubscriberEmotes,
  } = useCurrentEmoteData();

  const gridWidth = sheetWidth - 16 * 2;
  const columns = Math.max(
    4,
    Math.min(8, Math.floor((gridWidth + 4) / (38 + 4))),
  );
  const cellSize = Math.min(
    50,
    Math.max(38, (gridWidth - 4 * (columns - 1)) / columns),
  );

  const providers = buildEmoteMenuProviders({
    bttvChannelEmotes,
    bttvGlobalEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    sevenTvChannelEmotes,
    sevenTvGlobalEmotes,
    twitchChannelEmotes,
    twitchGlobalEmotes,
    twitchSubscriberEmotes,
    emojiSets: EMOJI_MENU_SECTIONS,
  });

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

  const filteredSets = filterProviderSets(activeProvider, deferredSearchQuery);

  const defaultSetId = filteredSets[0]?.id ?? null;
  const effectiveActiveSetId =
    activeSetId && filteredSets.some(set => set.id === activeSetId)
      ? activeSetId
      : defaultSetId;

  useEffect(() => {
    emoteListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [deferredSearchQuery, effectiveActiveProviderId, emoteListRef]);

  const { items: listItems, setStartIndices } = flattenProviderSets(
    filteredSets,
    columns,
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

  const handleDismiss = () => {
    setSearchQuery('');
    onDismiss();
  };

  const handleEmotePress = (item: EmotePickerItem) => {
    onEmoteSelect?.(item);
  };

  const handleScrollToSet = (setId: string) => {
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
  };

  const handleProviderPress = (providerId: EmoteMenuProviderId) => {
    setActiveProviderId(providerId);
  };

  const handleSearchChange = (value?: string) => {
    startTransition(() => {
      setSearchQuery(value ?? '');
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const onViewableItemsChanged = (info: {
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
  };

  const viewabilityConfig = EMOTE_SHEET_VIEWABILITY_CONFIG;

  const renderItem = ({
    item,
  }: LegendListRenderItemProps<EmoteMenuListItem>) => {
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
  };

  const showPlaceholder = providers.length === 0;
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
