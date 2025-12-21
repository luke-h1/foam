import { Button } from '@app/components/Button';
import { FlashList, ListRenderItem } from '@app/components/FlashList';
import { Image } from '@app/components/Image';
import { Screen } from '@app/components/Screen';
import { ScreenHeader } from '@app/components/ScreenHeader';
import { Typography } from '@app/components/Typography';
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
          <Typography style={styles.imageName}>{item.name}</Typography>
          <Typography style={styles.imageSize}>
            {formatBytes(item.size)}
          </Typography>
          <Typography style={styles.imagePath} selectable>
            {item.uri}
          </Typography>
        </View>
      </View>
    ),
    [],
  );

  return (
    <Screen safeAreaEdges={['bottom']} preset="fixed">
      <View style={styles.container}>
        <ScreenHeader
          title="Cached Images"
          subtitle={`${images.length} images • ${formatBytes(totalSize)}`}
          size="medium"
        />

        <View style={styles.pathContainer}>
          <Typography style={styles.pathLabel}>Cache Location:</Typography>
          <Typography style={styles.pathValue} numberOfLines={2}>
            {getCacheDirectoryPath()}
          </Typography>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={handleRefresh}
            style={[
              styles.button,
              { backgroundColor: theme.colors.blue.accent },
            ]}
          >
            <Typography style={styles.buttonText}>Refresh</Typography>
          </Button>
          <Button
            onPress={handleClearCache}
            style={[
              styles.button,
              { backgroundColor: theme.colors.red.accent },
            ]}
            disabled={images.length === 0}
          >
            <Typography style={styles.buttonText}>Clear All</Typography>
          </Button>
        </View>

        {images.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>
              No cached images found
            </Typography>
            <Typography style={styles.emptySubtext}>
              Emote images will appear here after visiting a chat
            </Typography>
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
    </Screen>
  );
}

const styles = StyleSheet.create(theme => ({
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
