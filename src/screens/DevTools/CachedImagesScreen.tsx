import { Button } from '@app/components/Button/Button';
import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  clearPaints,
  clearSevenTvBadges,
} from '@app/store/chatStore/cosmetics';
import { clearEmoteImageCache } from '@app/store/chatStore/emoteImages';
import { usePaints } from '@app/store/chatStore/hooks';
import { chatStore$ } from '@app/store/chatStore/state';
import { theme } from '@app/styles/themes';
import {
  CachedImageInfo,
  getCacheDirectoryPath,
  listCachedImages,
} from '@app/utils/image/image-cache';
import { useSelector } from '@legendapp/state/react';
import { useRef, useState, useCallback, type RefObject } from 'react';
import { Alert, Platform, View, StyleSheet } from 'react-native';

type TabType = 'images' | 'badges' | 'paints';

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

interface BadgeInfo {
  id: string;
  url: string;
  title: string;
  type: string;
  provider?: string;
}

interface PaintInfo {
  id: string;
  name: string;
  function: string;
  color: string | null;
}

export function CachedImagesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [, setRefreshKey] = useState(0);
  const listRef = useRef<FlashListRef<CachedImageInfo>>(null);

  useScrollToTop(listRef);

  const badges = useSelector(chatStore$.badges);
  const paints = usePaints();

  const images = listCachedImages();

  const totalSize = images.reduce((acc, img) => acc + img.size, 0);

  const badgeList = Object.values(badges).map(badge => ({
    id: badge.id,
    url: badge.url,
    title: badge.title,
    type: badge.type,
    provider: badge.provider,
  }));

  const paintList = Object.values(paints).map(paint => ({
    id: paint.id,
    name: paint.name,
    function: paint.function,
    color: paint.color ? `#${paint.color.toString(16).padStart(8, '0')}` : null,
  }));

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Image Cache',
      `Are you sure you want to delete ${images.length} cached images (${formatBytes(totalSize)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearEmoteImageCache();
            setRefreshKey(k => k + 1);
          },
        },
      ],
    );
  }, [images.length, totalSize]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleClearBadges = useCallback(() => {
    Alert.alert(
      'Clear 7TV Badges',
      `Are you sure you want to clear ${badgeList.length} cached 7TV badges?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearSevenTvBadges();
            Alert.alert('Success', 'All 7TV badges have been cleared');
            setRefreshKey(k => k + 1);
          },
        },
      ],
    );
  }, [badgeList.length]);

  const handleClearPaints = useCallback(() => {
    Alert.alert(
      'Clear Paints',
      `Are you sure you want to clear ${paintList.length} cached 7TV paints?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearPaints();
            Alert.alert('Success', 'All paints have been cleared');
            setRefreshKey(k => k + 1);
          },
        },
      ],
    );
  }, [paintList.length]);

  const getSubtitle = () => {
    switch (activeTab) {
      case 'images':
        return `${images.length} images • ${formatBytes(totalSize)}`;
      case 'badges':
        return `${badgeList.length} badges`;
      case 'paints':
        return `${paintList.length} paints`;
      default:
        return '';
    }
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.container}>
        {Platform.OS === 'ios' ? null : (
          <ScreenHeader
            title='Cache Manager'
            subtitle={getSubtitle()}
            size='medium'
          />
        )}

        <CachedImagesListHeader
          activeTab={activeTab}
          badgeList={badgeList}
          images={images}
          onClearBadges={handleClearBadges}
          onClearCache={handleClearCache}
          onClearPaints={handleClearPaints}
          onRefresh={handleRefresh}
          onSelectTab={setActiveTab}
          paintList={paintList}
        />
        <CachedImagesTabContent
          activeTab={activeTab}
          badgeList={badgeList}
          images={images}
          listRef={listRef}
          paintList={paintList}
        />
      </View>
    </View>
  );
}

function CachedImagesListHeader({
  activeTab,
  badgeList,
  images,
  onClearBadges,
  onClearCache,
  onClearPaints,
  onRefresh,
  onSelectTab,
  paintList,
}: {
  activeTab: TabType;
  badgeList: BadgeInfo[];
  images: CachedImageInfo[];
  onClearBadges: () => void;
  onClearCache: () => void;
  onClearPaints: () => void;
  onRefresh: () => void;
  onSelectTab: (tab: TabType) => void;
  paintList: PaintInfo[];
}) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.tabContainer}>
        <Button
          onPress={() => onSelectTab('images')}
          style={[
            styles.tabButton,
            activeTab === 'images' && styles.tabButtonActive,
            activeTab === 'images' && {
              backgroundColor: theme.colorBlue,
            },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'images' && styles.tabButtonTextActive,
            ]}
          >
            Images
          </Text>
        </Button>
        <Button
          onPress={() => onSelectTab('badges')}
          style={[
            styles.tabButton,
            activeTab === 'badges' && styles.tabButtonActive,
            activeTab === 'badges' && {
              backgroundColor: theme.colorOrange,
            },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'badges' && styles.tabButtonTextActive,
            ]}
          >
            Badges
          </Text>
        </Button>
        <Button
          onPress={() => onSelectTab('paints')}
          style={[
            styles.tabButton,
            activeTab === 'paints' && styles.tabButtonActive,
            activeTab === 'paints' && {
              backgroundColor: theme.colorViolet || theme.colorOrange,
            },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'paints' && styles.tabButtonTextActive,
            ]}
          >
            Paints
          </Text>
        </Button>
      </View>

      {/* Cache Location (only show for images) */}
      {activeTab === 'images' && (
        <View style={styles.pathContainer}>
          <Text style={styles.pathLabel}>Cache Location</Text>
          <Text style={styles.pathValue} numberOfLines={1} selectable>
            {getCacheDirectoryPath()}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button onPress={onRefresh} style={styles.button}>
          <Text style={styles.buttonText}>Refresh</Text>
        </Button>
        {activeTab === 'images' && (
          <Button
            onPress={onClearCache}
            style={styles.button}
            disabled={images.length === 0}
          >
            <Text
              style={[
                styles.buttonText,
                images.length === 0 && styles.buttonTextDisabled,
              ]}
            >
              Clear
            </Text>
          </Button>
        )}
        {activeTab === 'badges' && (
          <Button
            onPress={onClearBadges}
            style={styles.button}
            disabled={badgeList.length === 0}
          >
            <Text
              style={[
                styles.buttonText,
                badgeList.length === 0 && styles.buttonTextDisabled,
              ]}
            >
              Clear
            </Text>
          </Button>
        )}
        {activeTab === 'paints' && (
          <Button
            onPress={onClearPaints}
            style={styles.button}
            disabled={paintList.length === 0}
          >
            <Text
              style={[
                styles.buttonText,
                paintList.length === 0 && styles.buttonTextDisabled,
              ]}
            >
              Clear
            </Text>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  badgeMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: {
    color: theme.color.text.dark,
    fontSize: 13,
    fontWeight: '500',
  },
  buttonTextDisabled: {
    color: theme.color.textSecondary.dark,
    opacity: 0.5,
  },
  colorBadge: {
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 20,
    width: 20,
  },
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptySubtext: {
    color: theme.color.textSecondary.dark,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.8,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.color.textSecondary.dark,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  headerContainer: {
    backgroundColor: theme.color.background.dark,
    paddingBottom: 8,
  },
  item: {
    alignItems: 'flex-start',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    padding: 16,
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  itemInfo: {
    flex: 1,
    flexShrink: 1,
    gap: 6,
  },
  itemMeta: {
    color: theme.color.textSecondary.dark,
    fontSize: 12,
    fontWeight: '500',
  },
  itemName: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  itemPath: {
    color: theme.color.textSecondary.dark,
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  paintPreview: {
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 2,
    height: 64,
    width: 64,
  },
  pathContainer: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pathLabel: {
    color: theme.color.textSecondary.dark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pathValue: {
    color: theme.color.text.dark,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  providerBadge: {
    backgroundColor: theme.color.background.dark,
    borderCurve: 'continuous',
    borderRadius: 4,
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  providerBadgeText: {
    color: theme.color.textSecondary.dark,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  screenContainer: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  sizeBadge: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sizeBadgeText: {
    color: theme.color.text.dark,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '600',
  },
  tabButton: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabButtonActive: {
    borderColor: 'transparent',
  },
  tabButtonText: {
    color: theme.color.text.dark,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  thumbnail: {
    borderCurve: 'continuous',
    borderRadius: 10,
    height: 64,
    width: 64,
  },
  thumbnailContainer: {
    backgroundColor: theme.color.background.dark,
    borderCurve: 'continuous',
    borderRadius: 10,
    overflow: 'hidden',
  },
});

const renderCachedImageItem: ListRenderItem<CachedImageInfo> = ({ item }) => {
  const fileName = item.uri.split('/').pop() ?? item.name;
  return (
    <View style={styles.item}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnail}
          contentFit='contain'
        />
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={styles.sizeBadge}>
            <Text style={styles.sizeBadgeText}>{formatBytes(item.size)}</Text>
          </View>
        </View>
        <Text style={styles.itemPath} selectable numberOfLines={1}>
          {item.uri}
        </Text>
      </View>
    </View>
  );
};

const renderCachedBadgeItem: ListRenderItem<BadgeInfo> = ({ item }) => (
  <View style={styles.item}>
    <View style={styles.thumbnailContainer}>
      <Image
        source={{ uri: item.url }}
        style={styles.thumbnail}
        contentFit='contain'
      />
    </View>
    <View style={styles.itemInfo}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      <View style={styles.badgeMeta}>
        <Text style={styles.itemMeta}>{item.type}</Text>
        {item.provider ? (
          <View style={styles.providerBadge}>
            <Text style={styles.providerBadgeText}>
              {item.provider.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.itemPath} selectable numberOfLines={1}>
        {item.id}
      </Text>
    </View>
  </View>
);

const renderCachedPaintItem: ListRenderItem<PaintInfo> = ({ item }) => (
  <View style={styles.item}>
    <View style={styles.thumbnailContainer}>
      <View
        style={[
          styles.paintPreview,
          item.color
            ? { backgroundColor: item.color }
            : { backgroundColor: theme.color.backgroundSecondary.dark },
        ]}
      />
    </View>
    <View style={styles.itemInfo}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name || 'Unnamed Paint'}
        </Text>
        {item.color ? (
          <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
        ) : null}
      </View>
      <Text style={styles.itemMeta}>
        {item.function.replace(/_/g, ' ').toLowerCase()}
      </Text>
      <Text style={styles.itemPath} selectable numberOfLines={1}>
        {item.id}
      </Text>
    </View>
  </View>
);

function CachedImagesEmptyState({
  message,
  submessage,
}: {
  message: string;
  submessage: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubtext}>{submessage}</Text>
    </View>
  );
}

function CachedImagesTabContent({
  activeTab,
  badgeList,
  images,
  listRef,
  paintList,
}: {
  activeTab: TabType;
  badgeList: BadgeInfo[];
  images: CachedImageInfo[];
  listRef: RefObject<FlashListRef<CachedImageInfo> | null>;
  paintList: PaintInfo[];
}) {
  if (activeTab === 'images') {
    return (
      <FlashList
        ref={listRef}
        data={images}
        contentInsetAdjustmentBehavior='automatic'
        renderItem={renderCachedImageItem}
        keyExtractor={item => item.uri}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <CachedImagesEmptyState
            message='No cached images found'
            submessage='Emote images will appear here after visiting a chat'
          />
        }
      />
    );
  }

  if (activeTab === 'badges') {
    return (
      <FlashList
        ref={listRef as RefObject<FlashListRef<BadgeInfo> | null>}
        data={badgeList}
        contentInsetAdjustmentBehavior='automatic'
        renderItem={renderCachedBadgeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <CachedImagesEmptyState
            message='No cached badges found'
            submessage='7TV badges will appear here after viewing users with badges in chat'
          />
        }
      />
    );
  }

  if (activeTab === 'paints') {
    return (
      <FlashList
        ref={listRef as RefObject<FlashListRef<PaintInfo> | null>}
        data={paintList}
        contentInsetAdjustmentBehavior='automatic'
        renderItem={renderCachedPaintItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <CachedImagesEmptyState
            message='No cached paints found'
            submessage='7TV paints will appear here after viewing users with paints in chat'
          />
        }
      />
    );
  }

  return null;
}
