import { memo, useEffect, useRef, useState } from 'react';
import {
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  type GestureResponderEvent,
  View,
} from 'react-native';

import {
  CHAT_PRESS_HIT_SLOP,
  chatPressedStyle,
} from './chat-message-pressable.styles';
import type { ChatMessagePressableProps } from './chat-message-pressable.types';

/**
 * A touch that moves further than this from where it landed is a scroll or
 * a drag, not a tap. Close to Pressable's press rectangle for a badge-sized
 * target once its hit slop and 20pt press retention are added.
 */
const PRESS_MOVE_TOLERANCE_DP = 24;

/**
 * Pressable's default long-press delay.
 */
const LONG_PRESS_DELAY_MS = 500;

/**
 * Pressable's default `minPressDuration`: a quick tap still shows the pressed
 * highlight for this long, so the press reads as feedback.
 */
const MIN_PRESSED_MS = 130;

interface ActiveTouch {
  longPressFired: boolean;
  longPressTimer: ReturnType<typeof setTimeout> | null;
  grantedAt: number;
  originX: number;
  originY: number;
}

const alwaysRespond = () => true;
const neverRespond = () => false;

/**
 * A press target for chat rows that uses the responder system directly.
 * `Pressable` creates a `Pressability` object with many handlers for each
 * target, and a busy chat screen has hundreds of targets.
 *
 * This keeps only what chat uses: the pressed highlight, hit slop, the button
 * role and label, press and long press. Web uses
 * `chat-message-pressable.web.tsx`, which keeps `Pressable` for the keyboard.
 */
function ChatMessagePressableComponent({
  accessibilityLabel,
  children,
  disabled,
  hitSlop = CHAT_PRESS_HIT_SLOP,
  onLongPress,
  onPress,
  style,
  testID,
}: ChatMessagePressableProps) {
  const interactive = Boolean(onPress || onLongPress);
  const [pressed, setPressed] = useState(false);

  // One ref for the whole touch: where it landed, whether it is still a tap,
  // and the long-press timer.
  const touchRef = useRef<ActiveTouch | null>(null);
  const unpressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUnpressTimer = () => {
    if (unpressTimerRef.current) {
      clearTimeout(unpressTimerRef.current);
      unpressTimerRef.current = null;
    }
  };

  const clearTouch = () => {
    const touch = touchRef.current;

    if (touch?.longPressTimer) {
      clearTimeout(touch.longPressTimer);
    }

    touchRef.current = null;
  };

  useEffect(
    () => () => {
      clearTouch();
      clearUnpressTimer();
    },
    [],
  );

  if (!interactive) {
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  }

  const handleGrant = (event: GestureResponderEvent) => {
    clearTouch();
    clearUnpressTimer();

    const touch: ActiveTouch = {
      grantedAt: Date.now(),
      longPressFired: false,
      longPressTimer: null,
      originX: event.nativeEvent.pageX,
      originY: event.nativeEvent.pageY,
    };

    if (onLongPress) {
      touch.longPressTimer = setTimeout(() => {
        touch.longPressTimer = null;
        touch.longPressFired = true;
        onLongPress();
      }, LONG_PRESS_DELAY_MS);
    }

    touchRef.current = touch;
    setPressed(true);
  };

  const handleMove = (event: GestureResponderEvent) => {
    const touch = touchRef.current;

    if (!touch) {
      return;
    }

    const { pageX, pageY } = event.nativeEvent;

    if (
      Math.abs(pageX - touch.originX) > PRESS_MOVE_TOLERANCE_DP ||
      Math.abs(pageY - touch.originY) > PRESS_MOVE_TOLERANCE_DP
    ) {
      clearTouch();
      setPressed(false);
    }
  };

  const handleRelease = () => {
    const touch = touchRef.current;
    clearTouch();

    const remainingPressedMs = touch
      ? MIN_PRESSED_MS - (Date.now() - touch.grantedAt)
      : 0;

    if (remainingPressedMs > 0) {
      unpressTimerRef.current = setTimeout(() => {
        unpressTimerRef.current = null;
        setPressed(false);
      }, remainingPressedMs);
    } else {
      setPressed(false);
    }

    // A long press that already fired consumes the touch, as in Pressable.
    if (touch && !touch.longPressFired) {
      onPress?.();
    }
  };

  const handleTerminate = () => {
    clearTouch();
    setPressed(false);
  };

  // Screen readers activate through these actions, not through touches:
  // TalkBack sends no touch events to a plain View.
  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'longpress') {
      onLongPress?.();
      return;
    }

    onPress?.();
  };

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole='button'
      accessibilityState={disabled != null ? { disabled } : undefined}
      accessibilityActions={
        disabled ? undefined : accessibilityActions(onPress, onLongPress)
      }
      onAccessibilityAction={handleAccessibilityAction}
      hitSlop={hitSlop}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={handleRelease}
      onResponderTerminate={handleTerminate}
      onResponderTerminationRequest={alwaysRespond}
      onStartShouldSetResponder={disabled ? neverRespond : alwaysRespond}
      style={pressed ? [style, chatPressedStyle] : style}
      testID={testID}
    >
      {children}
    </View>
  );
}

function accessibilityActions(
  onPress: (() => void) | undefined,
  onLongPress: (() => void) | undefined,
): AccessibilityActionInfo[] {
  return [
    ...(onPress ? [{ name: 'activate' as const }] : []),
    ...(onLongPress ? [{ name: 'longpress' as const }] : []),
  ];
}

export const ChatMessagePressable = memo(ChatMessagePressableComponent);
