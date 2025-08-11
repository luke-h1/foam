import { ThemeColor } from '@app/styles';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { RefreshControl as RNRefreshControl } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

interface Props {
  color?: ThemeColor;
  offset?: number;
  onRefresh: () => Promise<unknown>;
}

export function RefreshControl({ onRefresh, color = 'blue', offset }: Props) {
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { theme } = useUnistyles();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    setRefreshing(false);
  }, [onRefresh]);

  return (
    <RNRefreshControl
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onRefresh={refresh}
      progressViewOffset={offset}
      refreshing={refreshing}
      // tintColor={theme.colors[color]}
    />
  );
}
