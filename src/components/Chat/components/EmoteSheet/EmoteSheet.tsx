import { BrandIcon, BrandIconName } from '@app/components/BrandIcon';
import { Button } from '@app/components/Button';
import { Image } from '@app/components/Image';
import { Text } from '@app/components/Text';
import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { useCurrentEmoteData, getCachedEmoteUri } from '@app/store/chatStore';
import { isBrandIcon } from '@app/utils/typescript/type-guards/isBrandIcon';
import { TrueSheet, TrueSheetProps } from '@lodev09/react-native-true-sheet';
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
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';

const GRID_COLUMNS = 8;
const EMOTE_SIZE = 44;
const CATEGORY_HEIGHT = 48;
const ROW_HEIGHT = EMOTE_SIZE + 4; // emote size + padding

export type EmotePickerItem = string | SanitisiedEmoteSet;

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
}

const EmoteCell = memo(({ item, onPress }: EmoteCellProps) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const imageSource = useMemo(() => {
    if (typeof item === 'object') {
      return getCachedEmoteUri(item.url);
    }
    return null;
  }, [item]);

  if (typeof item === 'object') {
    return (
      <Button style={styles.emoteCell} onPress={handlePress}>
        <Image
          source={imageSource || item.url}
          style={styles.emoteImage}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={item.id}
        />
      </Button>
    );
  }

  return (
    <Button style={styles.emoteCell} onPress={handlePress}>
      <Text style={styles.emojiText}>{item}</Text>
    </Button>
  );
});

EmoteCell.displayName = 'EmoteCell';

interface EmoteRowProps {
  items: EmotePickerItem[];
  onPress: (item: EmotePickerItem) => void;
}

const EmoteRow = memo(({ items, onPress }: EmoteRowProps) => {
  return (
    <View style={styles.emoteRow}>
      {items.map((item, index) => (
        <EmoteCell
          key={typeof item === 'object' ? item.id : `emoji-${index}-${item}`}
          item={item}
          onPress={onPress}
        />
      ))}
    </View>
  );
});

EmoteRow.displayName = 'EmoteRow';

interface SectionHeaderProps {
  title: string;
}

const SectionHeader = memo(({ title }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
));

SectionHeader.displayName = 'SectionHeader';

