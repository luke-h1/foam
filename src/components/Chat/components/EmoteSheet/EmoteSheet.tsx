import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Button } from '@app/components/Button/Button';
import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { SearchBox } from '@app/components/SearchBox/SearchBox';
import { Text } from '@app/components/Text/Text';
import {
  cacheEmoteImages,
  getCachedEmoteUri,
} from '@app/store/chatStore/emoteImages';
import { useCurrentEmoteData } from '@app/store/chatStore/hooks';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { BLURHASH } from '@app/utils/image/image-cache';
import { isBrandIcon } from '@app/utils/typescript/type-guards/isBrandIcon';
import {
  type DidDismissEvent,
  type DidPresentEvent,
  TrueSheet,
  type TrueSheetProps,
} from '@lodev09/react-native-true-sheet';
import {
  forwardRef,
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildEmoteMenuProviders,
  type EmoteMenuIcon,
  type EmoteMenuListItem,
  type EmoteMenuProvider,
  type EmoteMenuProviderId,
  type EmoteMenuSet,
  filterProviderSets,
  flattenProviderSets,
} from './emoteMenuData';

const MIN_CELL_SIZE = 44;
const MAX_CELL_SIZE = 58;
const GRID_HORIZONTAL_PADDING = 12;
const RAIL_WIDTH = 58;
const PROVIDER_BAR_HEIGHT = 60;
const SEARCH_BAR_HEIGHT = 52;
const SHEET_DETENT = 0.74;

export type EmotePickerItem = string | SanitisedEmote;

type EmoteSectionIcon = `emoji:${string}`;

interface EmoteSection {
  title: string;
  icon: EmoteSectionIcon;
  data: string[];
}

interface EmoteSheetProps extends Omit<TrueSheetProps, 'children' | 'sizes'> {
  onEmoteSelect?: (item: EmotePickerItem) => void;
}

const EMOJI_SECTIONS: EmoteSection[] = [
  {
    title: 'Smileys',
    icon: 'emoji:😀',
    data: [
      '😀',
      '😂',
      '😍',
      '🥰',
      '😎',
      '😊',
      '😉',
      '😁',
      '😭',
      '😅',
      '😆',
      '😋',
      '😜',
      '😝',
      '😏',
      '😒',
      '🤔',
      '🤗',
      '🤩',
      '😬',
      '😴',
      '🥳',
      '🥺',
      '😈',
    ],
  },
  {
    title: 'Gestures',
    icon: 'emoji:👍',
    data: [
      '👍',
      '👎',
      '👏',
      '🙌',
      '🤝',
      '🙏',
      '✌️',
      '🤞',
      '👋',
      '✋',
      '🖐️',
      '🖖',
      '👌',
      '🤏',
      '🤙',
      '💪',
    ],
  },
  {
    title: 'Hearts',
    icon: 'emoji:❤️',
    data: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
    ],
  },
];

const EMOJI_MENU_SECTIONS = EMOJI_SECTIONS.map(section => ({
  id: `emoji-${section.title.toLowerCase()}`,
  title: section.title,
  icon: section.icon,
  data: section.data,
}));

interface EmoteCellProps {
  cellSize: number;
  item: EmotePickerItem;
  onPress: (item: EmotePickerItem) => void;
}

const EmoteCell = memo(({ cellSize, item, onPress }: EmoteCellProps) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const imageSource = useMemo(() => {
    if (typeof item === 'string') {
      return null;
    }

    return getCachedEmoteUri(item.url);
  }, [item]);

  const innerSize = Math.round(cellSize * 0.72);

  return (
    <Button
      style={[styles.emoteCell, { height: cellSize, width: cellSize }]}
      onPress={handlePress}
    >
      <View
        style={[styles.emoteCellInner, { height: innerSize, width: innerSize }]}
      >
        {typeof item === 'string' ? (
          <Text style={[styles.emojiText, { fontSize: innerSize * 0.84 }]}>
            {item}
          </Text>
        ) : (
          <Image
            source={imageSource || item.url}
            style={[styles.emoteImage, { height: innerSize, width: innerSize }]}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={0}
            placeholder={BLURHASH}
            recyclingKey={item.id}
          />
        )}
      </View>
    </Button>
  );
});

EmoteCell.displayName = 'EmoteCell';

interface EmoteRowProps {
  cellSize: number;
  items: EmotePickerItem[];
  onPress: (item: EmotePickerItem) => void;
}

