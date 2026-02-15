import {
  FlashList as ShopifyFlashList,
  FlashListProps as ShopifyFlashListProps,
  FlashListRef,
  ListRenderItem as FlashListRenderItem,
} from '@shopify/flash-list';
import { ReactNode, Ref, forwardRef } from 'react';
import Animated from 'react-native-reanimated';

export type { FlashListRef };

export type FlashListProps<TItem = unknown> = ShopifyFlashListProps<TItem> & {
  inverted?: boolean;
};

// eslint-disable-next-line react/display-name
export const FlashList = forwardRef(
  <TItem,>(props: FlashListProps<TItem>, ref: Ref<FlashListRef<TItem>>) => {
    return <ShopifyFlashList ref={ref} {...props} />;
  },
) as <TItem = unknown>(
  props: FlashListProps<TItem> & { ref?: Ref<FlashListRef<TItem>> },
) => ReactNode;

export const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList,
) as <TItem = unknown>(props: ShopifyFlashListProps<TItem>) => ReactNode;

// Export ListRenderItem type
export type ListRenderItem<TItem = unknown> = FlashListRenderItem<TItem>;
