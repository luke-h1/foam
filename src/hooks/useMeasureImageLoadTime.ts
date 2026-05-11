import { logger } from '@app/utils/logger';
import { useCallback, useReducer, useRef } from 'react';

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

export const imageComponentsLoadingTimes: Record<
  ImageLoadLabel,
  ImageLoadTiming[]
> = {
  Image: [],
  ExpoImage: [],
  NitroImage: [],
};

export function useMeasureImageLoadTime(
  label: ImageLoadLabel,
  onLoadEndCallback?: ImageLoadTimingCallback,
  options: ImageLoadTimingOptions = {},
) {
  const imageMountTimestamp = useRef(performance.now());
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
      mountTimestamp: imageMountTimestamp.current,
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

export function resetImageComponentsLoadingTimes() {
  Object.keys(imageComponentsLoadingTimes).forEach(key => {
    imageComponentsLoadingTimes[key as ImageLoadLabel] = [];
  });
}

function getTimersData(): Record<
  ImageLoadLabel,
  {
    averageLoadTimeFromMount: number;
    averageLoadTimeFromStartLoading: number;
  }
> {
  return Object.fromEntries(
    Object.entries(imageComponentsLoadingTimes).map(([key, value]) => {
      return [
        key,
        {
          averageLoadTimeFromMount:
            value.reduce(
              (acc, curr) =>
                acc + (curr.loadEndTimestamp - curr.mountTimestamp),
              0,
            ) / value.length,
          averageLoadTimeFromStartLoading:
            value.reduce(
              (acc, curr) =>
                acc + (curr.loadEndTimestamp - curr.loadStartTimestamp),
              0,
            ) / value.length,
        },
      ];
    }),
  ) as Record<
    ImageLoadLabel,
    {
      averageLoadTimeFromMount: number;
      averageLoadTimeFromStartLoading: number;
    }
  >;
}

export function useTimersData() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const resetTimers = useCallback(() => {
    Object.keys(imageComponentsLoadingTimes).forEach(key => {
      imageComponentsLoadingTimes[key as ImageLoadLabel] = [];
    });

    // Force rerender this component
    forceUpdate();
  }, [forceUpdate]);

  return { resetTimers, timersData: getTimersData() };
}
