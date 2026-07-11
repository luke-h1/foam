import { useCallback, useSyncExternalStore } from 'react';

import { Skia, type SkImage } from '@shopify/react-native-skia';

import { logger } from '@app/utils/logger';

/**
 * Shared decode cache for tiled paint textures. Skia's `useImage` decodes per
 * instance; this shares one decode per URL across rows. Failed URLs are
 * negative-cached for `NEGATIVE_RETRY_DELAY_MS` so a broken paint does not
 * retry on every render.
 */
const MAX_TILED_PAINT_IMAGES = 24;
const NEGATIVE_RETRY_DELAY_MS = 60_000;

const imagesByUrl = new Map<string, SkImage | null>();
const failedAtByUrl = new Map<string, number>();
const pendingUrls = new Set<string>();
const listenersByUrl = new Map<string, Set<() => void>>();

function notify(url: string): void {
  listenersByUrl.get(url)?.forEach(listener => listener());
}

function evictIfNeeded(): void {
  if (imagesByUrl.size < MAX_TILED_PAINT_IMAGES) {
    return;
  }
  for (const oldest of imagesByUrl.keys()) {
    if (!listenersByUrl.get(oldest)?.size) {
      imagesByUrl.delete(oldest);
      failedAtByUrl.delete(oldest);
      return;
    }
  }
  const first = imagesByUrl.keys().next().value;
  if (first !== undefined) {
    imagesByUrl.delete(first);
    failedAtByUrl.delete(first);
  }
}

function loadImage(url: string): void {
  if (!url || pendingUrls.has(url)) {
    return;
  }
  if (imagesByUrl.has(url)) {
    const failedAt = failedAtByUrl.get(url);
    if (
      failedAt === undefined ||
      Date.now() - failedAt < NEGATIVE_RETRY_DELAY_MS
    ) {
      return;
    }
    imagesByUrl.delete(url);
    failedAtByUrl.delete(url);
  }

  pendingUrls.add(url);
  Skia.Data.fromURI(url)
    .then(data => {
      const image = Skia.Image.MakeImageFromEncoded(data);
      data.dispose();
      pendingUrls.delete(url);
      evictIfNeeded();
      imagesByUrl.set(url, image);
      if (image) {
        failedAtByUrl.delete(url);
      } else {
        failedAtByUrl.set(url, Date.now());
      }
      notify(url);
    })
    .catch(error => {
      pendingUrls.delete(url);
      evictIfNeeded();
      imagesByUrl.set(url, null);
      failedAtByUrl.set(url, Date.now());
      notify(url);
      logger.chat.warn('Failed to load tiled paint texture:', { url, error });
    });
}

function subscribe(url: string, listener: () => void): () => void {
  let listeners = listenersByUrl.get(url);
  if (!listeners) {
    listeners = new Set();
    listenersByUrl.set(url, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      listenersByUrl.delete(url);
    }
  };
}

export function useTiledPaintImage(url: string): SkImage | null {
  const subscribeToUrl = useCallback(
    (listener: () => void) => subscribe(url, listener),
    [url],
  );
  const image = useSyncExternalStore(
    subscribeToUrl,
    () => imagesByUrl.get(url) ?? null,
  );
  if (!image) {
    loadImage(url);
  }
  return image;
}
