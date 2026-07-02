import { Platform } from 'react-native';
import type { Ref } from 'react';

import {
  FlashList as ShopifyFlashList,
  FlashListProps as ShopifyFlashListProps,
  FlashListRef,
  type ListRenderItem,
} from '@shopify/flash-list';

import { FlashListWithRefresh } from './FlashListWithRefresh';

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
  if (refreshControl) {
    return (
      <ShopifyFlashList ref={ref} refreshControl={refreshControl} {...props} />
    );
  }

  if (onRefresh && Platform.OS !== 'android') {
    return <FlashListWithRefresh onRefresh={onRefresh} ref={ref} {...props} />;
  }

  return <ShopifyFlashList ref={ref} {...props} />;
}
