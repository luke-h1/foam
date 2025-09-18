import { logger } from '@app/utils/logger';
import { useCallback, useReducer, useRef } from 'react';

export const imageComponentsLoadingTimes: Record<
  'Image' | 'ExpoImage',
  {
    mountTimestamp: number;
    loadStartTimestamp: number;
    loadEndTimestamp: number;
  }[]
> = {
  Image: [],
  ExpoImage: [],
};

export function useMeasureImageLoadTime(label: 'Image' | 'ExpoImage') {
  const imageMountTimestamp = useRef(performance.now());
  const imageLoadStartTimestamp = useRef<number | undefined>(undefined);

  const onLoadEnd = useCallback(() => {
    if (!imageLoadStartTimestamp.current) {
      logger.main.error('Image load start timestamp is not set');
      return;
    }

    imageComponentsLoadingTimes[label].push({
      mountTimestamp: imageMountTimestamp.current,
      loadStartTimestamp: imageLoadStartTimestamp.current,
      loadEndTimestamp: performance.now(),
    });
  }, [label]);

  const onLoadStart = useCallback(() => {
    imageLoadStartTimestamp.current = performance.now();
  }, []);

  return { onLoadEnd, onLoadStart };
}

export function resetImageComponentsLoadingTimes() {
  Object.keys(imageComponentsLoadingTimes).forEach(key => {
    imageComponentsLoadingTimes[key as 'Image' | 'ExpoImage'] = [];
  });
}

function getTimersData(): Record<
  'Image' | 'ExpoImage',
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
    'Image' | 'ExpoImage',
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
      imageComponentsLoadingTimes[key as 'Image' | 'ExpoImage'] = [];
    });

    // Force rerender this component
    forceUpdate();
  }, [forceUpdate]);

  return { resetTimers, timersData: getTimersData() };
}
