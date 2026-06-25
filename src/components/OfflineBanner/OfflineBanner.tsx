import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onlineManager } from '@tanstack/react-query';

import { theme } from '@app/styles/themes';

const BANNER_HEIGHT = 32;
const ANIM_DURATION = 250;

export function OfflineBanner() {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const online = onlineManager.isOnline();
  const progress = useSharedValue(online ? 0 : 1);

  useEffect(() => {
    return onlineManager.subscribe(isOnline => {
      progress.value = withTiming(isOnline ? 0 : 1, {
        duration: ANIM_DURATION,
      });
    });
  }, [progress]);

  const totalHeight = insets.top + BANNER_HEIGHT;

  const animatedStyle = useAnimatedStyle(() => ({
    height: progress.value * totalHeight,
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <View style={[styles.statusBarFill, { height: insets.top }]} />
      <View style={styles.banner}>
        <Text style={styles.text}>{t('noInternetConnection')}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    zIndex: 9999,
  },
  statusBarFill: {
    backgroundColor: theme.colorBlack,
  },
  banner: {
    backgroundColor: theme.colorAmber,
    height: BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colorBlack,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
