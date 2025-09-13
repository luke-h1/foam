import {
  FlashList as ShopifyFlashList,
  FlashListProps as ShopifyFlashListProps,
  FlashListRef,
  ListRenderItem as FlashListRenderItem,
} from '@shopify/flash-list';
import { ReactNode, Ref, RefObject, forwardRef } from 'react';
import Animated from 'react-native-reanimated';

export interface FlashListProps<TItem = unknown>
  extends ShopifyFlashListProps<TItem> {
  ref?: RefObject<FlashListRef<TItem> | null>;
}

// eslint-disable-next-line react/display-name
export const FlashList = forwardRef(
  <TItem,>(
    props: ShopifyFlashListProps<TItem>,
    ref: Ref<FlashListRef<TItem>>,
  ) => {
    return <ShopifyFlashList ref={ref} {...props} />;
  },
) as <TItem = unknown>(
  props: ShopifyFlashListProps<TItem> & { ref?: Ref<FlashListRef<TItem>> },
) => ReactNode;

export const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList,
) as <TItem = unknown>(props: ShopifyFlashListProps<TItem>) => ReactNode;

export type FlashList = typeof ShopifyFlashList;
export type ListRenderItem<TItem = unknown> = FlashListRenderItem<TItem>;
