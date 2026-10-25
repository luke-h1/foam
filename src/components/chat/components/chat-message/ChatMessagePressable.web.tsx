import { memo } from 'react';
import { Pressable, View } from 'react-native';

import {
  CHAT_PRESS_HIT_SLOP,
  chatPressedStyle,
} from './ChatMessagePressable.styles';
import type { ChatMessagePressableProps } from './ChatMessagePressable.types';

/**
 * The web press target. The native file drives the responder system by hand
 * for chat-list performance, but react-native-web has no accessibility
 * actions, so only `Pressable` gives keyboard users Enter and Space here.
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
  if (!onPress && !onLongPress) {
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole='button'
      disabled={disabled}
      hitSlop={hitSlop}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => (pressed ? [style, chatPressedStyle] : style)}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

export const ChatMessagePressable = memo(ChatMessagePressableComponent);
