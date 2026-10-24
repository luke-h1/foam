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

interface ResolveBodyScrollInsetsOptions {
  bottom: number;
  contentInset: ScrollViewProps['contentInset'];
  left: number;
  paddingBottom: number;
  right: number;
  scrollIndicatorInsets: ScrollViewProps['scrollIndicatorInsets'];
  usesNativeScrollView: boolean;
}

function resolveBodyScrollInsets({
  bottom,
  contentInset,
  left,
  paddingBottom,
  right,
  scrollIndicatorInsets,
  usesNativeScrollView,
}: ResolveBodyScrollInsetsOptions): Pick<
  ScrollViewProps,
  'contentInset' | 'scrollIndicatorInsets'
> {
  const mergeContentSide = (
    callerSide: number | undefined,
    safeSide: number,
  ): number | undefined => {
    if (usesNativeScrollView) {
      return callerSide;
    }

    if (callerSide == null && safeSide === 0) {
      return undefined;
    }

    return (callerSide ?? 0) + safeSide;
  };

  const contentLeft = mergeContentSide(contentInset?.left, left);
  const contentRight = mergeContentSide(contentInset?.right, right);
  const indicatorLeft = usesNativeScrollView
    ? scrollIndicatorInsets?.left
    : mergeContentSide(scrollIndicatorInsets?.left, left);
  const indicatorRight = usesNativeScrollView
    ? scrollIndicatorInsets?.right
    : mergeContentSide(scrollIndicatorInsets?.right, right);
  const indicatorBottom =
    paddingBottom - (process.env.EXPO_OS === 'ios' ? bottom : 0);

  return {
    contentInset: {
      ...(contentInset ?? {}),
      ...(contentLeft !== undefined ? { left: contentLeft } : null),
      ...(contentRight !== undefined ? { right: contentRight } : null),
      bottom: paddingBottom,
    },
    scrollIndicatorInsets: {
      ...(scrollIndicatorInsets ?? {}),
      ...(indicatorLeft !== undefined ? { left: indicatorLeft } : null),
      ...(indicatorRight !== undefined ? { right: indicatorRight } : null),
      bottom: indicatorBottom,
    },
  };
}

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

  const insets = resolveBodyScrollInsets({
    bottom,
    contentInset,
    left,
    paddingBottom,
    right,
    scrollIndicatorInsets,
    usesNativeScrollView,
  });

  const sharedProps: ScrollViewProps = {
    scrollToOverflowEnabled: true,
    contentInsetAdjustmentBehavior,
    ...insets,
    ...props,
    style: [{}, style],
  };

  if (usesNativeScrollView) {
    return <ScrollView ref={nativeScrollRef} {...sharedProps} />;
  }

  return <Animated.ScrollView ref={animatedScrollRef} {...sharedProps} />;
}
