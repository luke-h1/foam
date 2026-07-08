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
import { useCurrentEmoteData } from '@app/store/chat/react/selectors';
import type { SanitisedEmote } from '@app/types/emote';

import { EmoteRow } from './EmoteRow';
import type { EmotePickerItem } from './emoteSheetTypes';
import { SetHeader } from './SetHeader';
import { emoteSheetScrollActivity } from './util/emoteSheetScrollActivity';
import { prefetchEmotePickerImages } from './util/prefetchEmotePickerImages';

const EMPTY_PROVIDERS: EmoteMenuProvider[] = [];

const EMOTE_WARMUP_DELAY_MS = 250;
const PROVIDER_WARMUP_ROWS = 4;
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
  const { width: screenWidth } = useWindowDimensions();
  const sheetWidth = layoutWidth > 0 ? layoutWidth : screenWidth;
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [activeProviderId, setActiveProviderId] =
    useState<EmoteMenuProviderId | null>(null);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  // Defer the O(all emotes) provider build until after the sheet has presented.
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

  const { items: listItems, setStartIndexById } = useMemo(
    () => flattenProviderSets(filteredSets, columns),
    [filteredSets, columns],
  );

  useEffect(() => {
    if (!isPresented || providers.length === 0) {
      return undefined;
    }

    const orderedProviders = [
      ...providers.filter(
        provider => provider.id === effectiveActiveProviderId,
      ),
      ...providers.filter(
        provider => provider.id !== effectiveActiveProviderId,
      ),
    ];

    const controller = new AbortController();
    const warmupTimer = setTimeout(() => {
      void (async () => {
        for (const provider of orderedProviders) {
          if (controller.signal.aborted) {
            return;
          }

          const isActiveProvider = provider.id === effectiveActiveProviderId;
          const limit =
            columns *
            (isActiveProvider
              ? PROVIDER_WARMUP_ROWS * 3
              : PROVIDER_WARMUP_ROWS);

          const emotes: SanitisedEmote[] = [];
          for (const set of provider.sets) {
            for (const item of set.emotes) {
              if (typeof item === 'object') {
                emotes.push(item);
                if (emotes.length >= limit) {
                  break;
                }
              }
            }
            if (emotes.length >= limit) {
              break;
            }
          }

          // eslint-disable-next-line react-doctor/async-await-in-loop -- serialize providers so background prefetch never floods the download queue
          await prefetchEmotePickerImages(emotes, controller.signal);
        }
      })();
    }, EMOTE_WARMUP_DELAY_MS);

    return () => {
      clearTimeout(warmupTimer);
      controller.abort();
    };
  }, [isPresented, providers, columns, effectiveActiveProviderId]);

  const handleDismiss = useCallback(() => {
    setSearchQuery('');
    emoteSheetScrollActivity.reset();
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
      const index = setStartIndexById.get(setId);
      if (index === undefined) {
        return;
      }

      setActiveSetId(setId);
      emoteListRef.current?.scrollToIndex({
        index,
        animated: true,
      });
    },
    [setStartIndexById, emoteListRef],
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
    showEmpty,
    showPlaceholder,
    viewabilityConfig: EMOTE_SHEET_VIEWABILITY_CONFIG,
  };
}
