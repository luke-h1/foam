import { useCallback } from 'react';
import { impact } from '@app/lib/haptics';
import { theme } from '@app/styles/themes';
import { useObservable, useSelector } from '@legendapp/state/react';
import { Platform, RefreshControl as RNRefreshControl } from 'react-native';

interface Props {
  offset?: number;
  onRefresh: () => Promise<unknown>;
}

export function RefreshControl({ onRefresh, offset }: Props) {
  const refreshing$ = useObservable(false);
  const refreshing = useSelector(refreshing$);

  const tintColor = theme.colorPrimary;

  const refresh = useCallback(async () => {
    // One light impact when the refresh engages; completing a routine
    // refresh is not an event worth a second buzz.
    if (Platform.OS !== 'web') {
      void impact('light');
    }

    refreshing$.set(true);
    await onRefresh();
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
