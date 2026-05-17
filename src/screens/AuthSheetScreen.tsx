import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { useTwitchSignIn } from '@app/hooks/useTwitchSignIn';
import { impact } from '@app/lib/haptics';
import { theme } from '@app/styles/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AuthSheetScreen() {
  const handleSuccess = useCallback(() => {
    if (router.canDismiss()) {
      router.dismiss();
      return;
    }

    router.replace('/tabs/following');
  }, []);

  const { isPromptingAuth, isSignInReady, startSignIn } = useTwitchSignIn({
    onSuccess: handleSuccess,
  });
  const isDisabled = !isSignInReady || isPromptingAuth;

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.appIconFrame}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
              source={require('../../assets/app-icon/app-icon-production.png')}
              style={styles.appIcon}
              contentFit="cover"
            />
          </View>
          <View style={styles.headerCopy}>
            <Text type="xxs" weight="bold" style={styles.eyebrow}>
              FOAM FOR TWITCH
            </Text>
            <Text
              type="3xl"
              weight="bold"
              color="gray.text"
              style={styles.title}
            >
              Sign in with Twitch
            </Text>
            <Text type="sm" color="gray.textLow" style={styles.subtitle}>
              Open your followed channels, chat access, and third-party emotes
              in one place.
            </Text>
          </View>
        </View>

        <Button
          accessibilityRole="button"
          label="Continue with Twitch"
          onPress={() => {
            void impact('light');
            void startSignIn();
          }}
          disabled={isDisabled}
          style={[styles.loginButton, isDisabled && styles.loginButtonDisabled]}
        >
          <LinearGradient
            colors={
              isDisabled
                ? [
                    theme.color.backgroundElement.dark,
                    theme.color.backgroundElement.dark,
                  ]
                : ['#a970ff', '#9146ff']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <View style={styles.buttonIcon}>
              <BrandIcon name="twitch" size="md" color={theme.colorWhite} />
            </View>
            <Text type="sm" color="gray.text" weight="bold">
              {isPromptingAuth ? 'Opening Twitch...' : 'Continue with Twitch'}
            </Text>
          </LinearGradient>
        </Button>

        <View style={styles.featureList}>
          <FeatureItem icon="message-circle" label="Twitch chat" />
          <FeatureItem icon="star" label="BTTV, FFZ, and 7TV emotes" />
          <FeatureItem icon="users" label="Minimal UI" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Icon icon={icon} size={15} color={theme.colorGreyHover} />
      </View>
      <Text
        type="xs"
        color="gray.textLow"
        weight="medium"
        style={styles.featureText}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appIcon: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 58,
    width: 58,
  },
  appIconFrame: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colorSurfaceAlpha,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    boxShadow: '0px 16px 36px rgba(145, 70, 255, 0.24)',
    padding: theme.space4,
  },
  buttonGradient: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    flexDirection: 'row',
    gap: theme.space12,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: theme.space20,
    width: '100%',
  },
  buttonIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: theme.borderRadius999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  eyebrow: {
    color: theme.colorDarkGreen,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  featureIcon: {
    alignItems: 'center',
    backgroundColor: theme.colorSurfaceAlpha,
    borderRadius: theme.borderRadius999,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 32,
  },
  featureList: {
    backgroundColor: theme.colorSurfaceAlpha,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    gap: theme.space8,
    padding: theme.space12,
  },
  featureText: {
    flex: 1,
  },
  header: {
    gap: theme.space16,
  },
  headerCopy: {
    gap: theme.space8,
  },
  loginButton: {
    backgroundColor: '#9146ff',
    borderColor: '#bf94ff',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    boxShadow: '0px 18px 40px rgba(145, 70, 255, 0.28)',
    overflow: 'hidden',
    width: '100%',
  },
  loginButtonDisabled: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
    boxShadow: 'none',
    opacity: 0.64,
  },
  content: {
    alignSelf: 'center',
    gap: theme.space20,
    justifyContent: 'center',
    maxWidth: 520,
    minHeight: '100%',
    paddingBottom: theme.space20,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space24,
    width: '100%',
  },
  subtitle: {
    color: theme.color.textSecondary.dark,
  },
  title: {
    letterSpacing: 0,
  },
});
