import { logger } from '@app/utils/logger';
import { useRef, useCallback } from 'react';

export type ImageLoadLabel = 'Image' | 'ExpoImage' | 'NitroImage';

export type ImageLoadTiming = {
  mountTimestamp: number;
  loadStartTimestamp: number;
  loadEndTimestamp: number;
};

type ImageLoadTimingOptions = {
  fallbackToMountStartOnLoadEnd?: boolean;
};

export type ImageLoadTimingCallback = (timing: ImageLoadTiming) => void;

const imageComponentsLoadingTimes: Record<ImageLoadLabel, ImageLoadTiming[]> = {
  Image: [],
  ExpoImage: [],
  NitroImage: [],
};

export function useMeasureImageLoadTime(
  label: ImageLoadLabel,
  onLoadEndCallback?: ImageLoadTimingCallback,
  options: ImageLoadTimingOptions = {},
) {
  const imageMountTimestamp = useRef<number | null>(null);
  imageMountTimestamp.current ??= performance.now();
  const imageLoadStartTimestamp = useRef<number | undefined>(undefined);

  const onLoadEnd = useCallback(() => {
    const loadStartTimestamp = imageLoadStartTimestamp.current
      ? imageLoadStartTimestamp.current
      : options.fallbackToMountStartOnLoadEnd
        ? imageMountTimestamp.current
        : undefined;

    if (!loadStartTimestamp) {
      logger.main.error('Image load start timestamp is not set');
      return;
    }

    const timing = {
      mountTimestamp: imageMountTimestamp.current ?? loadStartTimestamp,
      loadStartTimestamp,
      loadEndTimestamp: performance.now(),
    };

    imageComponentsLoadingTimes[label].push(timing);
    onLoadEndCallback?.(timing);
  }, [label, onLoadEndCallback, options.fallbackToMountStartOnLoadEnd]);

  const onLoadStart = useCallback(() => {
    imageLoadStartTimestamp.current = performance.now();
  }, []);

  return { onLoadEnd, onLoadStart };
}
