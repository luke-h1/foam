import { useSyncExternalStore } from 'react';

import type { SkImage } from '@shopify/react-native-skia';

import {
  getSharedPaintFrame,
  isSharedPaintReady,
  subscribeSharedPaintFrames,
  subscribeSharedPaintReady,
} from './sharedPaintAnimationStore';

const noopSubscription = () => () => {};

export function useSharedPaintAnimationFrame(url: string): SkImage | null {
  return useSyncExternalStore(
    url
      ? listener => subscribeSharedPaintFrames([url], listener)
      : noopSubscription,
    () => (url ? getSharedPaintFrame(url) : null),
    () => null,
  );
}

export function useSharedPaintAnimationReady(url: string): boolean {
  return useSyncExternalStore(
    url
      ? listener => subscribeSharedPaintReady(url, listener)
      : noopSubscription,
    () => (url ? isSharedPaintReady(url) : true),
    () => !url,
  );
}
