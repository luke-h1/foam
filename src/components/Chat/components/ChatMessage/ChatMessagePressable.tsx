import { createHitslop } from '@app/utils/string/createHitSlop';
import { memo, type ReactNode } from 'react';
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
      style={style}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

export const ChatMessagePressable = memo(ChatMessagePressableComponent);
