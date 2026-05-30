import { impact, notification } from '@app/lib/haptics';
import { theme } from '@app/styles/themes';
import { useObservable, useSelector } from '@legendapp/state/react';
import { useCallback } from 'react';
import { Platform, RefreshControl as RNRefreshControl } from 'react-native';

interface Props {
  offset?: number;
  onRefresh: () => Promise<unknown>;
}

export function RefreshControl({ onRefresh, offset }: Props) {
  const refreshing$ = useObservable(false);
  const refreshing = useSelector(refreshing$);

  const tintColor = theme.colorGrass;

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void impact('medium');
    }

    refreshing$.set(true);
    await onRefresh();

    if (Platform.OS !== 'web') {
      void notification('success');
    }

    refreshing$.set(false);
  }, [onRefresh, refreshing$]);

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
