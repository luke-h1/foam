import { useCallback, useEffect, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';

import type { EmotePressData } from '@app/components/chat/components/chat-message/ChatRow.types';
import { beginRowTouchHold } from '@app/components/chat/util/chatRowTouchHold';

export const MESSAGE_LONG_PRESS_DELAY_MS = 650;

const LONG_PRESS_MOVE_TOLERANCE_DP = 10;

/**
 * One long-press timer for the whole row. A long press over an emote opens the
 * emote sheet; anywhere else it runs onLongPress.
 */
export function useChatRowLongPress({
  canLongPress,
  onLongPress,
}: {
  canLongPress: boolean;
  onLongPress: () => void;
}) {
  const [selectedEmoteAction, setSelectedEmoteAction] =
    useState<EmotePressData | null>(null);

  const rowLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Set from each emote's onTouchStart (which bubbles before the row's), so
  // the single row-level long-press timer can open the emote sheet without a
  // Pressable per emote (busy rows would mount hundreds of them).
  const pressedEmotePartRef = useRef<EmotePressData | null>(null);

  const rowTouchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const releaseTouchHoldRef = useRef<(() => void) | null>(null);

  const releaseTouchHold = () => {
    releaseTouchHoldRef.current?.();
    releaseTouchHoldRef.current = null;
  };

  const stopRowLongPressTimer = () => {
    if (!rowLongPressTimerRef.current) {
      return;
    }

    clearTimeout(rowLongPressTimerRef.current);
    rowLongPressTimerRef.current = null;
  };

  const clearRowLongPressTimer = () => {
    pressedEmotePartRef.current = null;
    rowTouchOriginRef.current = null;
    releaseTouchHold();
    stopRowLongPressTimer();
  };

  const handleRowTouchMove = (event: GestureResponderEvent) => {
    const origin = rowTouchOriginRef.current;

    if (!origin) {
      return;
    }

    const { pageX, pageY } = event.nativeEvent;

    if (
      Math.abs(pageX - origin.x) > LONG_PRESS_MOVE_TOLERANCE_DP ||
      Math.abs(pageY - origin.y) > LONG_PRESS_MOVE_TOLERANCE_DP
    ) {
      clearRowLongPressTimer();
    }
  };

  useEffect(
    () => () => {
      releaseTouchHoldRef.current?.();

      if (rowLongPressTimerRef.current) {
        clearTimeout(rowLongPressTimerRef.current);
        rowLongPressTimerRef.current = null;
      }
    },
    [],
  );

  const handleEmoteTouchStart = useCallback((token: EmotePressData) => {
    pressedEmotePartRef.current = token;
  }, []);

  const closeEmoteActionSheet = () => {
    setSelectedEmoteAction(null);
  };

  const startRowLongPressTimer = (event: GestureResponderEvent) => {
    // Only stop the timer here: the pressed emote (if any) was just recorded
    // by the emote's own onTouchStart, which bubbles before the row's.
    stopRowLongPressTimer();
    releaseTouchHold();

    if (canLongPress || pressedEmotePartRef.current) {
      releaseTouchHoldRef.current = beginRowTouchHold();
    }

    rowTouchOriginRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };

    rowLongPressTimerRef.current = setTimeout(() => {
      rowLongPressTimerRef.current = null;
      releaseTouchHold();
      const pressedEmotePart = pressedEmotePartRef.current;
      pressedEmotePartRef.current = null;

      if (pressedEmotePart) {
        setSelectedEmoteAction(pressedEmotePart);
        return;
      }

      if (canLongPress) {
        onLongPress();
      }
    }, MESSAGE_LONG_PRESS_DELAY_MS);
  };

  return {
    clearRowLongPressTimer,
    closeEmoteActionSheet,
    handleEmoteTouchStart,
    handleRowTouchMove,
    selectedEmoteAction,
    startRowLongPressTimer,
  };
}
