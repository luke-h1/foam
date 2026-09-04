import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { Button } from '@app/components/Button/Button';
import { EnergyOrb } from '@app/components/EnergyOrb/EnergyOrb';
import { Text } from '@app/components/ui/Text/Text';
import { storage } from '@app/lib/storage';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';

import { ONBOARDING_SEEN_KEY } from './constants';

function handleGetStarted() {
  storage.set(ONBOARDING_SEEN_KEY, true);
  router.replace('/');
}

const gentleSpring = (entering: typeof FadeInUp) =>
  entering
    .springify()
    .damping(motion.spring.gentle.damping)
    .stiffness(motion.spring.gentle.stiffness)
    .mass(motion.spring.gentle.mass);

export function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const orbSize = Math.min(width * 0.72, 300);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + theme.space24 }]}
    >
      <Animated.View
        entering={gentleSpring(FadeInUp).delay(50)}
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
        entering={gentleSpring(FadeInDown).delay(150)}
        style={styles.content}
      >
        <Text type='3xl' weight='bold' align='center'>
          Welcome to foam
        </Text>
        <Text type='md' align='center' color='gray' style={styles.description}>
          The fastest way to watch Twitch - browse live streams, explore
          categories, and follow your favourite creators.
        </Text>
      </Animated.View>

      <Animated.View
        entering={gentleSpring(FadeInDown).delay(250)}
        style={styles.footer}
      >
        <Button
          onPress={handleGetStarted}
          haptic='medium'
          label='Get started'
          style={styles.ctaButton}
        >
          <Text
            type='md'
            color='accent'
            contrast
            align='center'
            weight='semibold'
          >
            Get started
          </Text>
        </Button>
        <Button
          onPress={handleGetStarted}
          label='Skip'
          style={styles.skipButton}
        >
          <Text type='sm' align='center' color='gray'>
            Skip
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
