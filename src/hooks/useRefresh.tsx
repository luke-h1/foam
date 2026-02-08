import * as Haptics from 'expo-haptics';
import { ReactElement, useCallback, useState } from 'react';
import { Platform, RefreshControl, RefreshControlProps } from 'react-native';
import {
  runOnJS,
  SharedValue,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

export const REFRESH_THRESHOLD = 80;

function fireThresholdHaptic() {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

function fireCompleteHaptic() {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    isRefreshingShared.value = true;
    setIsRefreshing(true);
    await onRefresh();
    fireCompleteHaptic();
    isRefreshingShared.value = false;
    setIsRefreshing(false);
  }, [onRefresh, isRefreshingShared]);

  const refreshCallback = useCallback(() => {
    void handleRefresh();
  }, [handleRefresh]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;

      if (
        event.contentOffset.y < -REFRESH_THRESHOLD &&
        !hasTriggeredHaptic.value &&
        !isRefreshingShared.value
      ) {
        hasTriggeredHaptic.value = true;
        runOnJS(fireThresholdHaptic)();
      }

      if (event.contentOffset.y > -REFRESH_THRESHOLD * 0.5) {
        hasTriggeredHaptic.value = false;
      }
    },
  });

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={refreshCallback}
      tintColor="transparent"
      colors={['transparent']}
      progressBackgroundColor="transparent"
    />
  );

  return {
    scrollHandler,
    scrollY,
    isRefreshing,
    refreshControl,
  };
}
