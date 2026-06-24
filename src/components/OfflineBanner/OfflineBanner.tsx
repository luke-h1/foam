import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { onlineManager } from '@tanstack/react-query';

import { theme } from '@app/styles/themes';

const BANNER_HEIGHT = 32;
const ANIM_DURATION = 250;

export function OfflineBanner() {
  const { t } = useTranslation('common');
  const online = onlineManager.isOnline();
  const height = useSharedValue(online ? 0 : BANNER_HEIGHT);

  useEffect(() => {
    return onlineManager.subscribe(isOnline => {
      height.value = withTiming(isOnline ? 0 : BANNER_HEIGHT, {
        duration: ANIM_DURATION,
      });
    });
  }, [height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Animated.View style={styles.banner}>
        <Text style={styles.text}>{t('noInternetConnection')}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  banner: {
    backgroundColor: theme.colorAmber,
    height: BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    color: theme.colorBlack,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