type ListItem =
  | { type: 'header'; title: string; key: string }
  | { type: 'row'; items: EmotePickerItem[]; key: string };

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
  ({ onEmoteSelect, ...sheetProps }, ref) => {
    const { bottom: bottomInset } = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const flashListRef = useRef<FlashListRef<ListItem>>(null);

    const listHeight = screenHeight * 0.55 - CATEGORY_HEIGHT - 40;

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

      // 7TV Channel
      if (sevenTvChannelEmotes.length > 0) {
        result.push({
          title: '7TV Channel',
          icon: 'stv',
          data: sevenTvChannelEmotes,
        });
      }

      // 7TV Global
      if (sevenTvGlobalEmotes.length > 0) {
        result.push({
          title: '7TV Global',
          icon: 'stv',
          data: sevenTvGlobalEmotes,
        });
      }

      // Twitch Channel
      if (twitchChannelEmotes.length > 0) {
        result.push({
          title: 'Twitch Channel',
          icon: 'twitch',
          data: twitchChannelEmotes,
        });
      }

      // Twitch Global
      if (twitchGlobalEmotes.length > 0) {
        result.push({
          title: 'Twitch Global',
          icon: 'twitch',
          data: twitchGlobalEmotes,
        });
      }

      // FFZ Channel
      if (ffzChannelEmotes.length > 0) {
        result.push({
          title: 'FFZ Channel',
          icon: 'ffz',
          data: ffzChannelEmotes,
        });
      }

      // FFZ Global
      if (ffzGlobalEmotes.length > 0) {
        result.push({
          title: 'FFZ Global',
          icon: 'ffz',
          data: ffzGlobalEmotes,
        });
      }

      // BTTV Channel
      if (bttvChannelEmotes.length > 0) {
        result.push({
          title: 'BTTV Channel',
          icon: 'bttv',
          data: bttvChannelEmotes,
        });
      }

      // BTTV Global
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

    // Flatten sections into list items (headers + rows)
    const flatData = useMemo<ListItem[]>(() => {
      const items: ListItem[] = [];

      sections.forEach((section, sectionIndex) => {
        items.push({
          type: 'header',
          title: section.title,
          key: `header-${sectionIndex}`,
        });

        // Chunk data into rows
        const rows: EmotePickerItem[][] = [];
        for (let i = 0; i < section.data.length; i += GRID_COLUMNS) {
          rows.push(section.data.slice(i, i + GRID_COLUMNS));
        }

        rows.forEach((row, rowIndex) => {
          items.push({
            type: 'row',
            items: row,
            key: `row-${sectionIndex}-${rowIndex}`,
          });
        });
      });

      return items;
    }, [sections]);

    const sectionIndices = useMemo(() => {
      const indices: number[] = [];
      flatData.forEach((item, index) => {
        if (item.type === 'header') {
          indices.push(index);
        }
      });
      return indices;
    }, [flatData]);

    const handleEmotePress = useCallback(
      (item: EmotePickerItem) => {
        onEmoteSelect?.(item);
      },
      [onEmoteSelect],
    );

    const [activeSection, setActiveSection] = useState(0);

    const scrollToSection = useCallback(
      (sectionIndex: number) => {
        const flatIndex = sectionIndices[sectionIndex];
        if (flatIndex !== undefined && flashListRef.current) {
          setActiveSection(sectionIndex);
          void flashListRef.current.scrollToIndex({
            index: flatIndex,
            animated: true,
          });
        }
      },
      [sectionIndices],
    );

    const renderItem = useCallback(
      ({ item }: { item: ListItem }) => {
        if (item.type === 'header') {
          return <SectionHeader title={item.title} />;
        }
        return <EmoteRow items={item.items} onPress={handleEmotePress} />;
      },
      [handleEmotePress],
    );

    const getItemType = useCallback((item: ListItem) => item.type, []);

    const keyExtractor = useCallback((item: ListItem) => item.key, []);

    useEffect(() => {
      if (sections.length > 0) {
        const firstSection = sections[0];
        if (firstSection && firstSection.data.length > 0) {
          const emotesToPreload = firstSection.data
            .filter(
              (item): item is SanitisiedEmoteSet => typeof item === 'object',
            )
            .slice(0, GRID_COLUMNS * 3); // Preload first 3 rows

          emotesToPreload.forEach(emote => {
            getCachedEmoteUri(emote.url);
          });
        }
      }
    }, [sections]);

    if (sections.length === 0) {
      return null;
    }

    return (
      <TrueSheet
        ref={ref}
        detents={[0.55]}
        cornerRadius={24}
        grabber={false}
        blurTint="dark"
        backgroundColor={
          UnistylesRuntime.themeName === 'dark' ? '#1a1a1a' : '#ffffff'
        }
        {...sheetProps}
      >
        <View style={[styles.container, { paddingBottom: bottomInset + 8 }]}>
          {/* Grabber */}
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          {/* Category Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryBar}
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

          {/* Emote Grid */}
          <View style={[styles.listContainer, { height: listHeight }]}>
            <FlashList<ListItem>
              ref={flashListRef}
              data={flatData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              getItemType={getItemType}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              // @ts-expect-error - estimatedItemSize exists on FlashList but types are wrong
              estimatedItemSize={ROW_HEIGHT}
              drawDistance={150}
            />
          </View>
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
    paddingVertical: 12,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray.accent,
  },
  categoryBar: {
    maxHeight: CATEGORY_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.accentHover,
  },
  categoryBarContent: {
    paddingHorizontal: 12,
    gap: 4,
    alignItems: 'center',
  },
  categoryButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.accent.accent,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emoteRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  emoteCell: {
    width: EMOTE_SIZE,
    height: EMOTE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  emoteImage: {
    width: 32,
    height: 32,
  },
  emojiText: {
    fontSize: 26,
    lineHeight: 32,
  },
}));
