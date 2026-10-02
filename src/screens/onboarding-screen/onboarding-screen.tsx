import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { ActionButton } from '@app/components/action-button/action-button';
import { EnergyOrb } from '@app/components/energy-orb/energy-orb';
import { Text } from '@app/components/ui/text/text';
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
        <Text type='title1' align='center'>
          Welcome to Foam
        </Text>
        <Text type='body' align='center' color='gray.textLow'>
          The fastest way to watch Twitch. Browse live streams, explore
          categories and follow your favourite creators.
        </Text>
      </Animated.View>

      <Animated.View
        entering={gentleSpring(FadeInDown).delay(250)}
        style={styles.footer}
      >
        <ActionButton
          title='Get started'
          haptic='medium'
          onPress={handleGetStarted}
          style={styles.cta}
        />
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
  cta: {
    alignSelf: 'stretch',
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
});
