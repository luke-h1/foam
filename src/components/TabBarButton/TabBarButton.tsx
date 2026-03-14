import * as Haptics from 'expo-haptics';
import { FC, ReactNode, useState } from 'react';
import {
  AccessibilityState,
  GestureResponderEvent,
  Platform,
  // eslint-disable-next-line no-restricted-imports
  Pressable,
  StyleSheet,
} from 'react-native';
import { EaseView } from 'react-native-ease';

interface TabBarButtonProps {
  icon: FC<{ color: string }>;
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityState?: AccessibilityState;
  activeTintColor: string;
  inactiveTintColor: string;
}

export function TabBarButton({
  icon,
  onPress,
  accessibilityState,
  activeTintColor,
  inactiveTintColor,
}: TabBarButtonProps) {
  const focused = accessibilityState?.selected;
  const color = focused ? activeTintColor : inactiveTintColor;
  const [pressed, setPressed] = useState(false);

  const handlePress = (e: GestureResponderEvent) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }

    // todo add scroll handler
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.pressable}
    >
      <EaseView
        animate={{ scale: pressed ? 0.92 : 1 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
        }}
        style={styles.pressable}
      >
        {icon({ color }) as ReactNode}
      </EaseView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
