import { BrandIcon, BrandIconName } from '@app/components/BrandIcon/BrandIcon';
import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { useCurrentEmoteData, getCachedEmoteUri } from '@app/store/chatStore';
import type { SanitisedEmote } from '@app/types/emote';
import { isBrandIcon } from '@app/utils/typescript/type-guards/isBrandIcon';
import {
  type DidDismissEvent,
  type DidPresentEvent,
  TrueSheet,
  type TrueSheetProps,
} from '@lodev09/react-native-true-sheet';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

const MIN_CELL_SIZE = 40;
const MAX_CELL_SIZE = 52;
const GRID_HORIZONTAL_PADDING = 16;
const CATEGORY_BAR_HEIGHT = 44;
const GRABBER_TOP = 8;
const GRABBER_BOTTOM = 4;
const LIST_TOP_PADDING = 4;
export type EmotePickerItem = string | SanitisedEmote;

type EmoteSectionIcon = BrandIconName | `emoji:${string}`;

export interface EmoteSection {
  title: string;
  icon: EmoteSectionIcon;
  data: EmotePickerItem[];
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

interface EmoteCellProps {
  item: EmotePickerItem;
  onPress: (item: EmotePickerItem) => void;
  cellSize: number;
}

const EmoteCell = memo(({ item, onPress, cellSize }: EmoteCellProps) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const imageSource = useMemo(() => {
    if (typeof item === 'object') {
      return getCachedEmoteUri(item.url);
    }
    return null;
  }, [item]);

  const size = cellSize;
  const innerSize = Math.round(size * 0.72);

  if (typeof item === 'object') {
    return (
      <Button
        style={[styles.emoteCell, { width: size, height: size }]}
        onPress={handlePress}
      >
        <Image
          source={imageSource || item.url}
          style={[styles.emoteImage, { width: innerSize, height: innerSize }]}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={item.id}
        />
      </Button>
    );
  }

  return (
    <Button
      style={[styles.emoteCell, { width: size, height: size }]}
      onPress={handlePress}
    >
      <Text style={[styles.emojiText, { fontSize: innerSize * 0.85 }]}>
        {item}
      </Text>
    </Button>
  );
});

EmoteCell.displayName = 'EmoteCell';

interface EmoteRowProps {
  items: EmotePickerItem[];
  onPress: (item: EmotePickerItem) => void;
}

interface EmoteRowPropsWithSize extends EmoteRowProps {
  cellSize: number;
}

const EmoteRow = memo(({ items, onPress, cellSize }: EmoteRowPropsWithSize) => {
  return (
    <View style={styles.emoteRow}>
      {items.map((item, index) => (
        <EmoteCell
          key={typeof item === 'object' ? item.id : `emoji-${index}-${item}`}
          item={item}
          onPress={onPress}
          cellSize={cellSize}
        />
      ))}
    </View>
  );
});

EmoteRow.displayName = 'EmoteRow';

type ListItem = { type: 'row'; items: EmotePickerItem[]; key: string };

interface CategoryButtonProps {
  section: EmoteSection;
  isActive: boolean;
  onPress: () => void;
}

const CategoryButton = memo(
  ({ section, isActive, onPress }: CategoryButtonProps) => {
    const isEmoji = section.icon.startsWith('emoji:');
    const displayIcon = isEmoji ? section.icon.slice(6) : section.icon;

    return (
      <Button
        style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
        onPress={onPress}
      >
        {!isEmoji && isBrandIcon(displayIcon) ? (
          <BrandIcon
            name={displayIcon}
            size="sm"
            color={isActive ? 'text' : undefined}
          />
        ) : (
          <Text style={styles.categoryEmoji}>{displayIcon}</Text>
        )}
      </Button>
    );
  },
);

CategoryButton.displayName = 'CategoryButton';

