import {
  FlashList as ShopifyFlashList,
  FlashListProps as ShopifyFlashListProps,
  ListRenderItem as FlashListRenderItem,
} from '@shopify/flash-list';
import { ReactNode, Ref, RefObject, forwardRef } from 'react';
import Animated from 'react-native-reanimated';

export interface FlashListProps<TItem = unknown>
  extends ShopifyFlashListProps<TItem> {
  ref?: RefObject<ShopifyFlashList<TItem> | null>;
}

// eslint-disable-next-line react/display-name
export const FlashList = forwardRef(
  <TItem,>(
    props: ShopifyFlashListProps<TItem>,
    ref: Ref<ShopifyFlashList<TItem>>,
  ) => {
    return <ShopifyFlashList ref={ref} {...props} />;
  },
) as <TItem = unknown>(
  props: ShopifyFlashListProps<TItem> & { ref?: Ref<ShopifyFlashList<TItem>> },
) => ReactNode;

export const AnimatedFlashList = Animated.createAnimatedComponent<
  ShopifyFlashListProps<unknown>
>(FlashList) as <TItem = unknown>(
  props: ShopifyFlashListProps<TItem>,
) => ReactNode;

export type FlashList<TItem = unknown> = ShopifyFlashList<TItem>;
export type ListRenderItem<TItem = unknown> = FlashListRenderItem<TItem>;
