import { Button } from '@app/components/Button/Button';
import { FlashList, ListRenderItem } from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/Text/Text';
import {
  chatStore$,
  clearEmoteImageCache,
  clearPaints,
  clearSevenTvBadges,
  usePaints,
} from '@app/store/chatStore';
import {
  CachedImageInfo,
  getCacheDirectoryPath,
  listCachedImages,
} from '@app/utils/image/image-cache';
import { useSelector } from '@legendapp/state/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

type TabType = 'images' | 'badges' | 'paints';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
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
  const { theme } = useUnistyles();
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [images, setImages] = useState<CachedImageInfo[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const badges = useSelector(chatStore$.badges);
  const paints = usePaints();

  useEffect(() => {
    const cachedImages = listCachedImages();
    setImages(cachedImages);
  }, [refreshKey]);

  const totalSize = images.reduce((acc, img) => acc + img.size, 0);

  const badgeList = useMemo<BadgeInfo[]>(() => {
    return Object.values(badges).map(badge => ({
      id: badge.id,
      url: badge.url,
      title: badge.title,
      type: badge.type,
      provider: badge.provider,
    }));
  }, [badges]);

  const paintList = useMemo<PaintInfo[]>(() => {
    return Object.values(paints).map(paint => ({
      id: paint.id,
      name: paint.name,
      function: paint.function,
      color: paint.color
        ? `#${paint.color.toString(16).padStart(8, '0')}`
        : null,
    }));
  }, [paints]);

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

  const renderImageItem: ListRenderItem<CachedImageInfo> = useCallback(
    ({ item }) => {
      const fileName = item.uri.split('/').pop() ?? item.name;
      return (
        <View style={styles.item}>
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: item.uri }}
              style={styles.thumbnail}
              contentFit="contain"
            />
          </View>
          <View style={styles.itemInfo}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName} numberOfLines={1}>
                {fileName}
              </Text>
              <View style={styles.sizeBadge}>
                <Text style={styles.sizeBadgeText}>
                  {formatBytes(item.size)}
                </Text>
              </View>
            </View>
            <Text style={styles.itemPath} selectable numberOfLines={1}>
              {item.uri}
            </Text>
          </View>
        </View>
      );
    },
    [],
  );

  const renderBadgeItem: ListRenderItem<BadgeInfo> = useCallback(
    ({ item }) => (
      <View style={styles.item}>
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: item.url }}
            style={styles.thumbnail}
            contentFit="contain"
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
            {item.provider && (
              <View style={styles.providerBadge}>
                <Text style={styles.providerBadgeText}>
                  {item.provider.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.itemPath} selectable numberOfLines={1}>
            {item.id}
          </Text>
        </View>
      </View>
    ),
    [],
  );

  const renderPaintItem: ListRenderItem<PaintInfo> = useCallback(
    ({ item }) => (
      <View style={styles.item}>
        <View style={styles.thumbnailContainer}>
          <View
            style={[
              styles.paintPreview,
              item.color
                ? { backgroundColor: item.color }
                : { backgroundColor: theme.colors.gray.ui },
            ]}
          />
        </View>
        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name || 'Unnamed Paint'}
            </Text>
            {item.color && (
              <View
                style={[styles.colorBadge, { backgroundColor: item.color }]}
              />
            )}
          </View>
          <Text style={styles.itemMeta}>
            {item.function.replace(/_/g, ' ').toLowerCase()}
          </Text>
          <Text style={styles.itemPath} selectable numberOfLines={1}>
            {item.id}
          </Text>
        </View>
      </View>
    ),
    [theme.colors.gray.ui],
  );

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

  const renderEmptyState = (message: string, submessage: string) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubtext}>{submessage}</Text>
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.tabContainer}>
        <Button
          onPress={() => setActiveTab('images')}
          style={[
            styles.tabButton,
            activeTab === 'images' && styles.tabButtonActive,
            activeTab === 'images' && {
              backgroundColor: theme.colors.blue.accent,
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
          onPress={() => setActiveTab('badges')}
          style={[
            styles.tabButton,
            activeTab === 'badges' && styles.tabButtonActive,
            activeTab === 'badges' && {
              backgroundColor: theme.colors.orange.accent,
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
          onPress={() => setActiveTab('paints')}
          style={[
            styles.tabButton,
            activeTab === 'paints' && styles.tabButtonActive,
            activeTab === 'paints' && {
              backgroundColor:
                theme.colors.violet?.accent || theme.colors.orange.accent,
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
        <Button onPress={handleRefresh} style={styles.button}>
          <Text style={styles.buttonText}>Refresh</Text>
        </Button>
        {activeTab === 'images' && (
          <Button
            onPress={handleClearCache}
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
            onPress={handleClearBadges}
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
            onPress={handleClearPaints}
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

  const renderContent = () => {
    switch (activeTab) {
      case 'images':
        return (
          <FlashList
            data={images}
            contentInsetAdjustmentBehavior="automatic"
            renderItem={renderImageItem}
            keyExtractor={item => item.uri}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={() =>
              renderEmptyState(
                'No cached images found',
                'Emote images will appear here after visiting a chat',
              )
            }
          />
        );
      case 'badges':
        return (
          <FlashList
            data={badgeList}
            contentInsetAdjustmentBehavior="automatic"
            renderItem={renderBadgeItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={() =>
              renderEmptyState(
                'No cached badges found',
                '7TV badges will appear here after viewing users with badges in chat',
              )
            }
          />
        );
      case 'paints':
        return (
          <FlashList
            data={paintList}
            contentInsetAdjustmentBehavior="automatic"
            renderItem={renderPaintItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={() =>
              renderEmptyState(
                'No cached paints found',
                '7TV paints will appear here after viewing users with paints in chat',
              )
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.container}>
        <ScreenHeader
          title="Cache Manager"
          subtitle={getSubtitle()}
          size="medium"
        />

        {/* Content List with Header */}
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: theme.colors.gray.bg,
    paddingBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray.ui,
    borderWidth: 1,
    borderColor: theme.colors.gray.border,
  },
  tabButtonActive: {
    borderColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gray.text,
    letterSpacing: 0.2,
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  pathContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.gray.ui,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.gray.border,
  },
  pathLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.gray.textLow,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  pathValue: {
    fontSize: 11,
    color: theme.colors.gray.text,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray.ui,
    borderWidth: 1,
    borderColor: theme.colors.gray.border,
  },
  buttonText: {
    color: theme.colors.gray.text,
    fontWeight: '500',
    fontSize: 13,
  },
  buttonTextDisabled: {
    color: theme.colors.gray.textLow,
    opacity: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: theme.colors.gray.ui,
    borderRadius: 14,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.gray.border,
  },
  thumbnailContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray.bg,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  paintPreview: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.gray.border,
  },
  itemInfo: {
    flex: 1,
    flexShrink: 1,
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.gray.text,
    letterSpacing: -0.2,
  },
  sizeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.gray.bg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.gray.border,
  },
  sizeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.gray.text,
    fontFamily: 'monospace',
  },
  providerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: theme.colors.gray.bg,
    borderRadius: 4,
    marginLeft: 6,
  },
  providerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.gray.textLow,
    letterSpacing: 0.5,
  },
  colorBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.gray.border,
  },
  itemMeta: {
    fontSize: 12,
    color: theme.colors.gray.textLow,
    fontWeight: '500',
  },
  itemPath: {
    fontSize: 10,
    color: theme.colors.gray.textLow,
    fontFamily: 'monospace',
    marginTop: 2,
    opacity: 0.7,
  },
  badgeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.gray.textLow,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.gray.textLow,
    textAlign: 'center',
    lineHeight: 21,
    opacity: 0.8,
  },
}));