export const EmoteSheet = forwardRef<TrueSheet, EmoteSheetProps>(
  ({ onEmoteSelect, onDidPresent, onDidDismiss, ...sheetProps }, ref) => {
    const { theme } = useUnistyles();
    const { bottom: bottomInset } = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const flashListRef = useRef<FlashListRef<ListItem>>(null);

    const [contentReady, setContentReady] = useState(false);

    const listHeight =
      screenHeight * 0.55 -
      CATEGORY_BAR_HEIGHT -
      GRABBER_TOP -
      GRABBER_BOTTOM -
      LIST_TOP_PADDING -
      24;

    const columns = Math.max(
      5,
      Math.min(
        10,
        Math.floor((screenWidth - GRID_HORIZONTAL_PADDING * 2) / MIN_CELL_SIZE),
      ),
    );
    const cellSize = Math.min(
      MAX_CELL_SIZE,
      Math.max(
        MIN_CELL_SIZE,
        (screenWidth - GRID_HORIZONTAL_PADDING * 2) / columns,
      ),
    );

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

    const sections = useMemo<EmoteSection[]>(() => {
      const result: EmoteSection[] = [];

      if (sevenTvChannelEmotes.length > 0) {
        result.push({
          title: '7TV Channel',
          icon: 'stv',
          data: sevenTvChannelEmotes,
        });
      }

      if (sevenTvGlobalEmotes.length > 0) {
        result.push({
          title: '7TV Global',
          icon: 'stv',
          data: sevenTvGlobalEmotes,
        });
      }

      if (twitchChannelEmotes.length > 0) {
        result.push({
          title: 'Twitch Channel',
          icon: 'twitch',
          data: twitchChannelEmotes,
        });
      }

      if (twitchGlobalEmotes.length > 0) {
        result.push({
          title: 'Twitch Global',
          icon: 'twitch',
          data: twitchGlobalEmotes,
        });
      }

      if (ffzChannelEmotes.length > 0) {
        result.push({
          title: 'FFZ Channel',
          icon: 'ffz',
          data: ffzChannelEmotes,
        });
      }

      if (ffzGlobalEmotes.length > 0) {
        result.push({
          title: 'FFZ Global',
          icon: 'ffz',
          data: ffzGlobalEmotes,
        });
      }

      if (bttvChannelEmotes.length > 0) {
        result.push({
          title: 'BTTV Channel',
          icon: 'bttv',
          data: bttvChannelEmotes,
        });
      }

      if (bttvGlobalEmotes.length > 0) {
        result.push({
          title: 'BTTV Global',
          icon: 'bttv',
          data: bttvGlobalEmotes,
        });
      }

      result.push(...EMOJI_SECTIONS);

      return result;
    }, [
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      bttvChannelEmotes,
      bttvGlobalEmotes,
    ]);

    const { flatData, sectionStartIndices } = useMemo(() => {
      const items: ListItem[] = [];
      const starts: number[] = [];

      sections.forEach((section, sectionIndex) => {
        starts.push(items.length);
        const rows: EmotePickerItem[][] = [];
        for (let i = 0; i < section.data.length; i += columns) {
          rows.push(section.data.slice(i, i + columns));
        }
        rows.forEach((row, rowIndex) => {
          items.push({
            type: 'row',
            items: row,
            key: `row-${sectionIndex}-${rowIndex}`,
          });
        });
      });

      return { flatData: items, sectionStartIndices: starts };
    }, [sections, columns]);

    const handleEmotePress = useCallback(
      (item: EmotePickerItem) => {
        onEmoteSelect?.(item);
      },
      [onEmoteSelect],
    );

    const [activeSection, setActiveSection] = useState(0);

    const scrollToSection = useCallback(
      (sectionIndex: number) => {
        const flatIndex = sectionStartIndices[sectionIndex];
        if (flatIndex !== undefined && flashListRef.current) {
          setActiveSection(sectionIndex);
          void flashListRef.current.scrollToIndex({
            index: flatIndex,
            animated: true,
          });
        }
      },
      [sectionStartIndices],
    );

    const onViewableItemsChanged = useCallback(
      (info: { viewableItems: { index: number | null }[] }) => {
        const indices = info.viewableItems
          .map(v => v.index)
          .filter((i): i is number => i != null);
        if (indices.length === 0) return;
        const topIndex = Math.min(...indices);
        let section = 0;
        for (
          let i = sectionStartIndices?.length
            ? sectionStartIndices.length - 1
            : -1;
          i >= 0;
          i -= 1
        ) {
          const start = sectionStartIndices?.[i];
          if (typeof start === 'number' && start <= topIndex) {
            section = i;
            break;
          }
        }
        setActiveSection(section);
      },
      [sectionStartIndices],
    );

    const viewabilityConfig = useMemo(
      () => ({
        itemVisiblePercentThreshold: 10,
        minimumViewTime: 50,
      }),
      [],
    );

    const renderItem = useCallback(
      ({ item }: { item: ListItem }) => (
        <EmoteRow
          items={item.items}
          onPress={handleEmotePress}
          cellSize={cellSize}
        />
      ),
      [handleEmotePress, cellSize],
    );

    const getItemType = useCallback((item: ListItem) => item.type, []);

    const keyExtractor = useCallback((item: ListItem) => item.key, []);

    useEffect(() => {
      if (sections.length > 0) {
        const firstSection = sections[0];
        if (firstSection && firstSection.data.length > 0) {
          const emotesToPreload = firstSection.data
            .filter((item): item is SanitisedEmote => typeof item === 'object')
            .slice(0, columns * 3);

          emotesToPreload.forEach(emote => {
            getCachedEmoteUri(emote.url);
          });
        }
      }
    }, [sections, columns]);

    const handleDidPresent = useCallback(
      (e: DidPresentEvent) => {
        setContentReady(true);
        onDidPresent?.(e);
      },
      [onDidPresent],
    );

    const handleDidDismiss = useCallback(
      (e: DidDismissEvent) => {
        setContentReady(false);
        onDidDismiss?.(e);
      },
      [onDidDismiss],
    );

    const showPlaceholder = !contentReady || sections.length === 0;

    return (
      <TrueSheet
        ref={ref}
        detents={[0.55]}
        cornerRadius={24}
        grabber={false}
        blurTint="dark"
        backgroundColor={theme.colors.gray.bg}
        {...sheetProps}
        onDidPresent={handleDidPresent}
        onDidDismiss={handleDidDismiss}
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

          {showPlaceholder ? (
            <View style={[styles.placeholderContent, { height: listHeight }]}>
              <ActivityIndicator size="large" color={theme.colors.gray.text} />
            </View>
          ) : (
            <>
              <View style={styles.categoryBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryBarContent}
                >
                  {sections.map((section, index) => (
                    <CategoryButton
                      key={`category-${section.title}`}
                      section={section}
                      isActive={index === activeSection}
                      onPress={() => scrollToSection(index)}
                    />
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.listContainer, { height: listHeight }]}>
                <FlashList<ListItem>
                  ref={flashListRef}
                  data={flatData}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  getItemType={getItemType}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  drawDistance={200}
                />
              </View>
            </>
          )}
        </View>
      </TrueSheet>
    );
  },
);

EmoteSheet.displayName = 'EmoteSheet';

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: GRABBER_TOP,
    paddingBottom: GRABBER_BOTTOM,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray.accent,
  },
  categoryBar: {
    height: CATEGORY_BAR_HEIGHT,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray.border,
  },
  categoryBarContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryButton: {
    width: 44,
    minHeight: 44,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.accent.accent,
  },
  categoryEmoji: {
    fontSize: theme.font.fontSize.lg,
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: LIST_TOP_PADDING,
    paddingBottom: theme.spacing.lg,
  },
  emoteRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.xs,
  },
  emoteCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
  },
  emoteImage: {},
  emojiText: {
    lineHeight: undefined,
  },
}));
