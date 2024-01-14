import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics';
import { useCallback, useMemo, useRef } from 'react';
import { GestureResponderEvent } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { usePropsAndStyle } from 'tamagui';
import { withAnimated } from '../../hocs/withAnimated';
import { defaultHitslopInset } from '../../styles';
import { AnimatedTouchableBox, TouchableBoxProps } from './TouchableBox';

/**
 * @link https://github.com/satya164/react-native-tab-view/issues/1241#issuecomment-1022400366
 * @returns true if press was after a drag gesture
 */
function isDrag(
  activationX: number,
  activationY: number,
  releaseX: number,
  releaseY: number,
  threshold = 2,
): boolean {
  const absX = Math.abs(activationX - releaseX);
  const absY = Math.abs(activationY - releaseY);

  const dragged = absX > threshold || absY > threshold;

  return dragged;
}

const ScaleTimingConfigIn = { duration: 50, easing: Easing.ease };
const ScaleTimingConfigOut = { duration: 75, easing: Easing.ease };

/**
 * This component wraps children in a TouchableBox. If you're trying to implement a standard button
 * *do not* use this component. Instead, use the button component directly with the desired size and emphasis. Examples of when to use this are:
 *   - clickable text
 *   - clickable icons
 *   - custom elements that are clickable (i.e. rows, cards, headers etc.)
 */

export type TouchableAreaProps = TouchableBoxProps & {
  hapticFeedback?: boolean;
  hapticStyle?: ImpactFeedbackStyle;
  ignoreDragEvents?: boolean;
  scaleTo?: number;
  disabled?: boolean;
};

export function TouchableArea({
  hapticFeedback = false,
  ignoreDragEvents = false,
  hapticStyle,
  scaleTo,
  onPress,
  children,
  testID,
  activeOpacity = 0.75,
  hitSlop,
  disabled,
  ...props
}: TouchableAreaProps) {
  const [rest, style] = usePropsAndStyle(props);

  const touchActivationPositionRef = useRef<Pick<
    GestureResponderEvent['nativeEvent'],
    'pageX' | 'pageY'
  > | null>(null);

  const scale = useSharedValue(1);

  const onPressHandler = useCallback(
    async (event: GestureResponderEvent) => {
      if (!onPress) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      if (!ignoreDragEvents) {
        const { pageX, pageY } = event.nativeEvent;

        const isDragEvent =
          touchActivationPositionRef.current &&
          isDrag(
            touchActivationPositionRef.current.pageX,
            touchActivationPositionRef.current.pageY,
            pageX,
            pageY,
          );

        if (isDragEvent) {
          // eslint-disable-next-line no-useless-return
          return;
        }
      }
      onPress(event);

      if (hapticFeedback) {
        await impactAsync(hapticStyle);
      }
    },
    [onPress, ignoreDragEvents, hapticFeedback, hapticStyle],
  );

  const onPressInHandler = useMemo(() => {
    return ({ nativeEvent: { pageX, pageY } }: GestureResponderEvent) => {
      touchActivationPositionRef.current = { pageX, pageY };

      if (!scaleTo) {
        // eslint-disable-next-line no-useless-return
        return;
      }
      scale.value = withTiming(scaleTo, ScaleTimingConfigIn);
    };
  }, [scale, scaleTo]);

  const onPressOutHandler = useMemo(() => {
    if (!scaleTo) {
      // eslint-disable-next-line no-useless-return
      return;
    }

    // eslint-disable-next-line consistent-return
    return () => {
      scale.value = withDelay(50, withTiming(1, ScaleTimingConfigOut));
    };
  }, [scale, scaleTo]);

  const { onLongPress, ...restStyles } = rest;

  const baseProps: TouchableBoxProps = {
    onPress: onPressHandler,
    onPressIn: onPressInHandler,
    onPressOut: onPressOutHandler,
    onLongPress,
    activeOpacity,
    hitSlop: hitSlop || defaultHitslopInset,
    testID,
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedTouchableBox
      {...baseProps}
      disabled={disabled}
      style={[scaleTo ? animatedStyle : null, style, restStyles]}
    >
      {children}
    </AnimatedTouchableBox>
  );
}
export const AnimatedTouchableArea = withAnimated(TouchableArea);
