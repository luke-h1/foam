import { memo } from 'react';
import type { ReactNode } from 'react';
import { createHitslop } from '@app/utils/string/createHitSlop';
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type Insets,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

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
  hitSlop = createHitslop(8),
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
