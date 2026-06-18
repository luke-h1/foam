import { Image as ExpoImage } from 'expo-image';
import { recordInfo } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';
import { useMeasureImageLoadTime } from '@app/hooks/useMeasureImageLoadTime';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  cacheImageFromUrl,
  getCachedImageUri,
} from '@app/utils/image/image-cache';
import type { ImageProps } from './Image.types';

const getSourceUri = (source: ImageProps['source']) => {
  if (typeof source === 'string') {
    return source;
  }

  if (
    typeof source === 'object' &&
    source !== null &&
    'uri' in source &&
    typeof source.uri === 'string'
  ) {
    return source.uri;
  }

  return undefined;
};

const isCacheableWebUri = (uri: string | undefined): uri is string =>
  typeof uri === 'string' && /^https?:\/\//i.test(uri);

export const Image = function Image({
  contentFit = 'cover',
  containerStyle,
  placeholderContentFit,
  transition = 500,
  source,
  cachePolicy,
  cachePriority = 'visible',
  cacheToFile = true,
  cacheVariant = 'image',
  recyclingKey,
  trackLoadTime = false,
  trackLoadContext,
  style,
  ...props
}: ImageProps) {
  const sourceUri = getSourceUri(source);
  const shouldUseFileCache = cacheToFile && process.env.NODE_ENV !== 'test';
  const trackLoad = Boolean(trackLoadTime && sourceUri);
  const diskCachedSource =
    sourceUri &&
    shouldUseFileCache &&
    isCacheableWebUri(sourceUri) &&
    cachePolicy !== 'none'
      ? (() => {
          const cachedUri = getCachedImageUri(sourceUri, {
            variant: cacheVariant,
          });
          return cachedUri ? { uri: cachedUri } : undefined;
        })()
      : undefined;
  const [downloadedCache, setDownloadedCache] = useState<{
    sourceUri: string | undefined;
    source: ImageProps['source'];
  }>({ sourceUri: undefined, source: undefined });
  const downloadedCachedSource =
    downloadedCache.sourceUri === sourceUri
      ? downloadedCache.source
      : undefined;

  const cachedSource = diskCachedSource ?? downloadedCachedSource;
  const reportImageLoadTime = (timing: {
    mountTimestamp: number;
    loadStartTimestamp: number;
    loadEndTimestamp: number;
  }) => {
    if (!trackLoad) {
      return;
    }

    const totalLoadTimeMs = timing.loadEndTimestamp - timing.mountTimestamp;
    const startToLoadTimeMs =
      timing.loadEndTimestamp - timing.loadStartTimestamp;
    const safeHost = (() => {
      if (!sourceUri) {
        return 'unknown';
      }
      try {
        return new URL(sourceUri).hostname;
      } catch {
        return 'unknown';
      }
    })();

    recordInfo({
      name: 'data_loading_info',
      message: 'chat.image.load_time',
      params: {
        urlHost: safeHost,
        url: sourceUri ?? 'unknown',
        durationFromMountMs: Math.round(totalLoadTimeMs),
        durationFromLoadStartMs: Math.round(startToLoadTimeMs),
        imageRenderer: 'Image',
        imageContext: trackLoadContext ?? 'chat-image',
        host: safeHost,
        platform: 'web',
      },
    });
  };
  const { onLoadStart, onLoadEnd } = useMeasureImageLoadTime(
    'Image',
    reportImageLoadTime,
    { fallbackToMountStartOnLoadEnd: true },
  );

  useEffect(() => {
    let isMounted = true;

    if (
      cachePolicy === 'none' ||
      !shouldUseFileCache ||
      !isCacheableWebUri(sourceUri) ||
      diskCachedSource
    ) {
      return () => {
        isMounted = false;
      };
    }

    const cacheableSourceUri = sourceUri;
    const controller = new AbortController();
    cacheImageFromUrl(cacheableSourceUri, {
      priority: cachePriority,
      signal: controller.signal,
      variant: cacheVariant,
    })
      .then(objectUrl => {
        if (!objectUrl || objectUrl === cacheableSourceUri) {
          return;
        }

        if (!isMounted) {
          globalThis.URL.revokeObjectURL(objectUrl);
          return;
        }

        setDownloadedCache({
          sourceUri: cacheableSourceUri,
          source: { uri: objectUrl },
        });
      })
      .catch(() => {
        if (isMounted) {
          setDownloadedCache({
            sourceUri: cacheableSourceUri,
            source: undefined,
          });
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    cachePolicy,
    cachePriority,
    cacheVariant,
    diskCachedSource,
    shouldUseFileCache,
    sourceUri,
  ]);

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={cachedSource ?? source}
        style={style}
        contentFit={contentFit}
        cachePolicy={cachePolicy}
        transition={transition}
        decodeFormat='rgb'
        recyclingKey={recyclingKey ?? sourceUri}
        placeholderContentFit={placeholderContentFit ?? 'cover'}
        onLoadStart={trackLoad ? onLoadStart : undefined}
        onLoadEnd={trackLoad ? onLoadEnd : undefined}
        onError={error => {
          logger.main.debug('Image loading error:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
