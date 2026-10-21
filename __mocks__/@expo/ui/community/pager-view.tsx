import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
// eslint-disable-next-line no-restricted-imports
import { Pressable, View, type ViewProps } from 'react-native';

import type {
  PagerViewOnPageSelectedEvent,
  PagerViewProps,
  PagerViewRef,
} from '@expo/ui/community/pager-view';

interface MockPagerViewProps extends Omit<PagerViewProps, 'ref'> {
  ref?: Ref<PagerViewRef>;
  testID?: ViewProps['testID'];
}

export function PagerView({
  children,
  initialPage = 0,
  onPageSelected,
  ref,
  style,
  testID = 'pager-view',
}: MockPagerViewProps) {
  const pages = Children.toArray(children).filter(
    (child): child is ReactElement => isValidElement(child),
  );
  const [page, setPage] = useState(initialPage);
  const pageRef = useRef(page);
  pageRef.current = page;

  const goTo = (next: number) => {
    if (next < 0 || next >= pages.length || next === pageRef.current) {
      return;
    }

    pageRef.current = next;
    setPage(next);
    onPageSelected?.({
      nativeEvent: { position: next },
    } as PagerViewOnPageSelectedEvent);
  };

  useImperativeHandle(ref, () => ({
    setPage: goTo,
    setPageWithoutAnimation: goTo,
    setScrollEnabled: () => undefined,
  }));

  return (
    <View style={style} testID={testID}>
      {pages.map((pageElement, pageIndex) => (
        <View
          key={pageElement.key ?? pageIndex}
          style={pageIndex === page ? undefined : { display: 'none' }}
        >
          {pageElement as ReactNode}
        </View>
      ))}
      <Pressable
        accessibilityRole='button'
        onPress={() => goTo(page + 1)}
        testID='pager-swipe-next'
      />
      <Pressable
        accessibilityRole='button'
        onPress={() => goTo(page - 1)}
        testID='pager-swipe-prev'
      />
    </View>
  );
}

export default PagerView;
