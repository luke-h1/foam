import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onlineManager } from '@tanstack/react-query';

import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';

const HIDDEN_OFFSET = 80;

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const online = onlineManager.isOnline();
  const progress = useSharedValue(online ? 0 : 1);

  useEffect(() => {
    return onlineManager.subscribe(isOnline => {
      progress.set(withSpring(isOnline ? 0 : 1, motion.spring.gentle));
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [
      { translateY: (progress.get() - 1) * (insets.top + HIDDEN_OFFSET) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents='none'
      style={[
        styles.wrapper,
        { top: insets.top + theme.space8 },
        animatedStyle,
      ]}
    >
      <View style={styles.pill}>
        <SymbolView
          name='wifi.slash'
          size={14}
          tintColor={theme.color.warning.dark}
          weight='semibold'
        />
        <Text type='footnote' weight='semibold'>
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
    backgroundColor: theme.color.surfaceElevated.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
    boxShadow: theme.elevation.floating,
    flexDirection: 'row',
    gap: theme.space8,
    justifyContent: 'center',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
});
