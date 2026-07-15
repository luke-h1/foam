import { Platform, RefreshControl } from 'react-native';
import type { Ref } from 'react';

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
  const usesAndroidRefreshControl =
    Platform.OS === 'android' && onRefresh && !refreshControl;

  return (
    <ShopifyFlashList
      ref={ref}
      refreshControl={
        usesAndroidRefreshControl ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
          />
        ) : (
          refreshControl
        )
      }
      refreshing={refreshing}
      onRefresh={usesAndroidRefreshControl ? undefined : onRefresh}
      {...props}
    />
  );
}
