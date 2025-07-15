import {
  LegendList as BaseLegendList,
  LegendListProps as BaseLegendListProps,
  LegendListRenderItemProps as BaseLegendListRenderItemProps,
  LegendListRef as BaseLegendListRef,
} from '@legendapp/list';
import { AnimatedLegendList as BaseAnimatedLegendList } from '@legendapp/list/reanimated';
import { ReactNode, Ref, RefObject, forwardRef } from 'react';

export interface LegendListProps<TItem = unknown>
  extends BaseLegendListProps<TItem> {
  ref?: RefObject<BaseLegendListRef | null>;
}

// eslint-disable-next-line react/display-name
export const LegendList = forwardRef(
  <TItem,>(props: BaseLegendListProps<TItem>, ref: Ref<BaseLegendListRef>) => {
    return <BaseLegendList ref={ref} {...props} />;
  },
) as <TItem = unknown>(
  props: BaseLegendListProps<TItem> & { ref?: Ref<BaseLegendListRef> },
) => ReactNode;

export const AnimatedLegendList = BaseAnimatedLegendList;

export type LegendListRef = BaseLegendListRef;
export type LegendListRenderItemProps<TItem = unknown> =
  BaseLegendListRenderItemProps<TItem>;
