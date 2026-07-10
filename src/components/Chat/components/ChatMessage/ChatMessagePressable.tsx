import { memo } from 'react';
import {
  type GestureResponderEvent,
  type Insets,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';

import { createHitslop } from '@app/utils/string/createHitSlop';

// Default-parameter expressions re-run per render, and this component mounts
// several times per chat row - hoist the common hit slop.
const DEFAULT_HIT_SLOP = createHitslop(8);

interface ChatMessagePressableProps {
  accessibilityLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  hitSlop?: Insets;
  onLongPress?: (event: GestureResponderEvent) => void;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function ChatMessagePressableComponent({
  accessibilityLabel,
  children,
  disabled,
  hitSlop = DEFAULT_HIT_SLOP,
  onLongPress,
  onPress,
  style,
  testID,
}: ChatMessagePressableProps) {
  const interactive = Boolean(onPress || onLongPress);

  if (!interactive) {
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
      // Style-function form: pressed feedback with no state or re-render,
      // cheap enough for hundreds of chat rows.
      style={({ pressed }) => [style, pressed && pressedStyle]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

const pressedStyle = { opacity: 0.6 } as const;

export const ChatMessagePressable = memo(ChatMessagePressableComponent);
