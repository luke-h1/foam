import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onlineManager } from '@tanstack/react-query';

import { Text } from '@app/components/ui/Text/Text';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';

const HIDDEN_OFFSET = 80;

export function OfflineBanner() {
  const { t } = useTranslation('common');
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
        <Text type='xxs' weight='semibold' family='system' style={styles.text}>
          {t('noInternetConnection')}
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
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
  },
  text: {
    color: theme.colorBlack,
    letterSpacing: 0.2,
  },
});
