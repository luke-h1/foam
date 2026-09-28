import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useWindowDimensions } from 'react-native';

import type {
  LegendListRef,
  LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import { EmoteRow } from '@app/components/chat/components/emote-sheet/emote-row';
import { SetHeader } from '@app/components/chat/components/emote-sheet/set-header';
import {
  buildEmoteMenuProviders,
  type EmoteMenuListItem,
  type EmoteMenuProvider,
  type EmoteMenuProviderId,
  filterProviderSets,
  flattenProviderSets,
} from '@app/components/chat/components/emote-sheet/util/emote-menu-data';
import { emoteSheetAnimationBudget } from '@app/components/chat/components/emote-sheet/util/emote-sheet-animation-budget';
import { emoteSheetScrollActivity } from '@app/components/chat/components/emote-sheet/util/emote-sheet-scroll-activity';
import type { EmotePickerItem } from '@app/components/chat/components/emote-sheet/util/emote-sheet-types';
import { prefetchEmotePickerImages } from '@app/components/chat/components/emote-sheet/util/prefetch-emote-picker-images';
import { useAuthContext } from '@app/context/auth-context';
import { useCurrentEmoteData } from '@app/store/chat/react/selectors';
import type { SanitisedEmote } from '@app/types/emote';

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

interface WarmProviderImagesOptions {
  columns: number;
  providers: EmoteMenuProvider[];
  signal: AbortSignal;
  warmupProviderId: EmoteMenuProviderId | null;
}

/**
 * Decodes the first rows of each provider ahead of the user reaching them. The
 * active provider gets a deeper warm-up, and providers are walked one at a
 * time so a background prefetch never floods the download queue.
 */
async function warmProviderImages({
  columns,
  providers,
  signal,
  warmupProviderId,
}: WarmProviderImagesOptions): Promise<void> {
  for (const provider of providers) {
    if (signal.aborted) {
      return;
    }

    const rows =
      provider.id === warmupProviderId
        ? PROVIDER_WARMUP_ROWS * 3
        : PROVIDER_WARMUP_ROWS;

    // eslint-disable-next-line react-doctor/async-await-in-loop -- serialize providers so background prefetch never floods the download queue
    await prefetchEmotePickerImages(
      takeProviderEmotes(provider, columns * rows),
      signal,
    );
  }
}

/**
 * First `limit` real emotes across a provider's sets.
 */
function takeProviderEmotes(
  provider: EmoteMenuProvider,
  limit: number,
): SanitisedEmote[] {
  const emotes: SanitisedEmote[] = [];

  for (const set of provider.sets) {
    for (const item of set.emotes) {
      if (emotes.length >= limit) {
        break;
      }

      if (item instanceof Object) {
        emotes.push(item);
      }
    }
  }

  return emotes;
}

interface UseEmoteSheetOptions {
  isPresented: boolean;
  onDismiss: () => void;
  onEmoteSelect?: (item: EmotePickerItem) => void;
  emoteListRef: React.RefObject<LegendListRef | null>;
  layoutWidth: number;
}

export function useEmoteSheet({
  isPresented,
  onDismiss,
  onEmoteSelect,
  emoteListRef,
  layoutWidth,
}: UseEmoteSheetOptions) {
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

  const resolveProviderId = (
    providerId: EmoteMenuProviderId | null,
  ): EmoteMenuProviderId | null => {
    if (providers.length === 0) {
      return null;
    }

    return providerId && providers.some(provider => provider.id === providerId)
      ? providerId
      : (providers[0]?.id ?? null);
  };

  /**
   * The chips track the tap; the grid trails behind it, so rebuilding the grid
   * never blocks the frame that highlights the chip.
   */
  const selectedProviderId = resolveProviderId(activeProviderId);

  const renderedProviderId = resolveProviderId(
    useDeferredValue(activeProviderId),
  );

  const activeProvider = providers.find(
    provider => provider.id === renderedProviderId,
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
  }, [deferredSearchQuery, renderedProviderId, emoteListRef]);

  const {
    items: listItems,
    setById,
    setStartIndexById,
  } = useMemo(
    () => flattenProviderSets(filteredSets, columns),
    [filteredSets, columns],
  );

  /**
   * Out of the warmup effect's deps so a tab tap doesn't abort an in-flight
   * warmup and restart the whole cross-provider walk mid-swap.
   */
  const warmupProviderIdRef = useRef(renderedProviderId);

  useLayoutEffect(() => {
    warmupProviderIdRef.current = renderedProviderId;
  });

  useEffect(() => {
    if (!isPresented || providers.length === 0) {
      return undefined;
    }

    const warmupProviderId = warmupProviderIdRef.current;

    const orderedProviders = [
      ...providers.filter(provider => provider.id === warmupProviderId),
      ...providers.filter(provider => provider.id !== warmupProviderId),
    ];

    const controller = new AbortController();

    const warmupTimer = setTimeout(() => {
      void warmProviderImages({
        columns,
        providers: orderedProviders,
        signal: controller.signal,
        warmupProviderId,
      });
    }, EMOTE_WARMUP_DELAY_MS);

    return () => {
      clearTimeout(warmupTimer);
      controller.abort();
    };
  }, [isPresented, providers, columns]);

  const handleDismiss = useCallback(() => {
    setSearchQuery('');
    emoteSheetScrollActivity.reset();
    emoteSheetAnimationBudget.reset();
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
    /**
     * A switch commits a screenful of new emote images at once, so the grid
     * holds still frames until it settles, exactly as it does mid-scroll.
     */
    emoteSheetScrollActivity.poke();
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
      const set = item.type === 'header' ? setById.get(item.setId) : undefined;

      if (set) {
        return <SetHeader set={set} />;
      }

      if (item.type === 'header') {
        return null;
      }

      return (
        <EmoteRow
          cellSize={cellSize}
          items={item.items ?? []}
          onPress={handleEmotePress}
        />
      );
    },
    [setById, cellSize, handleEmotePress],
  );

  const showPlaceholder = !contentReady || providers.length === 0;
  const showEmpty = providers.length > 0 && filteredSets.length === 0;

  return {
    activeProviderId: selectedProviderId,
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
