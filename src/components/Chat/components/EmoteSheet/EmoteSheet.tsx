import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Input } from '@app/components/ui/Input/Input';
import { Text } from '@app/components/ui/Text/Text';
import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { cacheEmoteImages } from '@app/store/chatStore/emoteImages';
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
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
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
const EMOTE_WARMUP_DELAY_MS = 250;
const MAX_WARMUP_EMOTES = 3;
const SHIMMER_DURATION_MS = 1200;
const MENU_HEADER_BACKGROUND = '#111215';
const MENU_ACTIVE_SURFACE = '#2b2d33';
const MENU_BORDER = 'rgba(255, 255, 255, 0.075)';
const MENU_MUTED_TEXT = 'rgba(255, 255, 255, 0.62)';
const MENU_SURFACE = '#1f2025';

export type EmotePickerItem = string | SanitisedEmote;

type EmoteSectionIcon = `emoji:${string}`;

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

function EmoteSearchFilterComponent({
  onChange,
  onSubmitEditing,
  placeholder,
  rightOnPress,
  value,
}: SearchFilterBoxProps) {
  const hasValue = Boolean(value && value.length > 0);

  return (
    <View style={styles.searchInputWrap}>
      <SymbolView
        name='magnifyingglass'
        style={styles.searchIcon}
        tintColor={theme.color.textSecondary.dark}
      />
      <Input
        autoCapitalize='none'
        autoComplete='off'
        autoCorrect={false}
        color='white'
        onChangeText={onChange}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor='rgba(255,255,255,0.42)'
        radius='none'
        returnKeyType='search'
        size='sm'
        style={styles.searchInput}
        value={value}
        variant='soft'
      />
      <Button
        onPress={rightOnPress}
        style={[
          styles.searchClearButton,
          !hasValue && styles.searchClearButtonHidden,
        ]}
        disabled={!hasValue}
      >
        <SymbolView name='xmark' tintColor={theme.color.text.dark} />
      </Button>
    </View>
  );
}

const EmoteSearchFilter = memo(EmoteSearchFilterComponent);
EmoteSearchFilter.displayName = 'EmoteSearchFilter';

const emojiSection = (title: string, icon: EmoteSectionIcon, data: string) => ({
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

function IosBlurComponent({ intensity }: { intensity: number }) {
  return Platform.OS === 'ios' ? (
    <BlurView
      intensity={intensity}
      style={StyleSheet.absoluteFill}
      tint='dark'
    />
  ) : null;
}

const IosBlur = memo(IosBlurComponent);
IosBlur.displayName = 'IosBlur';

interface EmoteImageShimmerProps {
  size: number;
}

function EmoteImageShimmerComponent({ size }: EmoteImageShimmerProps) {
  const progress = useSharedValue(0);
  const shimmerWidth = Math.max(18, Math.round(size * 0.72));

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -shimmerWidth + progress.value * (size + shimmerWidth * 2),
      },
    ],
  }));

  return (
    <View
      pointerEvents='none'
      style={[styles.emoteImagePlaceholder, { height: size, width: size }]}
    >
      <Animated.View
        style={[
          styles.emoteImageShimmer,
          { height: size, width: shimmerWidth },
          shimmerStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.11)',
            'rgba(255,255,255,0)',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const EmoteImageShimmer = memo(EmoteImageShimmerComponent);
EmoteImageShimmer.displayName = 'EmoteImageShimmer';

interface EmoteCellProps {
  cellSize: number;
  item: EmotePickerItem;
  onPress: (item: EmotePickerItem) => void;
}

function EmoteCellComponent({ cellSize, item, onPress }: EmoteCellProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const innerSize = Math.round(cellSize * 0.78);
  const imageUrl = typeof item === 'string' ? null : item.url;

  useEffect(() => {
    setIsImageLoaded(false);
  }, [imageUrl]);

  const handleImageSettled = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

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
          <>
            {!isImageLoaded ? <EmoteImageShimmer size={innerSize} /> : null}
            <Image
              source={item.url}
              style={[
                styles.emoteImage,
                !isImageLoaded && styles.emoteImageLoading,
                { height: innerSize, width: innerSize },
              ]}
              containerStyle={styles.emoteImageContainer}
              contentFit='contain'
              cacheToFile={false}
              cachePolicy='memory-disk'
              cacheVariant='emote'
              transition={0}
              placeholder={BLURHASH}
              recyclingKey={item.id}
              onError={handleImageSettled}
              onLoadEnd={handleImageSettled}
            />
          </>
        )}
      </View>
    </Button>
  );
}

const EmoteCell = memo(EmoteCellComponent);
EmoteCell.displayName = 'EmoteCell';

interface EmoteRowProps {
  cellSize: number;
  items: EmotePickerItem[];
  onPress: (item: EmotePickerItem) => void;
}

function EmoteRowComponent({ cellSize, items, onPress }: EmoteRowProps) {
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
}

const EmoteRow = memo(EmoteRowComponent);
EmoteRow.displayName = 'EmoteRow';

