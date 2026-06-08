import { KeyboardController } from 'react-native-keyboard-controller';
import { Directions, Gesture } from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export const COMPOSER_DISMISS_DRAG_DISTANCE = 34;
export const COMPOSER_DISMISS_VELOCITY = 520;
export const COMPOSER_DRAG_LIMIT = 64;

export function dismissComposer() {
  void KeyboardController.dismiss();
}

export function useComposerDismissGesture() {
  const composerDragOffset = useSharedValue(0);

  const composerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: composerDragOffset.get() }],
  }));

  const composerPanGesture = Gesture.Pan()
    .activeOffsetY(4)
    .failOffsetX([-40, 40])
    .onUpdate(event => {
      composerDragOffset.set(
        Math.max(0, Math.min(event.translationY, COMPOSER_DRAG_LIMIT)),
      );
    })
    .onEnd(event => {
      const shouldDismiss =
        event.translationY > COMPOSER_DISMISS_DRAG_DISTANCE ||
        event.velocityY > COMPOSER_DISMISS_VELOCITY;

      if (shouldDismiss) {
        scheduleOnRN(dismissComposer);
      }
    })
    .onFinalize(() => {
      composerDragOffset.set(
        withSpring(0, {
          damping: 18,
          stiffness: 220,
        }),
      );
    });

  const composerFlingGesture = Gesture.Fling()
    .direction(Directions.DOWN)
    .onEnd(() => {
      scheduleOnRN(dismissComposer);
    });

  const composerGesture = Gesture.Simultaneous(
    composerPanGesture,
    composerFlingGesture,
  );

  return { composerAnimatedStyle, composerGesture };
}
