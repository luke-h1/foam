import { type Ref, useImperativeHandle, useRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScrollToTop } from '@app/hooks/useScrollToTop';

import { useBottomTabOverflow } from '../TabBarBackground/useBottomTabOverflow';

type BodyScrollViewRef = ScrollView | Animated.ScrollView;

export function BodyScrollView({
  contentInset,
  contentInsetAdjustmentBehavior = 'never',
  scrollIndicatorInsets,
  style,
  ref,
  ...props
}: ScrollViewProps & { ref?: Ref<BodyScrollViewRef> }) {
  const animatedScrollRef = useRef<Animated.ScrollView>(null);
  const nativeScrollRef = useRef<ScrollView>(null);
  const paddingBottom = useBottomTabOverflow();

  const { top: statusBarInset, bottom } = useSafeAreaInsets();

  const largeHeaderInset = statusBarInset + 92;

  const usesNativeScrollView =
    process.env.EXPO_OS === 'ios' &&
    contentInsetAdjustmentBehavior === 'automatic';

  const scrollRef = usesNativeScrollView ? nativeScrollRef : animatedScrollRef;

  useImperativeHandle(ref, () => scrollRef.current as BodyScrollViewRef);
  useScrollToTop(scrollRef, -largeHeaderInset);

  const sharedProps: ScrollViewProps = {
    scrollToOverflowEnabled: true,
    contentInsetAdjustmentBehavior,
    contentInset: { ...(contentInset ?? {}), bottom: paddingBottom },
    scrollIndicatorInsets: {
      ...(scrollIndicatorInsets ?? {}),
      bottom: paddingBottom - (process.env.EXPO_OS === 'ios' ? bottom : 0),
    },
    ...props,
    style: [{}, style],
  };

  if (usesNativeScrollView) {
    return <ScrollView ref={nativeScrollRef} {...sharedProps} />;
  }

  return <Animated.ScrollView ref={animatedScrollRef} {...sharedProps} />;
}
