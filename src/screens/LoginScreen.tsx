/* eslint-disable @typescript-eslint/no-misused-promises */
import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { useTwitchSignIn } from '@app/hooks/useTwitchSignIn';
import { theme } from '@app/styles/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, View, StyleSheet } from 'react-native';

export function LoginScreen() {
  const { isPromptingAuth, isSignInReady, startSignIn } = useTwitchSignIn();
  const isDisabled = !isSignInReady || isPromptingAuth;

  return (
    <SafeAreaView style={styles.container}>
      <Image
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
        source={require('../../assets/data/stream_thumbnail2.jpg')}
        contentFit="cover"
        transition={0}
        containerStyle={styles.backgroundImageContainer}
        style={styles.backgroundImage}
      />
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.04)',
          'rgba(0,0,0,0.48)',
          theme.color.background.dark,
        ]}
        locations={[0, 0.42, 0.92]}
        pointerEvents="none"
        style={styles.backgroundFade}
      />

      <View style={styles.content}>
        <View style={styles.heroSpacer} />

        <View style={styles.authContent}>
          <View style={styles.brandRow}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
              source={require('../../assets/app-icon/app-icon-production.png')}
              style={styles.appIcon}
              contentFit="cover"
            />
            <View style={styles.brandCopy}>
              <Text type="xs" weight="semibold" style={styles.eyebrow}>
                FOAM FOR TWITCH
              </Text>
              <Text type="4xl" weight="bold" color="gray.text">
                Welcome back.
              </Text>
            </View>
          </View>

          <Text type="lg" color="gray" style={styles.subtitle}>
            Sign in to open your followed channels, richer chat, and third-party
            emotes.
          </Text>

          <Button
            accessibilityRole="button"
            label="Continue with Twitch"
            onPress={() => {
              void startSignIn();
            }}
            disabled={isDisabled}
            style={[
              styles.loginButton,
              isDisabled && styles.loginButtonDisabled,
            ]}
          >
            <View style={styles.buttonContent}>
              <BrandIcon name="twitch" size="lg" color={theme.colorWhite} />
              <Text type="lg" color="gray.text" weight="semibold">
                {isPromptingAuth ? 'Opening Twitch...' : 'Continue with Twitch'}
              </Text>
            </View>
          </Button>

          <View style={styles.featureRow}>
            <Text type="xs" color="gray" style={styles.featurePill}>
              BTTV
            </Text>
            <Text type="xs" color="gray" style={styles.featurePill}>
              FFZ
            </Text>
            <Text type="xs" color="gray" style={styles.featurePill}>
              7TV
            </Text>
            <Text type="xs" color="gray" style={styles.featurePill}>
              Twitch chat
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.background.dark,
  },
  backgroundFade: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    height: '100%',
    opacity: 0.62,
    width: '100%',
  },
  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: theme.space20,
    paddingBottom: theme.space36,
  },
  heroSpacer: {
    flex: 1,
    minHeight: theme.space84,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius16,
    borderCurve: 'continuous',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.36,
    shadowRadius: 18,
    elevation: 10,
  },
  authContent: {
    gap: theme.space24,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brandCopy: {
    flex: 1,
    gap: theme.space4,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
  },
  eyebrow: {
    color: theme.colorDarkGreen,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: theme.color.textSecondary.dark,
    maxWidth: 360,
  },
  loginButton: {
    backgroundColor: '#9146ff',
    paddingVertical: theme.space20,
    paddingHorizontal: theme.space24,
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    borderColor: '#a970ff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 18px 40px rgba(145, 70, 255, 0.28)',
    minHeight: 64,
    width: '100%',
  },
  loginButtonDisabled: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space12,
  },
  featurePill: {
    backgroundColor: theme.colorSurfaceAlpha,
    borderColor: theme.colorBorderSecondary,
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.space8,
  },
});
