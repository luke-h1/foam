import {
  FlashList as ShopifyFlashList,
  FlashListRef,
} from '@shopify/flash-list';
import type { Ref } from 'react';
import type { FlashListProps } from './FlashList';

export function FlashListWithRefresh<TItem>({
  onRefresh,
  ref,
  ...props
}: FlashListProps<TItem> & { ref?: Ref<FlashListRef<TItem>> }) {
  return <ShopifyFlashList ref={ref} onRefresh={onRefresh} {...props} />;
}