const EmoteRow = memo(({ cellSize, items, onPress }: EmoteRowProps) => {
  return (
    <View style={styles.emoteRow}>
      {items.map((item, index) => (
        <EmoteCell
          key={typeof item === 'string' ? `emoji-${index}-${item}` : item.id}
          cellSize={cellSize}
          item={item}
          onPress={onPress}
        />
      ))}
    </View>
  );
});

EmoteRow.displayName = 'EmoteRow';

function getProviderAccentColor(icon: EmoteMenuIcon): string {
  if (icon === 'twitch') return theme.colors.plum.accent;
  if (icon === 'stv') return '#ffffff';
  if (icon === 'ffz') return theme.colors.green.accent;
  if (icon === 'bttv') return theme.colors.orange.accent;
  return theme.colors.gray.text;
}

function getProviderAccentBackground(icon: EmoteMenuIcon): string {
  if (icon === 'twitch') return 'rgba(145, 71, 255, 0.22)';
  if (icon === 'stv') return 'rgba(255, 255, 255, 0.12)';
  if (icon === 'ffz') return 'rgba(49, 196, 141, 0.18)';
  if (icon === 'bttv') return 'rgba(255, 155, 79, 0.18)';
  return 'rgba(255, 214, 10, 0.16)';
}

function renderMenuIcon(
  icon: EmoteMenuIcon,
  isActive: boolean,
  fallbackLabel?: string,
) {
  if (icon.startsWith('emoji:')) {
    return <Text style={styles.emojiIconText}>{icon.slice(6)}</Text>;
  }

  if (icon === 'ffz') {
    return (
      <Text
        style={[
          styles.fallbackIconLabel,
          styles.ffzTextIcon,
          isActive && styles.ffzTextIconActive,
        ]}
      >
        FFZ
      </Text>
    );
  }

  if (isBrandIcon(icon)) {
    return (
      <BrandIcon
        name={icon}
        size="sm"
        color={isActive ? theme.colors.gray.text : getProviderAccentColor(icon)}
      />
    );
  }

  return fallbackLabel ? (
    <Text style={styles.fallbackIconLabel}>{fallbackLabel}</Text>
  ) : null;
}

interface ProviderChipProps {
  isActive: boolean;
  onPress: () => void;
  provider: EmoteMenuProvider;
}

const ProviderChip = memo(
  ({ isActive, onPress, provider }: ProviderChipProps) => {
    const accentColor = getProviderAccentColor(provider.icon);

    return (
      <Button
        style={[
          styles.providerChip,
          isActive && styles.providerChipActive,
          isActive && {
            backgroundColor: getProviderAccentBackground(provider.icon),
            borderColor: accentColor,
          },
        ]}
        onPress={onPress}
      >
        <View style={styles.providerChipIcon}>
          {renderMenuIcon(provider.icon, isActive, provider.title.slice(0, 2))}
        </View>
        {isActive ? (
          <View style={styles.providerChipMeta}>
            <Text style={styles.providerChipTitle}>{provider.title}</Text>
            <Text style={styles.providerChipCount}>{provider.emoteCount}</Text>
          </View>
        ) : null}
        {isActive ? (
          <View
            style={[
              styles.providerChipSelectedDot,
              { backgroundColor: accentColor },
            ]}
          />
        ) : null}
      </Button>
    );
  },
);

ProviderChip.displayName = 'ProviderChip';

interface SetRailButtonProps {
  isActive: boolean;
  onPress: () => void;
  set: EmoteMenuSet;
}

const SetRailButton = memo(({ isActive, onPress, set }: SetRailButtonProps) => {
  return (
    <Button
      style={[styles.setRailButton, isActive && styles.setRailButtonActive]}
      onPress={onPress}
    >
      {set.icon.startsWith('emoji:') ? (
        <Text style={styles.setRailEmoji}>{set.icon.slice(6)}</Text>
      ) : (
        <Text
          style={[styles.setRailLabel, isActive && styles.setRailLabelActive]}
        >
          {set.shortLabel}
        </Text>
      )}
    </Button>
  );
});

SetRailButton.displayName = 'SetRailButton';

interface SetHeaderProps {
  set: EmoteMenuSet;
}

const SetHeader = memo(({ set }: SetHeaderProps) => {
  return (
    <View style={styles.setHeader}>
      <View style={styles.setHeaderIcon}>
        {renderMenuIcon(set.icon, true, set.shortLabel)}
      </View>
      <View style={styles.setHeaderMeta}>
        <Text style={styles.setHeaderTitle}>{set.title}</Text>
        <Text style={styles.setHeaderCount}>{set.emotes.length} emotes</Text>
      </View>
    </View>
  );
});

