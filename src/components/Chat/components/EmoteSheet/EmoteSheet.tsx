import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { Button } from '@app/components/Button/Button';
import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { Input } from '@app/components/ui/Input/Input';
import { Text } from '@app/components/ui/Text/Text';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
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
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHAT_SHEET_BACKGROUND, chatSheetSurface } from '../chatSheetSurface';
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

const MIN_CELL_SIZE = 38;
const MAX_CELL_SIZE = 50;
const CELL_GAP = 4;
const GRID_HORIZONTAL_PADDING = 8;
const RAIL_WIDTH = 52;
const PROVIDER_BAR_HEIGHT = 54;
const SEARCH_BAR_HEIGHT = 48;
const SHEET_DETENT = 0.78;
const MENU_HEADER_BACKGROUND = 'rgba(128, 128, 128, 0.06)';
const MENU_ACTIVE_SURFACE = 'rgba(128, 128, 128, 0.32)';
const MENU_BORDER = 'rgba(255, 255, 255, 0.10)';
const MENU_MUTED_TEXT = 'rgba(255, 255, 255, 0.62)';
const MENU_SURFACE = 'rgba(128, 128, 128, 0.10)';

export type EmotePickerItem = string | SanitisedEmote;

type EmoteSectionIcon = `emoji:${string}`;

interface EmoteSection {
  title: string;
  icon: EmoteSectionIcon;
  data: string[];
}

interface SearchFilterBoxProps {
  onChange?: (value: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  rightOnPress?: () => void;
  value?: string;
}

interface EmoteSheetProps {
  isPresented: boolean;
  onDismiss: () => void;
  onEmoteSelect?: (item: EmotePickerItem) => void;
}

function EmoteSearchFilter({
  onChange,
  onSubmitEditing,
  placeholder,
  rightOnPress,
  value,
}: SearchFilterBoxProps) {
  const hasValue = Boolean(value && value.length > 0);

  return (
    <View style={[styles.searchInputWrap]}>
      <SymbolView
        name="magnifyingglass"
        style={styles.searchIcon}
        tintColor={theme.color.textSecondary.dark}
      />
      <Input
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        color="white"
        onChangeText={onChange}
        onSubmitEditing={onSubmitEditing ? () => onSubmitEditing() : undefined}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.42)"
        radius="none"
        returnKeyType="search"
        size="sm"
        style={styles.searchInput}
        value={value}
        variant="soft"
      />
      <Button
        onPress={() => hasValue && rightOnPress?.()}
        style={[
          styles.searchClearButton,
          !hasValue && styles.searchClearButtonHidden,
        ]}
        disabled={!hasValue}
      >
        <SymbolView name="xmark" tintColor={theme.color.text.dark} />
      </Button>
    </View>
  );
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

  const innerSize = Math.round(cellSize * 0.78);

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
            useNitro
            trackLoadTime
            trackLoadContext="chat.emote-sheet"
            style={[styles.emoteImage, { height: innerSize, width: innerSize }]}
            contentFit="contain"
            cachePolicy="memory-disk"
            cacheVariant="emote"
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
  if (icon === 'twitch') {
    return theme.colorPlum;
  }
  if (icon === 'stv') {
    return '#ffffff';
  }
  if (icon === 'ffz') {
    return theme.colorGreen;
  }
  if (icon === 'bttv') {
    return theme.colorOrange;
  }
  return theme.color.text.dark;
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
        color={isActive ? theme.color.text.dark : getProviderAccentColor(icon)}
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
    return (
      <Button
        style={[styles.providerChip, isActive && styles.providerChipActive]}
        onPress={onPress}
      >
        <View style={styles.providerChipIcon}>
          {renderMenuIcon(provider.icon, isActive, provider.title.slice(0, 2))}
        </View>
        {isActive ? (
          <Text style={styles.providerChipTitle}>{provider.title}</Text>
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
      <Text numberOfLines={1} style={styles.setHeaderTitle}>
        {set.title}
      </Text>
    </View>
  );
});

SetHeader.displayName = 'SetHeader';

const EmoteSheetComponent = ({
  isPresented,
  onDismiss,
  onEmoteSelect,
}: EmoteSheetProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const sheetWidth = Math.max(280, screenWidth - theme.space16 * 2);
  const flashListRef = useRef<FlashListRef<EmoteMenuListItem>>(null);
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

  const gridWidth = sheetWidth - GRID_HORIZONTAL_PADDING * 2 - RAIL_WIDTH;
  const columns = Math.max(
    4,
    Math.min(
      7,
      Math.floor((gridWidth + CELL_GAP) / (MIN_CELL_SIZE + CELL_GAP)),
    ),
  );
  const cellSize = Math.min(
    MAX_CELL_SIZE,
    Math.max(MIN_CELL_SIZE, (gridWidth - CELL_GAP * (columns - 1)) / columns),
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
        twitchSubscriberEmotes,
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
      twitchSubscriberEmotes,
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
    if (!isPresented || preloadVisibleEmotes.length === 0) {
      return undefined;
    }

    const controller = new AbortController();
    void cacheEmoteImages(
      preloadVisibleEmotes,
      controller.signal,
      'interactive',
    );
    return () => controller.abort();
  }, [isPresented, preloadVisibleEmotes]);

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

