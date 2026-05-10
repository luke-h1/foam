import { impact, notification } from '@app/services/haptics-service';
import { theme } from '@app/styles/themes';
import { useCallback, useState } from 'react';
import { Platform, RefreshControl as RNRefreshControl } from 'react-native';

interface Props {
  offset?: number;
  onRefresh: () => Promise<unknown>;
}

export function RefreshControl({ onRefresh, offset }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const tintColor = theme.colorGrass;

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void impact('medium');
    }

    setRefreshing(true);
    await onRefresh();

    if (Platform.OS !== 'web') {
      void notification('success');
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
      progressBackgroundColor={theme.color.backgroundSecondary.dark}
      title={refreshing ? 'Updating...' : ''}
      titleColor={theme.color.textSecondary.dark}
    />
  );
}