SetHeader.displayName = 'SetHeader';

export const EmoteSheet = forwardRef<TrueSheet, EmoteSheetProps>(
  ({ onEmoteSelect, onDidDismiss, onDidPresent, ...sheetProps }, ref) => {
    const { bottom: bottomInset } = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const flashListRef = useRef<FlashListRef<EmoteMenuListItem>>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const [activeProviderId, setActiveProviderId] =
      useState<EmoteMenuProviderId | null>(null);
    const [activeSetId, setActiveSetId] = useState<string | null>(null);
    const [isSheetPresented, setIsSheetPresented] = useState(false);

    const {
      bttvChannelEmotes,
      bttvGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
    } = useCurrentEmoteData();

    const columns = Math.max(
      4,
      Math.min(
        7,
        Math.floor(
          (screenWidth - GRID_HORIZONTAL_PADDING * 2 - RAIL_WIDTH) /
            MIN_CELL_SIZE,
        ),
      ),
    );
    const cellSize = Math.min(
      MAX_CELL_SIZE,
      Math.max(
        MIN_CELL_SIZE,
        (screenWidth - GRID_HORIZONTAL_PADDING * 2 - RAIL_WIDTH) / columns,
      ),
    );
    const bodyHeight = Math.max(
      360,
      screenHeight * SHEET_DETENT -
        PROVIDER_BAR_HEIGHT -
        SEARCH_BAR_HEIGHT -
        56 -
        bottomInset,
    );

    const providers = useMemo(
      () =>
        buildEmoteMenuProviders({
          bttvChannelEmotes,
          bttvGlobalEmotes,
          ffzChannelEmotes,
          ffzGlobalEmotes,
          sevenTvChannelEmotes,
          sevenTvGlobalEmotes,
          twitchChannelEmotes,
          twitchGlobalEmotes,
          emojiSets: EMOJI_MENU_SECTIONS,
        }),
      [
        bttvChannelEmotes,
        bttvGlobalEmotes,
        ffzChannelEmotes,
        ffzGlobalEmotes,
        sevenTvChannelEmotes,
        sevenTvGlobalEmotes,
        twitchChannelEmotes,
        twitchGlobalEmotes,
      ],
    );

    useEffect(() => {
      if (providers.length === 0) {
        setActiveProviderId(null);
        return;
      }

      const firstProvider = providers[0];

      if (
        firstProvider &&
        (!activeProviderId ||
          !providers.some(provider => provider.id === activeProviderId))
      ) {
        setActiveProviderId(firstProvider.id);
      }
    }, [activeProviderId, providers]);

    const activeProvider = useMemo(
      () => providers.find(provider => provider.id === activeProviderId),
      [activeProviderId, providers],
    );
    const activeProviderAccentColor = activeProvider
      ? getProviderAccentColor(activeProvider.icon)
      : theme.colors.gray.text;
    const activeProviderAccentBackground = activeProvider
      ? getProviderAccentBackground(activeProvider.icon)
      : theme.colors.gray.uiAlpha;

    const filteredSets = useMemo(
      () => filterProviderSets(activeProvider, deferredSearchQuery),
      [activeProvider, deferredSearchQuery],
    );

    useEffect(() => {
      const nextSetId = filteredSets[0]?.id ?? null;
      setActiveSetId(currentSetId =>
        currentSetId && filteredSets.some(set => set.id === currentSetId)
          ? currentSetId
          : nextSetId,
      );
    }, [filteredSets]);

    useEffect(() => {
      flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [activeProviderId, deferredSearchQuery]);

    const { items: listItems, setStartIndices } = useMemo(
      () => flattenProviderSets(filteredSets, columns),
      [columns, filteredSets],
    );

    const setIndexMap = useMemo(() => {
      const indexMap = new Map<string, number>();
      filteredSets.forEach((set, index) => {
        const startIndex = setStartIndices[index];
        if (typeof startIndex === 'number') {
          indexMap.set(set.id, startIndex);
        }
      });
      return indexMap;
    }, [filteredSets, setStartIndices]);

    const setMap = useMemo(
      () => new Map(filteredSets.map(set => [set.id, set])),
      [filteredSets],
    );

    const preloadVisibleEmotes = useMemo(() => {
      const visibleSet =
        (activeSetId ? setMap.get(activeSetId) : undefined) ?? filteredSets[0];

      return (
        visibleSet?.emotes
          .filter((item): item is SanitisedEmote => typeof item === 'object')
          .slice(0, columns) ?? []
      );
    }, [activeSetId, columns, filteredSets, setMap]);

    useEffect(() => {
      if (!isSheetPresented || preloadVisibleEmotes.length === 0) {
        return undefined;
      }

      const controller = new AbortController();
      void cacheEmoteImages(preloadVisibleEmotes, controller.signal);
      return () => controller.abort();
    }, [isSheetPresented, preloadVisibleEmotes]);

    const handleDidPresent = useCallback(
      (event: DidPresentEvent) => {
        setIsSheetPresented(true);
        onDidPresent?.(event);
      },
      [onDidPresent],
    );

    const handleDidDismiss = useCallback(
      (event: DidDismissEvent) => {
        setIsSheetPresented(false);
        setSearchQuery('');
        onDidDismiss?.(event);
      },
      [onDidDismiss],
    );

    const handleEmotePress = useCallback(
      (item: EmotePickerItem) => {
        onEmoteSelect?.(item);
      },
      [onEmoteSelect],
    );

    const handleScrollToSet = useCallback(
      (setId: string) => {
        const index = setIndexMap.get(setId);
        if (typeof index !== 'number') {
          return;
        }

        setActiveSetId(setId);
        void flashListRef.current?.scrollToIndex({
          index,
          animated: true,
        });
      },
      [setIndexMap],
    );

    const handleProviderPress = useCallback(
      (providerId: EmoteMenuProviderId) => {
        startTransition(() => {
          setActiveProviderId(providerId);
        });
      },
      [],
    );

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
        viewableItems: Array<{ index: number | null; item: EmoteMenuListItem }>;
      }) => {
        const firstVisible = info.viewableItems
          .filter(item => item.index != null)
          .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))[0];

        if (!firstVisible?.item?.setId) {
          return;
        }

        setActiveSetId(firstVisible.item.setId);
      },
      [],
    );

    const viewabilityConfig = useMemo(
      () => ({
        itemVisiblePercentThreshold: 10,
        minimumViewTime: 50,
      }),
      [],
    );

    const renderItem = useCallback(
      ({ item }: { item: EmoteMenuListItem }) => {
        if (item.type === 'header') {
          const set = setMap.get(item.setId);
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
      [cellSize, handleEmotePress, setMap],
    );

    const showPlaceholder = providers.length === 0;
    const showEmpty = providers.length > 0 && filteredSets.length === 0;

    return (
      <TrueSheet
        ref={ref}
        detents={[SHEET_DETENT]}
        cornerRadius={24}
        grabber={false}
        blurTint="dark"
        backgroundColor={theme.colors.gray.bg}
        {...sheetProps}
        onDidDismiss={handleDidDismiss}
        onDidPresent={handleDidPresent}
      >
        <View
          style={[
            styles.container,
            { paddingBottom: bottomInset + theme.spacing.lg },
          ]}
        >
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          <View style={styles.header}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.providerBarContent}
              style={styles.providerBar}
              nestedScrollEnabled
            >
              {providers.map(provider => (
                <ProviderChip
                  key={provider.id}
                  isActive={provider.id === activeProviderId}
                  onPress={() => handleProviderPress(provider.id)}
                  provider={provider}
                />
              ))}
            </ScrollView>

            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                {activeProvider ? (
                  <View
                    style={[
                      styles.activeProviderBadge,
                      {
                        backgroundColor: activeProviderAccentBackground,
                        borderColor: activeProviderAccentColor,
                      },
                    ]}
                  >
                    {renderMenuIcon(
                      activeProvider.icon,
                      true,
                      activeProvider.title.slice(0, 2),
                    )}
                    <Text style={styles.activeProviderBadgeText}>
                      {activeProvider.title}
                    </Text>
                  </View>
                ) : null}

                <SearchBox
                  placeholder="filter"
                  onChange={handleSearchChange}
                  rightOnPress={handleClearSearch}
                  style={styles.searchBox}
                  value={searchQuery}
                />
              </View>
            </View>
          </View>

          {showPlaceholder ? (
            <View style={styles.placeholderContent}>
              <ActivityIndicator size="large" color={theme.colors.gray.text} />
            </View>
          ) : (
            <View style={[styles.body, { height: bodyHeight }]}>
              <View style={[styles.contentPane, { height: bodyHeight }]}>
                {showEmpty ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>No emotes found</Text>
                    <Text style={styles.emptyStateBody}>
                      Try a shorter filter or switch providers.
                    </Text>
                  </View>
                ) : (
                  <FlashList<EmoteMenuListItem>
                    ref={flashListRef}
                    data={listItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.key}
                    getItemType={item => item.type}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    contentContainerStyle={styles.listContent}
                    drawDistance={96}
                    removeClippedSubviews
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    style={styles.list}
                  />
                )}
              </View>

              <View style={[styles.rail, { height: bodyHeight }]}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.railContent}
                  nestedScrollEnabled
                >
                  {filteredSets.map(set => (
                    <SetRailButton
                      key={set.id}
                      isActive={set.id === activeSetId}
                      onPress={() => handleScrollToSet(set.id)}
                      set={set}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </TrueSheet>
    );
  },
);

EmoteSheet.displayName = 'EmoteSheet';

const styles = StyleSheet.create({
  activeProviderBadge: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    height: 36,
    paddingHorizontal: theme.spacing.md,
  },
  activeProviderBadgeText: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.xs,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  container: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
  contentPane: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  emojiIconText: {
    fontSize: theme.font.fontSize.lg,
  },
  emojiText: {
    lineHeight: undefined,
  },
  emoteCell: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    justifyContent: 'center',
  },
  emoteCellInner: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoteImage: {},
  emoteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing['4xl'],
  },
  emptyStateBody: {
    color: theme.colors.gray.textLow,
    fontSize: theme.font.fontSize.sm,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.font.fontSize.lg,
    fontWeight: '700',
  },
  fallbackIconLabel: {
    color: theme.colors.gray.textLow,
    fontSize: theme.font.fontSize.xxs,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ffzTextIcon: {
    color: theme.colors.green.accent,
    letterSpacing: 0.6,
  },
  ffzTextIconActive: {
    color: theme.colors.gray.text,
  },
  grabber: {
    backgroundColor: theme.colors.gray.accent,
    borderRadius: 2,
    height: 4,
    width: 36,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingBottom: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  header: {
    borderBottomColor: theme.colors.gray.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: PROVIDER_BAR_HEIGHT + SEARCH_BAR_HEIGHT,
    paddingBottom: theme.spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing['3xl'],
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingTop: theme.spacing.sm,
  },
  placeholderContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 420,
  },
  providerBar: {
    maxHeight: PROVIDER_BAR_HEIGHT,
  },
  providerBarContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  providerChip: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    height: 42,
    justifyContent: 'center',
    minWidth: 42,
    paddingHorizontal: theme.spacing.md,
    position: 'relative',
  },
  providerChipActive: {
    minWidth: 112,
    paddingRight: theme.spacing.lg,
  },
  providerChipCount: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.xxs,
    fontWeight: '700',
  },
  providerChipIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerChipMeta: {
    alignItems: 'flex-start',
    gap: 0,
  },
  providerChipSelectedDot: {
    borderRadius: 3,
    height: 6,
    position: 'absolute',
    right: theme.spacing.sm,
    top: '50%',
    transform: [{ translateY: -3 }],
    width: 6,
  },
  providerChipTitle: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.xs,
    fontWeight: '700',
  },
  rail: {
    borderLeftColor: theme.colors.gray.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    minHeight: 0,
    width: RAIL_WIDTH,
  },
  railContent: {
    alignItems: 'center',
    paddingBottom: theme.spacing['2xl'],
    paddingTop: theme.spacing.md,
  },
  searchBox: {
    flex: 1,
  },
  searchContainer: {
    height: SEARCH_BAR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  setHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  setHeaderCount: {
    color: theme.colors.gray.textLow,
    fontSize: theme.font.fontSize.xxs,
    fontWeight: '700',
  },
  setHeaderIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  setHeaderMeta: {
    flex: 1,
    gap: 1,
  },
  setHeaderTitle: {
    fontSize: theme.font.fontSize.sm,
    fontWeight: '700',
  },
  setRailButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    height: 38,
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    width: 38,
  },
  setRailButtonActive: {
    backgroundColor: 'rgba(145, 71, 255, 0.22)',
  },
  setRailEmoji: {
    fontSize: theme.font.fontSize.md,
  },
  setRailLabel: {
    color: theme.colors.gray.textLow,
    fontSize: theme.font.fontSize.xxs,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  setRailLabelActive: {
    color: theme.colors.gray.text,
  },
});
