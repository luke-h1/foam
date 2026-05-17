import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ScrollViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabOverflow } from '../TabBarBackground/TabBarBackground';

export const BodyScrollView = forwardRef<Animated.ScrollView, ScrollViewProps>(
  (
    {
      contentInset,
      contentInsetAdjustmentBehavior = 'never',
      scrollIndicatorInsets,
      style,
      ...props
    },
    ref,
  ) => {
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
  },
);

BodyScrollView.displayName = 'BodyScrollView';
