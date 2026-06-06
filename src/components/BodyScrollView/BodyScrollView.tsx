import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { useImperativeHandle, useRef, type Ref } from 'react';
import { ScrollViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabOverflow } from '../TabBarBackground/useBottomTabOverflow';

export function BodyScrollView({
  contentInset,
  contentInsetAdjustmentBehavior = 'never',
  scrollIndicatorInsets,
  style,
  ref,
  ...props
}: ScrollViewProps & { ref?: Ref<Animated.ScrollView> }) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const paddingBottom = useBottomTabOverflow();

  const { top: statusBarInset, bottom } = useSafeAreaInsets(); // inset of the status bar

  const largeHeaderInset = statusBarInset + 92; // inset to use for a large header since it's frame is equal to 96 + the frame of status bar

  useImperativeHandle(ref, () => scrollRef.current as Animated.ScrollView);
  useScrollToTop(scrollRef, -largeHeaderInset);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      scrollToOverflowEnabled
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      contentInset={{ ...(contentInset ?? {}), bottom: paddingBottom }}
      scrollIndicatorInsets={{
        ...(scrollIndicatorInsets ?? {}),
        bottom: paddingBottom - (process.env.EXPO_OS === 'ios' ? bottom : 0),
      }}
      {...props}
      style={[{}, style]}
    />
  );
}
