import { useEffect } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onlineManager } from '@tanstack/react-query';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

const BANNER_HEIGHT = 32;
const ANIM_DURATION = 250;

export function OfflineBanner() {
  const { t } = useTranslation('common');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const insets = useSafeAreaInsets();
  const online = onlineManager.isOnline();
  const progress = useSharedValue(online ? 0 : 1);

  useEffect(() => {
    return onlineManager.subscribe(isOnline => {
      progress.set(
        withTiming(isOnline ? 0 : 1, {
          duration: ANIM_DURATION,
        }),
      );
    });
  }, [progress]);

  const totalHeight = insets.top + BANNER_HEIGHT;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (progress.get() - 1) * totalHeight }],
  }));

  return (
    <Animated.View
      pointerEvents='none'
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.color.background[scheme],
          paddingTop: insets.top,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[styles.banner, { backgroundColor: theme.color.amber[scheme] }]}
      >
        <Text type='xxs' weight='semibold' style={styles.text}>
          {t('noInternetConnection')}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  banner: {
    height: BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colorBlack,
    letterSpacing: 0.2,
  },
});
