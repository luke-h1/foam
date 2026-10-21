import type { ReactNode } from 'react';
import type { Insets, StyleProp, ViewStyle } from 'react-native';

export interface ChatMessagePressableProps {
  accessibilityLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  hitSlop?: Insets;
  onLongPress?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
