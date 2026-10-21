import type { ReactNode } from 'react';
import type { Insets, StyleProp, ViewStyle } from 'react-native';

export interface ChatMessagePressableProps {
  accessibilityLabel?: string | undefined;
  children: ReactNode;
  disabled?: boolean | undefined;
  hitSlop?: Insets | undefined;
  onLongPress?: (() => void) | undefined;
  onPress?: (() => void) | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  testID?: string | undefined;
}
