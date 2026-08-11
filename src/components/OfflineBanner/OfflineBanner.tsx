import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onlineManager } from '@tanstack/react-query';

import { Text } from '@app/components/ui/Text/Text';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';

const HIDDEN_OFFSET = 80;

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [online, setOnline] = useState(() => onlineManager.isOnline());
  const progress = useSharedValue(online ? 0 : 1);

  useEffect(() => {
    return onlineManager.subscribe(isOnline => {
      setOnline(isOnline);
      progress.set(
        reduceMotion
          ? withTiming(isOnline ? 0 : 1, { duration: motion.fast })
          : withSpring(isOnline ? 0 : 1, motion.spring.gentle),
      );
    });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: reduceMotion
      ? []
      : [{ translateY: (progress.get() - 1) * (insets.top + HIDDEN_OFFSET) }],
  }));

  /**
   * `opacity: 0` does not take a node out of the native accessibility tree the
   * way `display: none` does on the web, so without these flags VoiceOver reads
   * "No internet connection" on every screen while the device is online.
   */
  return (
    <Animated.View
      accessibilityElementsHidden={online}
      accessibilityLiveRegion='polite'
      importantForAccessibility={online ? 'no-hide-descendants' : 'yes'}
      pointerEvents='none'
      style={[
        styles.wrapper,
        { top: insets.top + theme.space8 },
        animatedStyle,
      ]}
    >
      <View style={styles.pill}>
        <Text type='xxs' weight='semibold' family='system' style={styles.text}>
          No internet connection
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: theme.colorAmber,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    justifyContent: 'center',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
    boxShadow: theme.shadow.md.dark,
  },
  text: {
    color: theme.colorBlack,
    letterSpacing: 0.2,
  },
});
