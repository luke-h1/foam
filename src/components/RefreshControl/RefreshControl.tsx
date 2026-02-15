import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { Platform, RefreshControl as RNRefreshControl } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

interface Props {
  offset?: number;
  onRefresh: () => Promise<unknown>;
}

export function RefreshControl({ onRefresh, offset }: Props) {
  const { theme } = useUnistyles();
  const [refreshing, setRefreshing] = useState(false);

  const tintColor = theme.colors.grass.accent;

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setRefreshing(true);
    await onRefresh();

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setRefreshing(false);
  }, [onRefresh]);

  return (
    <RNRefreshControl
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onRefresh={refresh}
      progressViewOffset={offset}
      refreshing={refreshing}
      tintColor={tintColor}
      colors={[tintColor]}
      progressBackgroundColor={theme.colors.gray.ui}
      title={refreshing ? 'Updating...' : ''}
      titleColor={theme.colors.gray.textLow}
    />
  );
}
