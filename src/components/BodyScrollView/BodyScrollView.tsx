import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { forwardRef } from 'react';
import { ScrollViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabOverflow } from '../TabBarBackground';

export const BodyScrollView = forwardRef<Animated.ScrollView, ScrollViewProps>(
  (props, ref) => {
    const paddingBottom = useBottomTabOverflow();

    const { top: statusBarInset, bottom } = useSafeAreaInsets(); // inset of the status bar

    const largeHeaderInset = statusBarInset + 92; // inset to use for a large header since it's frame is equal to 96 + the frame of status bar

    useScrollToTop(ref, -largeHeaderInset);

    return (
      <Animated.ScrollView
        ref={ref}
        scrollToOverflowEnabled
        contentInsetAdjustmentBehavior="automatic"
        contentInset={{ bottom: paddingBottom }}
        scrollIndicatorInsets={{
          bottom: paddingBottom - (process.env.EXPO_OS === 'ios' ? bottom : 0),
        }}
        {...props}
        style={[{}, props.style]}
      />
    );
  },
);

BodyScrollView.displayName = 'BodyScrollView';
