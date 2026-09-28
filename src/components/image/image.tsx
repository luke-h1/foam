import { StyleSheet, View } from 'react-native';

import {
  Image as ExpoImage,
  type ImageErrorEventData,
  type ImageLoadEventData,
} from 'expo-image';

import { logger } from '@app/utils/logger';

import { useFileCachedSource } from './hooks/use-file-cached-source';
import type { ImageProps } from './image.types';

type ImageSourceDescriptor =
  | { kind: 'none' }
  | { kind: 'module' }
  | { kind: 'remote'; url: string }
  | { kind: 'uriObject'; url: string; source: { uri: string } };

function isUriObjectSource(
  source: NonNullable<ImageProps['source']>,
): source is { uri: string } {
  return Object.prototype.hasOwnProperty.call(source, 'uri');
}

function isModuleSource(
  source: NonNullable<ImageProps['source']>,
): source is number {
  return Number.isInteger(source);
}

function describeSource(source: ImageProps['source']): ImageSourceDescriptor {
  if (source === undefined) {
    return { kind: 'none' };
  }

  if (isUriObjectSource(source)) {
    return { kind: 'uriObject', url: source.uri, source };
  }

  if (isModuleSource(source)) {
    return { kind: 'module' };
  }

  return { kind: 'remote', url: source };
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
  cacheToFile = true,
  cacheVariant = 'image',
  recyclingKey,
  trackLoadContext,
  onError,
  onLoadEnd,
  onLoadStart,
  style,
  useAppleWebpCodec = false,
  ...props
}: ImageProps) {
  const descriptor = describeSource(source);

  const {
    fileCachedUrl,
    loadedRemoteUrlRef,
    resolvedSource,
    resolvedUrl,
    shouldUseFileCache,
    url,
  } = useFileCachedSource({
    cacheToFile,
    cacheVariant,
    descriptor,
    source,
  });

  /**
   * When our file cache handles persistence, keep expo-image to memory
   * caching - otherwise the same bytes land on disk twice.
   */
  const resolvedCachePolicy =
    cachePolicy ?? (shouldUseFileCache ? 'memory' : undefined);

  const handleLoad = (event: ImageLoadEventData) => {
    if (!fileCachedUrl) {
      loadedRemoteUrlRef.current = url ?? null;
    }
    props.onLoad?.(event);
  };

  const handleError = (event: ImageErrorEventData) => {
    const host = getHostname(resolvedUrl);

    logger.main.warn('image.load_failed', {
      name: 'data_loading_warning',
      error: event?.error,
      url: descriptor.kind === 'remote' ? descriptor.url : 'uri-object',
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
        cachePolicy={resolvedCachePolicy}
        transition={transition}
        decodeFormat='rgb'
        /**
         * Keyed on the ORIGINAL url - the resolved url flipped recycling
         * identity when the disk-cache swap landed.
         */
        recyclingKey={recyclingKey ?? url ?? undefined}
        useAppleWebpCodec={useAppleWebpCodec}
        placeholderContentFit={placeholderContentFit ?? 'cover'}
        onLoad={handleLoad}
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
