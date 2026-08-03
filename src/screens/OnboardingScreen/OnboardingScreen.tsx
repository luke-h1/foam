import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { router } from 'expo-router';

import { Button } from '@app/components/Button/Button';
import { EnergyOrb } from '@app/components/EnergyOrb/EnergyOrb';
import { Text } from '@app/components/ui/Text/Text';
import { storageMMKV } from '@app/lib/mmkv';
import { theme } from '@app/styles/themes';

export const ONBOARDING_SEEN_KEY = 'V1_hasSeenOnboarding';

function handleGetStarted() {
  storageMMKV.set(ONBOARDING_SEEN_KEY, true);
  router.replace('/');
}

export function OnboardingScreen() {
  const { t } = useTranslation('onboarding');
  const { width } = useWindowDimensions();
  const orbSize = Math.min(width * 0.72, 300);

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInUp.duration(800).delay(100)}
        style={styles.orbContainer}
      >
        <EnergyOrb
          width={orbSize}
          height={orbSize}
          colors={[
            theme.color.accent.light,
            theme.color.accent.dark,
            theme.color.accentPress.dark,
          ]}
          intensity={2.2}
          glowRadius={0.42}
          speed={0.9}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(700).delay(300)}
        style={styles.content}
      >
        <Text type='3xl' weight='bold' align='center'>
          {t('title')}
        </Text>
        <Text type='md' align='center' color='gray' style={styles.description}>
          {t('description')}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(600).delay(500)}
        style={styles.footer}
      >
        <Button
          onPress={handleGetStarted}
          haptic='medium'
          label={t('getStarted')}
          style={styles.ctaButton}
        >
          <Text
            type='md'
            color='accent'
            contrast
            align='center'
            weight='semibold'
          >
            {t('getStarted')}
          </Text>
        </Button>
        <Button
          onPress={handleGetStarted}
          label={t('skip')}
          style={styles.skipButton}
        >
          <Text type='sm' align='center' color='gray'>
            {t('skip')}
          </Text>
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: theme.space44,
    paddingHorizontal: theme.space28,
    paddingTop: theme.space84,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: theme.space12,
    justifyContent: 'center',
    paddingHorizontal: theme.space16,
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: theme.colorPrimary,
    borderRadius: theme.borderRadius999,
    paddingHorizontal: theme.space28,
    paddingVertical: theme.space16,
    width: '100%',
  },
  description: {
    lineHeight: 24,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    gap: theme.space12,
    width: '100%',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: theme.space8,
  },
});
