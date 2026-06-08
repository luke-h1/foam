import {
  FlashList as ShopifyFlashList,
  FlashListProps as ShopifyFlashListProps,
  FlashListRef,
} from '@shopify/flash-list';
import type { Ref } from 'react';
import { Platform } from 'react-native';
import { FlashListWithRefresh } from './FlashListWithRefresh';

export type { FlashListRef };

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

export { type ListRenderItem } from '@shopify/flash-list';