const PROVIDER_ACCENT_COLORS: Partial<Record<EmoteMenuIcon, string>> = {
  twitch: theme.colorPlum,
  stv: '#ffffff',
  ffz: theme.colorGreen,
  bttv: theme.colorOrange,
};

const getProviderAccentColor = (icon: EmoteMenuIcon) =>
  PROVIDER_ACCENT_COLORS[icon] ?? theme.color.text.dark;

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
        size='sm'
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

function ProviderChipComponent({
  isActive,
  onPress,
  provider,
}: ProviderChipProps) {
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
}

const ProviderChip = memo(ProviderChipComponent);
ProviderChip.displayName = 'ProviderChip';

interface SetRailButtonProps {
  isActive: boolean;
  onPress: () => void;
  set: EmoteMenuSet;
}

function SetRailButtonComponent({
  isActive,
  onPress,
  set,
}: SetRailButtonProps) {
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
}

const SetRailButton = memo(SetRailButtonComponent);
SetRailButton.displayName = 'SetRailButton';

interface SetHeaderProps {
  set: EmoteMenuSet;
}

function SetHeaderComponent({ set }: SetHeaderProps) {
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
}

const SetHeader = memo(SetHeaderComponent);
SetHeader.displayName = 'SetHeader';

const EmoteSheetComponent = ({
  isPresented,
  onDismiss,
  onEmoteSelect,
}: EmoteSheetProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const sheetWidth = Math.max(280, screenWidth - theme.space16 * 2);
  const sheetHeight = Math.round(screenHeight * SHEET_DETENT);
  const emoteListRef = useRef<LegendListRef>(null);
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
    sheetHeight - PROVIDER_BAR_HEIGHT - SEARCH_BAR_HEIGHT - 56 - bottomInset,
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
    emoteListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeProviderId, deferredSearchQuery]);

  const { items: listItems, setStartIndices } = useMemo(
    () => flattenProviderSets(filteredSets, columns),
    [columns, filteredSets],
  );

  const preloadVisibleEmotes = useMemo(() => {
    const visibleSet =
      filteredSets.find(set => set.id === activeSetId) ?? filteredSets[0];

    return (
      visibleSet?.emotes
        .filter((item): item is SanitisedEmote => typeof item === 'object')
        .slice(0, Math.min(columns, MAX_WARMUP_EMOTES)) ?? []
    );
  }, [activeSetId, columns, filteredSets]);

  useEffect(() => {
    if (!isPresented || preloadVisibleEmotes.length === 0) {
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
    [filteredSets, setStartIndices],
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
    [cellSize, filteredSets, handleEmotePress],
  );

  const showPlaceholder = providers.length === 0;
  const showEmpty = providers.length > 0 && filteredSets.length === 0;

  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={handleDismiss}
      showDragIndicator
      testID='chat-emote-sheet'
    >
      <View
        style={[
          styles.container,
          {
            flex: 0,
            height: sheetHeight,
            paddingBottom: bottomInset + theme.space20,
            width: sheetWidth,
          },
        ]}
      >
        <View style={styles.header}>
          <IosBlur intensity={32} />
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
                placeholder='Search emotes'
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
            <ActivityIndicator size='large' color={theme.color.text.dark} />
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
                <LegendList<EmoteMenuListItem>
                  ref={emoteListRef}
                  data={listItems}
                  renderItem={renderItem}
                  keyExtractor={item => item.key}
                  getItemType={item => item.type}
                  estimatedItemSize={cellSize + CELL_GAP}
                  getEstimatedItemSize={(_index, _item, type) =>
                    type === 'header' ? 44 : cellSize + CELL_GAP
                  }
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  contentContainerStyle={styles.listContent}
                  drawDistance={96}
                  recycleItems
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  style={styles.list}
                />
              )}
            </View>

            <View style={[styles.rail, { height: bodyHeight }]}>
              <IosBlur intensity={28} />
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
    backgroundColor: '#15161a',
    borderColor: 'rgba(255,255,255,0.035)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    padding: 3,
  },
  emoteCellInner: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoteImage: {
    alignSelf: 'center',
  },
  emoteImageContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoteImageLoading: {
    opacity: 0,
  },
  emoteImagePlaceholder: {
    backgroundColor: '#202127',
    borderColor: 'rgba(255,255,255,0.055)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  emoteImageShimmer: {
    opacity: 0.9,
  },
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
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  providerChip: {
    alignItems: 'center',
    backgroundColor: '#191a1f',
    borderColor: 'rgba(255,255,255,0.055)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
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
    borderColor: 'rgba(255,255,255,0.14)',
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
    paddingHorizontal: theme.space16,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchInputWrap: {
    alignItems: 'center',
    backgroundColor: MENU_SURFACE,
    borderColor: 'rgba(255,255,255,0.065)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
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
    backgroundColor: '#15161a',
    borderColor: 'rgba(255,255,255,0.045)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
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
    backgroundColor: '#191a1f',
    borderColor: 'rgba(255,255,255,0.045)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    marginBottom: theme.space8,
    width: 38,
  },
  setRailButtonActive: {
    backgroundColor: MENU_ACTIVE_SURFACE,
    borderColor: 'rgba(255,255,255,0.14)',
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
