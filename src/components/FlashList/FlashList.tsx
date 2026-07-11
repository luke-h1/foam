import { Platform } from 'react-native';
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
  ...props
}: FlashListProps<TItem> & { ref?: Ref<FlashListRef<TItem>> }) {
  return (
    <ShopifyFlashList
      ref={ref}
      refreshControl={refreshControl}
      onRefresh={
        !refreshControl && Platform.OS !== 'android' ? onRefresh : undefined
      }
      {...props}
    />
  );
}
