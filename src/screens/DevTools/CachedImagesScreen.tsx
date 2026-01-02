import { Button } from '@app/components/Button';
import { FlashList, ListRenderItem } from '@app/components/FlashList';
import { Image } from '@app/components/Image';
import { ScreenHeader } from '@app/components/ScreenHeader';
import { Text } from '@app/components/Text';
import { clearEmoteImageCache } from '@app/store/chatStore';
import {
  CachedImageInfo,
  getCacheDirectoryPath,
  listCachedImages,
} from '@app/utils/image/image-cache';
import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function CachedImagesScreen() {
  const { theme } = useUnistyles();
  const [images, setImages] = useState<CachedImageInfo[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const cachedImages = listCachedImages();
    setImages(cachedImages);
  }, [refreshKey]);

  const totalSize = images.reduce((acc, img) => acc + img.size, 0);

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

  const renderItem: ListRenderItem<CachedImageInfo> = useCallback(
    ({ item }) => (
      <View style={styles.imageItem}>
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnail}
          contentFit="contain"
        />
        <View style={styles.imageInfo}>
          <Text style={styles.imageName}>{item.name}</Text>
          <Text style={styles.imageSize}>{formatBytes(item.size)}</Text>
          <Text style={styles.imagePath} selectable>
            {item.uri}
          </Text>
        </View>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.screenContainer}>
      <View style={styles.container}>
        <ScreenHeader
          title="Cached Images"
          subtitle={`${images.length} images • ${formatBytes(totalSize)}`}
          size="medium"
        />

        <View style={styles.pathContainer}>
          <Text style={styles.pathLabel}>Cache Location:</Text>
          <Text style={styles.pathValue} numberOfLines={2}>
            {getCacheDirectoryPath()}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={handleRefresh}
            style={[
              styles.button,
              { backgroundColor: theme.colors.blue.accent },
            ]}
          >
            <Text style={styles.buttonText}>Refresh</Text>
          </Button>
          <Button
            onPress={handleClearCache}
            style={[
              styles.button,
              { backgroundColor: theme.colors.red.accent },
            ]}
            disabled={images.length === 0}
          >
            <Text style={styles.buttonText}>Clear All</Text>
          </Button>
        </View>

        {images.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No cached images found</Text>
            <Text style={styles.emptySubtext}>
              Emote images will appear here after visiting a chat
            </Text>
          </View>
        ) : (
          <FlashList
            data={images}
            contentInsetAdjustmentBehavior="automatic"
            renderItem={renderItem}
            keyExtractor={item => item.uri}
            contentContainerStyle={styles.listContent}
          />
        )}
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
  pathContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.gray.bg,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  pathLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.gray.textLow,
    marginBottom: 4,
  },
  pathValue: {
    fontSize: 11,
    color: theme.colors.gray.text,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  imageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: theme.colors.gray.bg,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: theme.colors.gray.ui,
  },
  imageInfo: {
    flex: 1,
    flexShrink: 1,
    gap: 2,
  },
  imageName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.gray.text,
  },
  imageSize: {
    fontSize: 12,
    color: theme.colors.gray.textLow,
  },
  imagePath: {
    fontSize: 10,
    color: theme.colors.gray.textLow,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray.textLow,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.gray.textLow,
    textAlign: 'center',
  },
}));
