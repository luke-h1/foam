import { type Ref, useMemo } from 'react';
import { Platform, RefreshControl } from 'react-native';

import {
  FlashList as ShopifyFlashList,
  FlashListProps as ShopifyFlashListProps,
  FlashListRef,
  type ListRenderItem,
} from '@shopify/flash-list';

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
  const androidRefreshControl = useMemo(() => {
    if (Platform.OS === 'android' && onRefresh && !refreshControl) {
      return (
        <RefreshControl
          refreshing={Boolean(refreshing)}
          onRefresh={onRefresh}
        />
      );
    }
    return null;
  }, [onRefresh, refreshControl, refreshing]);

  return (
    <ShopifyFlashList
      ref={ref}
      refreshControl={androidRefreshControl ?? refreshControl}
      refreshing={refreshing}
      onRefresh={androidRefreshControl ? undefined : onRefresh}
      {...props}
    />
  );
}
