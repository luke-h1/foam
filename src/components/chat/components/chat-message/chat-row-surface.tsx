import { View } from 'react-native';
import type { ReactNode } from 'react';

import type { ChatRowSurfaceState } from '@app/components/chat/components/chat-message/chat-row.types';

import { getChatRowSurfaceStyle } from './util/get-chat-row-surface-style';

/**
 * The row's background and its long-press touch target.
 */
export function ChatRowSurface({
  state,
  children,
}: {
  state: ChatRowSurfaceState;
  children: ReactNode;
}) {
  const { clearRowLongPressTimer, handleRowTouchMove, startRowLongPressTimer } =
    state;

  return (
    <View
      testID='chat-message'
      onTouchCancel={clearRowLongPressTimer}
      onTouchEnd={clearRowLongPressTimer}
      onTouchMove={handleRowTouchMove}
      onTouchStart={startRowLongPressTimer}
      style={getChatRowSurfaceStyle(state)}
    >
      {children}
    </View>
  );
}
