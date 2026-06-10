import { impact } from '@app/lib/haptics';
import { useObservable, useSelector } from '@legendapp/state/react';
import { ReactElement, useCallback } from 'react';
import { Platform, RefreshControl, RefreshControlProps } from 'react-native';
import {
  SharedValue,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export const REFRESH_THRESHOLD = 80;

function fireThresholdHaptic() {
  if (Platform.OS === 'web') {
    return;
  }
  void impact('medium');
}

interface UseRefreshOptions {
  onRefresh: () => Promise<unknown>;
}

interface UseRefreshResult {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  scrollY: SharedValue<number>;
  isRefreshing: boolean;
  refreshControl: ReactElement<RefreshControlProps>;
}

export function useRefresh({ onRefresh }: UseRefreshOptions): UseRefreshResult {
  const scrollY = useSharedValue(0);
  const isRefreshingShared = useSharedValue(false);
  const hasTriggeredHaptic = useSharedValue(false);
  const isRefreshing$ = useObservable(false);
  const isRefreshing = useSelector(isRefreshing$);

  const refreshCallback = useCallback(async () => {
    isRefreshingShared.set(true);
    isRefreshing$.set(true);
    await onRefresh();
    isRefreshingShared.set(false);
    isRefreshing$.set(false);
  }, [isRefreshing$, isRefreshingShared, onRefresh]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.set(event.contentOffset.y);

      if (
        event.contentOffset.y < -REFRESH_THRESHOLD &&
        !hasTriggeredHaptic.get() &&
        !isRefreshingShared.get()
      ) {
        hasTriggeredHaptic.set(true);
        scheduleOnRN(fireThresholdHaptic);
      }

      if (event.contentOffset.y > -REFRESH_THRESHOLD * 0.5) {
        hasTriggeredHaptic.set(false);
      }
    },
  });

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={refreshCallback}
      tintColor='transparent'
      colors={['transparent']}
      progressBackgroundColor='transparent'
      progressViewOffset={-10000}
    />
  );

  return {
    scrollHandler,
    scrollY,
    isRefreshing,
    refreshControl,
  };
}
