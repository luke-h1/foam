import { type Ref, useImperativeHandle, useRef } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  type ScrollViewProps,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomTabOverflow } from '@app/hooks/use-bottom-tab-overflow';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';

type BodyScrollViewRef = ScrollViewInstance;

export function BodyScrollView({
  contentInset,
  contentInsetAdjustmentBehavior = 'never',
  scrollIndicatorInsets,
  style,
  ref,
  ...props
}: ScrollViewProps & { ref?: Ref<BodyScrollViewRef> }) {
  const animatedScrollRef = useRef<ScrollViewInstance>(null);
  const nativeScrollRef = useRef<ScrollViewInstance>(null);
  const paddingBottom = useBottomTabOverflow();

  const { top: statusBarInset, bottom, left, right } = useSafeAreaInsets();

  const largeHeaderInset = statusBarInset + 92;

  const usesNativeScrollView =
    process.env.EXPO_OS === 'ios' &&
    contentInsetAdjustmentBehavior === 'automatic';

  const scrollRef = usesNativeScrollView ? nativeScrollRef : animatedScrollRef;

  // SAFETY: the handle is built during commit, after the active scroll ref is attached.
  useImperativeHandle(ref, () => scrollRef.current as BodyScrollViewRef);

  useScrollToTop(scrollRef, -largeHeaderInset);

  // When automatic inset adjustment is on, keep caller left/right; otherwise add Duo/rail insets.
  const contentLeft = usesNativeScrollView
    ? contentInset?.left
    : (contentInset?.left ?? 0) + left;
  const contentRight = usesNativeScrollView
    ? contentInset?.right
    : (contentInset?.right ?? 0) + right;
  const indicatorBottom =
    paddingBottom - (process.env.EXPO_OS === 'ios' ? bottom : 0);

  const sharedProps: ScrollViewProps = {
    scrollToOverflowEnabled: true,
    contentInsetAdjustmentBehavior,
    contentInset: {
      ...(contentInset ?? {}),
      ...(contentLeft !== undefined ? { left: contentLeft } : null),
      ...(contentRight !== undefined ? { right: contentRight } : null),
      bottom: paddingBottom,
    },
    scrollIndicatorInsets: {
      ...(scrollIndicatorInsets ?? {}),
      ...(usesNativeScrollView
        ? null
        : {
            left: (scrollIndicatorInsets?.left ?? 0) + left,
            right: (scrollIndicatorInsets?.right ?? 0) + right,
          }),
      bottom: indicatorBottom,
    },
    ...props,
    style: [{}, style],
  };

  if (usesNativeScrollView) {
    return <ScrollView ref={nativeScrollRef} {...sharedProps} />;
  }

  return <Animated.ScrollView ref={animatedScrollRef} {...sharedProps} />;
}