  const handleProviderPress = useCallback((providerId: EmoteMenuProviderId) => {
    startTransition(() => {
      setActiveProviderId(providerId);
    });
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
    <BottomSheet
      isPresented={isPresented}
      onDismiss={handleDismiss}
      showDragIndicator
      snapPoints={[{ fraction: SHEET_DETENT }, 'full']}
      testID="chat-emote-sheet"
    >
      <View
        style={[
          styles.container,
          { paddingBottom: bottomInset + theme.space20, width: sheetWidth },
        ]}
      >
        <View style={styles.header}>
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={32}
              style={StyleSheet.absoluteFill}
              tint="dark"
            />
          ) : null}
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
              <EmoteSearchFilter
                placeholder="Search emotes"
                onChange={handleSearchChange}
                onSubmitEditing={() => handleSearchChange(searchQuery)}
                rightOnPress={handleClearSearch}
                value={searchQuery}
              />
            </View>
          </View>
        </View>

        {showPlaceholder ? (
          <View style={styles.placeholderContent}>
            <ActivityIndicator size="large" color={theme.color.text.dark} />
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
              {Platform.OS === 'ios' ? (
                <BlurView
                  intensity={28}
                  style={StyleSheet.absoluteFill}
                  tint="dark"
                />
              ) : null}
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
    </BottomSheet>
  );
};

EmoteSheetComponent.displayName = 'EmoteSheet';
export const EmoteSheet = memo(EmoteSheetComponent);
EmoteSheet.displayName = 'EmoteSheet';

const styles = StyleSheet.create({
  body: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  container: {
    ...chatSheetSurface,
    backgroundColor: CHAT_SHEET_BACKGROUND,
    flex: 1,
  },
  contentPane: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  emojiIconText: {
    fontSize: theme.fontSize18,
  },
  emojiText: {
    lineHeight: undefined,
  },
  emoteCell: {
    alignItems: 'center',
    backgroundColor: MENU_HEADER_BACKGROUND,
    borderRadius: 4,
    justifyContent: 'center',
    padding: 3,
  },
  emoteCellInner: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoteImage: {},
  emoteRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
    justifyContent: 'flex-start',
    paddingVertical: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space28,
    paddingTop: theme.space56,
  },
  emptyStateBody: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize14,
    marginTop: theme.space12,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.fontSize18,
    fontWeight: '700',
  },
  fallbackIconLabel: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    fontWeight: '800',
    letterSpacing: 0,
  },
  ffzTextIcon: {
    color: theme.colorGreen,
    letterSpacing: 0,
  },
  ffzTextIconActive: {
    color: theme.color.text.dark,
  },
  header: {
    backgroundColor: MENU_HEADER_BACKGROUND,
    borderBottomColor: MENU_BORDER,
    borderBottomWidth: 1,
    minHeight: PROVIDER_BAR_HEIGHT + SEARCH_BAR_HEIGHT,
    overflow: 'hidden',
    paddingBottom: theme.space8,
    position: 'relative',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space36,
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingTop: theme.space4,
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
    gap: theme.space8,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  providerChip: {
    alignItems: 'center',
    backgroundColor: MENU_HEADER_BACKGROUND,
    borderRadius: 4,
    flexDirection: 'row',
    gap: theme.space8,
    height: 38,
    justifyContent: 'center',
    minWidth: 40,
    paddingHorizontal: theme.space12,
    position: 'relative',
  },
  providerChipActive: {
    backgroundColor: MENU_ACTIVE_SURFACE,
    minWidth: 96,
  },
  providerChipIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerChipTitle: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    fontWeight: '700',
  },
  rail: {
    backgroundColor: MENU_HEADER_BACKGROUND,
    borderLeftColor: MENU_BORDER,
    borderLeftWidth: 1,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
    width: RAIL_WIDTH,
  },
  railContent: {
    alignItems: 'center',
    paddingBottom: theme.space28,
    paddingTop: theme.space8,
    width: '100%',
  },
  searchContainer: {
    height: SEARCH_BAR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: theme.space12,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchInputWrap: {
    alignItems: 'center',
    backgroundColor: MENU_SURFACE,
    borderRadius: 4,
    flex: 1,
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 40,
    paddingHorizontal: theme.space12,
  },
  searchInput: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize16,
    fontWeight: '500',
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
  },
  searchIcon: {
    color: theme.color.textSecondary.dark,
    opacity: 0.7,
  },
  searchClearButton: {
    alignItems: 'center',
    backgroundColor: MENU_ACTIVE_SURFACE,
    borderRadius: 4,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  searchClearButtonHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  setHeader: {
    alignItems: 'center',
    backgroundColor: MENU_HEADER_BACKGROUND,
    borderBottomColor: MENU_BORDER,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space8,
    marginBottom: theme.space4,
    marginTop: theme.space4,
    minHeight: 40,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space4,
  },
  setHeaderIcon: {
    alignItems: 'center',
    borderRadius: 4,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  setHeaderTitle: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize14,
    fontWeight: '600',
    letterSpacing: 0,
  },
  setRailButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    height: 46,
    justifyContent: 'center',
    width: RAIL_WIDTH,
  },
  setRailButtonActive: {
    backgroundColor: MENU_ACTIVE_SURFACE,
  },
  setRailEmoji: {
    fontSize: theme.fontSize16,
  },
  setRailLabel: {
    color: MENU_MUTED_TEXT,
    fontSize: theme.fontSize11,
    fontWeight: '800',
    letterSpacing: 0,
  },
  setRailLabelActive: {
    color: theme.color.text.dark,
  },
});
