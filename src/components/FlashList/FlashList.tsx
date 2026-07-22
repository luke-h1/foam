import { type Ref, useMemo } from 'react';
import { Platform, RefreshControl, useColorScheme } from 'react-native';

import {
  FlashList as ShopifyFlashList,
  FlashListProps as ShopifyFlashListProps,
  FlashListRef,
  type ListRenderItem,
} from '@shopify/flash-list';

import { theme } from '@app/styles/themes';

export type { FlashListRef, ListRenderItem };

export type FlashListProps<TItem = unknown> = ShopifyFlashListProps<TItem> & {
  inverted?: boolean;
  onRefresh?: () => void | Promise<unknown>;
};

export function FlashList<TItem>({
  onRefresh,
  ref,
  refreshControl,
  refreshing = false,
  ...props
}: FlashListProps<TItem> & { ref?: Ref<FlashListRef<TItem>> }) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const androidRefreshControl = useMemo(() => {
    if (Platform.OS === 'android' && onRefresh && !refreshControl) {
      return (
        <RefreshControl
          refreshing={Boolean(refreshing)}
          onRefresh={onRefresh}
          colors={[theme.color.accent[scheme]]}
          progressBackgroundColor={theme.color.backgroundSecondary[scheme]}
        />
      );
    }
    return null;
  }, [onRefresh, refreshControl, refreshing, scheme]);

  const activeRefreshControl = androidRefreshControl ?? refreshControl;

  return (
    <ShopifyFlashList
      ref={ref}
      refreshControl={activeRefreshControl}
      refreshing={activeRefreshControl ? undefined : refreshing}
      onRefresh={activeRefreshControl ? undefined : onRefresh}
      {...props}
    />
  );
}
