import { Image as ExpoImage, type ImageErrorEventData } from 'expo-image';
import { recordInfo } from '@app/lib/sentry';
import { View, StyleSheet } from 'react-native';
import { useMeasureImageLoadTime } from '@app/hooks/useMeasureImageLoadTime';
import {
  cacheImageFromUrl,
  getCachedImageUri,
} from '@app/utils/image/image-cache';
import { useEffect, useState, useCallback } from 'react';
import type { ImageProps } from './Image.types';

/**
 * Extract URL from various source formats
 */
function getSourceUrl(source: ImageProps['source']): string | null {
  if (typeof source === 'string') {
    return source;
  }
  if (typeof source === 'object' && 'uri' in source) {
    return source.uri;
  }
  return null;
}

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
  onError,
  onLoadEnd: onLoadEndProp,
  onLoadStart: onLoadStartProp,
  style,
  ...props
}: ImageProps) {
  const url = getSourceUrl(source);
  const shouldUseFileCache = cacheToFile && process.env.NODE_ENV !== 'test';
  const diskCachedUrl =
    url && shouldUseFileCache
      ? getCachedImageUri(url, { variant: cacheVariant })
      : null;
  const [downloadedCache, setDownloadedCache] = useState<{
    sourceUrl: string | null;
    cachedUrl: string | null;
  }>({ sourceUrl: null, cachedUrl: null });
  const downloadedCachedUrl =
    downloadedCache.sourceUrl === url ? downloadedCache.cachedUrl : null;

  const fileCachedUrl = diskCachedUrl ?? downloadedCachedUrl;
  const resolvedUrl = fileCachedUrl ?? url;
  const resolvedSource =
    fileCachedUrl && typeof source === 'object' && 'uri' in source
      ? { ...source, uri: fileCachedUrl }
      : fileCachedUrl && typeof source === 'string'
        ? fileCachedUrl
        : source;
  const trackLoad = Boolean(trackLoadTime && resolvedUrl);

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
      if (!resolvedUrl) {
        return undefined;
      }
      try {
        return new URL(resolvedUrl).hostname;
      } catch {
        return undefined;
      }
    })();

    recordInfo({
      name: 'data_loading_info',
      message: 'chat.image.load_time',
      params: {
        urlHost: safeHost ?? 'unknown',
        url: typeof source === 'string' ? source : 'uri-object',
        durationFromMountMs: Math.round(totalLoadTimeMs),
        durationFromLoadStartMs: Math.round(startToLoadTimeMs),
        imageRenderer: 'Image',
        imageContext: trackLoadContext ?? 'chat-image',
        host: safeHost,
      },
    });
  };

  const { onLoadStart, onLoadEnd } = useMeasureImageLoadTime(
    'Image',
    reportImageLoadTime,
  );

  useEffect(() => {
    if (!url || !shouldUseFileCache || diskCachedUrl) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    void cacheImageFromUrl(url, {
      priority: cachePriority,
      signal: controller.signal,
      variant: cacheVariant,
    }).then(cachedUrl => {
      if (!cancelled && cachedUrl !== url) {
        setDownloadedCache({ sourceUrl: url, cachedUrl });
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cachePriority, cacheVariant, diskCachedUrl, shouldUseFileCache, url]);

  const handleLoadStart = useCallback(() => {
    if (trackLoad) {
      onLoadStart();
    }
    onLoadStartProp?.();
  }, [onLoadStart, onLoadStartProp, trackLoad]);

  const handleLoadEnd = useCallback(() => {
    if (trackLoad) {
      onLoadEnd();
    }
    onLoadEndProp?.();
  }, [onLoadEnd, onLoadEndProp, trackLoad]);

  const handleError = (error: unknown) => {
    if (__DEV__) {
      console.warn('Image loading error:', error);
    }
    onError?.(error as ImageErrorEventData);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        {...props}
        source={resolvedSource}
        style={style}
        contentFit={contentFit}
        cachePolicy={cachePolicy}
        transition={transition}
        decodeFormat='rgb'
        recyclingKey={recyclingKey ?? resolvedUrl ?? undefined}
        useAppleWebpCodec
        placeholderContentFit={placeholderContentFit ?? 'cover'}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
