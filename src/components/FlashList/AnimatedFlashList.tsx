import {
  FlashListRef,
  ListRenderItem as FlashListRenderItem,
} from '@shopify/flash-list';
import { ReactNode, type Ref } from 'react';
import Animated from 'react-native-reanimated';
import { FlashList, type FlashListProps } from './FlashList';

export type ListRenderItem<TItem = unknown> = FlashListRenderItem<TItem>;

export const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList,
) as <TItem = unknown>(
  props: FlashListProps<TItem> & { ref?: Ref<FlashListRef<TItem>> },
) => ReactNode;
