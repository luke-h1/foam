import { type RefObject, useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSelector } from '@legendapp/state/react';

import { Button } from '@app/components/Button/Button';
import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import i18next from '@app/i18n/i18next';
import {
  clearPaints,
  clearSevenTvBadges,
} from '@app/store/chat/actions/cosmetics';
import { clearEmoteImageCache } from '@app/store/chat/actions/emoteImages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { usePaints } from '@app/store/chat/react/selectors';
import { theme } from '@app/styles/themes';
import {
  CachedImageInfo,
  getCacheDirectoryPath,
  listCachedImages,
} from '@app/utils/image/image-cache';

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
  const { top: topInset } = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
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
      i18next.t('devTools:clearImageCache'),
      i18next.t('devTools:clearImageCacheConfirm', {
        count: images.length,
        size: formatBytes(totalSize),
      }),
      [
        { text: i18next.t('common:cancel'), style: 'cancel' },
        {
          text: i18next.t('devTools:clear'),
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
      i18next.t('devTools:clearSevenTvBadges'),
      i18next.t('devTools:clearSevenTvBadgesConfirm', {
        count: badgeList.length,
      }),
      [
        { text: i18next.t('common:cancel'), style: 'cancel' },
        {
          text: i18next.t('devTools:clear'),
          style: 'destructive',
          onPress: () => {
            clearSevenTvBadges();
            Alert.alert(
              i18next.t('devTools:success'),
              i18next.t('devTools:badgesCleared'),
            );
            setRefreshKey(k => k + 1);
          },
        },
      ],
    );
  }, [badgeList.length]);

  const handleClearPaints = useCallback(() => {
    Alert.alert(
      i18next.t('devTools:clearPaints'),
      i18next.t('devTools:clearPaintsConfirm', {
        count: paintList.length,
      }),
      [
        { text: i18next.t('common:cancel'), style: 'cancel' },
        {
          text: i18next.t('devTools:clear'),
          style: 'destructive',
          onPress: () => {
            clearPaints();
            Alert.alert(
              i18next.t('devTools:success'),
              i18next.t('devTools:paintsCleared'),
            );
            setRefreshKey(k => k + 1);
          },
        },
      ],
    );
  }, [paintList.length]);

  return (
    <View
      style={[
        styles.screenContainer,
        { backgroundColor: theme.color.background[scheme] },
        Platform.OS === 'ios' && { paddingTop: topInset + 44 },
      ]}
    >
      <View style={styles.container}>
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
  const { t } = useTranslation('devTools');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const tabButtonColors = {
    backgroundColor: theme.color.backgroundSecondary[scheme],
    borderColor: theme.color.border[scheme],
  };
  const buttonColors = {
    backgroundColor: theme.color.backgroundSecondary[scheme],
    borderColor: theme.color.border[scheme],
  };
  const textColor = { color: theme.color.text[scheme] };
  const secondaryTextColor = { color: theme.color.textSecondary[scheme] };

  return (
    <View
      style={[
        styles.headerContainer,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <View style={styles.tabContainer}>
        <Button
          onPress={() => onSelectTab('images')}
          style={[
            styles.tabButton,
            tabButtonColors,
            activeTab === 'images' && styles.tabButtonActive,
            activeTab === 'images' && {
              backgroundColor: theme.color.blue[scheme],
            },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              textColor,
              activeTab === 'images' && styles.tabButtonTextActive,
            ]}
          >
            {t('images')}
          </Text>
        </Button>
        <Button
          onPress={() => onSelectTab('badges')}
          style={[
            styles.tabButton,
            tabButtonColors,
            activeTab === 'badges' && styles.tabButtonActive,
            activeTab === 'badges' && {
              backgroundColor: theme.color.orange[scheme],
            },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              textColor,
              activeTab === 'badges' && styles.tabButtonTextActive,
            ]}
          >
            {t('badges')}
          </Text>
        </Button>
        <Button
          onPress={() => onSelectTab('paints')}
          style={[
            styles.tabButton,
            tabButtonColors,
            activeTab === 'paints' && styles.tabButtonActive,
            activeTab === 'paints' && {
              backgroundColor: theme.color.violet[scheme],
            },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              textColor,
              activeTab === 'paints' && styles.tabButtonTextActive,
            ]}
          >
            {t('paints')}
          </Text>
        </Button>
      </View>

      {activeTab === 'images' && (
        <View style={[styles.pathContainer, buttonColors]}>
          <Text style={[styles.pathLabel, secondaryTextColor]}>
            {t('cacheLocation')}
          </Text>
          <Text
            style={[styles.pathValue, textColor]}
            numberOfLines={1}
            selectable
          >
            {getCacheDirectoryPath()}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button onPress={onRefresh} style={[styles.button, buttonColors]}>
          <Text style={[styles.buttonText, textColor]}>{t('refresh')}</Text>
        </Button>
        {activeTab === 'images' && (
          <Button
            onPress={onClearCache}
            style={[styles.button, buttonColors]}
            disabled={images.length === 0}
          >
            <Text
              style={[
                styles.buttonText,
                textColor,
                images.length === 0 && styles.buttonTextDisabled,
                images.length === 0 && secondaryTextColor,
              ]}
            >
              {t('clear')}
            </Text>
          </Button>
        )}
        {activeTab === 'badges' && (
          <Button
            onPress={onClearBadges}
            style={[styles.button, buttonColors]}
            disabled={badgeList.length === 0}
          >
            <Text
              style={[
                styles.buttonText,
                textColor,
                badgeList.length === 0 && styles.buttonTextDisabled,
                badgeList.length === 0 && secondaryTextColor,
              ]}
            >
              {t('clear')}
            </Text>
          </Button>
        )}
        {activeTab === 'paints' && (
          <Button
            onPress={onClearPaints}
            style={[styles.button, buttonColors]}
            disabled={paintList.length === 0}
          >
            <Text
              style={[
                styles.buttonText,
                textColor,
                paintList.length === 0 && styles.buttonTextDisabled,
                paintList.length === 0 && secondaryTextColor,
              ]}
            >
              {t('clear')}
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
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
  colorBadge: {
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
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  item: {
    alignItems: 'flex-start',
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
    fontSize: 12,
    fontWeight: '500',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  itemPath: {
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
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 2,
    height: 64,
    width: 64,
  },
  pathContainer: {
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pathLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pathValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  providerBadge: {
    borderCurve: 'continuous',
    borderRadius: 4,
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  providerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  screenContainer: {
    flex: 1,
  },
  sizeBadge: {
    borderCurve: 'continuous',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sizeBadgeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '600',
  },
  tabButton: {
    alignItems: 'center',
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
    borderCurve: 'continuous',
    borderRadius: 10,
    overflow: 'hidden',
  },
});

function useCachedItemColorStyles() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return useMemo(
    () => ({
      item: {
        backgroundColor: theme.color.backgroundSecondary[scheme],
        borderColor: theme.color.border[scheme],
      },
      thumbnailContainer: {
        backgroundColor: theme.color.background[scheme],
      },
      itemName: { color: theme.color.text[scheme] },
      itemMeta: { color: theme.color.textSecondary[scheme] },
      itemPath: { color: theme.color.textSecondary[scheme] },
      sizeBadge: {
        backgroundColor: theme.color.background[scheme],
        borderColor: theme.color.border[scheme],
      },
      sizeBadgeText: { color: theme.color.text[scheme] },
      providerBadge: { backgroundColor: theme.color.background[scheme] },
      providerBadgeText: { color: theme.color.textSecondary[scheme] },
      paintPreviewFallback: {
        backgroundColor: theme.color.backgroundSecondary[scheme],
      },
      border: { borderColor: theme.color.border[scheme] },
    }),
    [scheme],
  );
}

function CachedImageRow({ item }: { item: CachedImageInfo }) {
  const colors = useCachedItemColorStyles();
  const fileName = item.uri.split('/').pop() ?? item.name;
  return (
    <View style={[styles.item, colors.item]}>
      <View style={[styles.thumbnailContainer, colors.thumbnailContainer]}>
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnail}
          contentFit='contain'
        />
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, colors.itemName]} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={[styles.sizeBadge, colors.sizeBadge]}>
            <Text style={[styles.sizeBadgeText, colors.sizeBadgeText]}>
              {formatBytes(item.size)}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.itemPath, colors.itemPath]}
          selectable
          numberOfLines={1}
        >
          {item.uri}
        </Text>
      </View>
    </View>
  );
}

function CachedBadgeRow({ item }: { item: BadgeInfo }) {
  const colors = useCachedItemColorStyles();
  return (
    <View style={[styles.item, colors.item]}>
      <View style={[styles.thumbnailContainer, colors.thumbnailContainer]}>
        <Image
          source={{ uri: item.url }}
          style={styles.thumbnail}
          contentFit='contain'
        />
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, colors.itemName]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View style={styles.badgeMeta}>
          <Text style={[styles.itemMeta, colors.itemMeta]}>{item.type}</Text>
          {item.provider ? (
            <View style={[styles.providerBadge, colors.providerBadge]}>
              <Text
                style={[styles.providerBadgeText, colors.providerBadgeText]}
              >
                {item.provider.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[styles.itemPath, colors.itemPath]}
          selectable
          numberOfLines={1}
        >
          {item.id}
        </Text>
      </View>
    </View>
  );
}

function CachedPaintRow({ item }: { item: PaintInfo }) {
  const colors = useCachedItemColorStyles();
  return (
    <View style={[styles.item, colors.item]}>
      <View style={[styles.thumbnailContainer, colors.thumbnailContainer]}>
        <View
          style={[
            styles.paintPreview,
            colors.border,
            item.color
              ? { backgroundColor: item.color }
              : colors.paintPreviewFallback,
          ]}
        />
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, colors.itemName]} numberOfLines={1}>
            {item.name || i18next.t('devTools:unnamedPaint')}
          </Text>
          {item.color ? (
            <View
              style={[
                styles.colorBadge,
                colors.border,
                { backgroundColor: item.color },
              ]}
            />
          ) : null}
        </View>
        <Text style={[styles.itemMeta, colors.itemMeta]}>
          {item.function.replace(/_/g, ' ').toLowerCase()}
        </Text>
        <Text
          style={[styles.itemPath, colors.itemPath]}
          selectable
          numberOfLines={1}
        >
          {item.id}
        </Text>
      </View>
    </View>
  );
}

const renderCachedImageItem: ListRenderItem<CachedImageInfo> = ({ item }) => (
  <CachedImageRow item={item} />
);

const renderCachedBadgeItem: ListRenderItem<BadgeInfo> = ({ item }) => (
  <CachedBadgeRow item={item} />
);

const renderCachedPaintItem: ListRenderItem<PaintInfo> = ({ item }) => (
  <CachedPaintRow item={item} />
);

function CachedImagesEmptyState({
  message,
  submessage,
}: {
  message: string;
  submessage: string;
}) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <View style={styles.emptyState}>
      <Text
        style={[styles.emptyText, { color: theme.color.textSecondary[scheme] }]}
      >
        {message}
      </Text>
      <Text
        style={[
          styles.emptySubtext,
          { color: theme.color.textSecondary[scheme] },
        ]}
      >
        {submessage}
      </Text>
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
            message={i18next.t('devTools:noCachedImages')}
            submessage={i18next.t('devTools:noCachedImagesDescription')}
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
            message={i18next.t('devTools:noCachedBadges')}
            submessage={i18next.t('devTools:noCachedBadgesDescription')}
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
            message={i18next.t('devTools:noCachedPaints')}
            submessage={i18next.t('devTools:noCachedPaintsDescription')}
          />
        }
      />
    );
  }

  return null;
}
