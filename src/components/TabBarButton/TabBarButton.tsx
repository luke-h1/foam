import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { FC, ReactNode } from 'react';
import {
  AccessibilityState,
  GestureResponderEvent,
  Platform,
  // eslint-disable-next-line no-restricted-imports
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = (e: GestureResponderEvent) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }

    // todo add scroll handler
    onPress?.(e);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.92);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[styles.pressable, animatedStyle]}
    >
      {icon({ color }) as ReactNode}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
