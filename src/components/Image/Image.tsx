import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Image as ExpoImage, type ImageErrorEventData } from 'expo-image';

import {
  cacheImageFromUrl,
  getCachedImageUri,
} from '@app/utils/image/image-cache';
import { logger } from '@app/utils/logger';

import type { ImageProps } from './Image.types';

function getSourceUrl(source: ImageProps['source']): string | null {
  if (typeof source === 'string') {
    return source;
  }
  if (typeof source === 'object' && 'uri' in source) {
    return source.uri;
  }
  return null;
}

function getHostname(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
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
  trackLoadContext,
  onError,
  onLoadEnd,
  onLoadStart,
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

  const handleError = (event: ImageErrorEventData) => {
    const host = getHostname(resolvedUrl);
    logger.main.warn('image.load_failed', {
      name: 'data_loading_warning',
      error: event?.error,
      url: typeof source === 'string' ? source : 'uri-object',
      urlHost: host ?? 'unknown',
      host,
      fromFileCache: Boolean(fileCachedUrl),
      imageRenderer: 'Image',
      imageContext: trackLoadContext ?? 'chat-image',
      tags: {
        image_renderer: 'Image',
        image_context: trackLoadContext ?? 'chat-image',
        image_host: host ?? 'unknown',
      },
    });
    onError?.(event);
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
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
