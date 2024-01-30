import React, {
  ElementType,
  forwardRef,
  PropsWithChildren,
  useMemo,
} from 'react';
import { FlatList, FlatListProps, LayoutChangeEvent, View } from 'react-native';
import Animated, { ILayoutAnimationBuilder } from 'react-native-reanimated';

const ReanimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedView = Animated.createAnimatedComponent(View);

const createCellRenderer = (
  itemLayoutAnimation?: ILayoutAnimationBuilder,
): React.FC<
  PropsWithChildren<{
    onLayout: (event: LayoutChangeEvent) => void;
  }>
> => {
  const cellRenderer: React.FC<
    PropsWithChildren<{
      onLayout: (event: LayoutChangeEvent) => void;
    }>
  > = props => {
    return (
      <AnimatedView
        layout={itemLayoutAnimation as never}
        onLayout={props.onLayout}
      >
        {props.children}
      </AnimatedView>
    );
  };

  return cellRenderer;
};

interface ReanimatedFlatlistProps<T> extends FlatListProps<T> {
  itemLayoutAnimation?: ILayoutAnimationBuilder;
  FlatListComponent?: FlatList;
}
/**
 * re-create Reanimated FlatList but correctly pass on forwardRef in order to use scrollTo to scroll to the next page in our horizontal FlatList
 *
 * Source: https://github.com/software-mansion/react-native-reanimated/blob/main/src/reanimated2/component/FlatList.tsx
 * TODO _ remove this and use Animated.FlatList directly and call useRefs with it
 */
export const AnimatedFlatList = forwardRef<
  Animated.FlatList<ElementType>,
  ReanimatedFlatlistProps<ElementType>
>(function _AnimatedFlatList(
  { itemLayoutAnimation, FlatListComponent = ReanimatedFlatList, ...restProps },
  ref,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cellRenderer = useMemo(
    () => createCellRenderer(itemLayoutAnimation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    <FlatListComponent
      ref={ref}
      {...restProps}
      CellRendererComponent={cellRenderer}
    />
  );
});
