/* eslint-disable @typescript-eslint/no-misused-promises */
import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { countMetric } from '@app/services/sentry-service';
import { theme } from '@app/styles/themes';
import { useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  View,
  StyleSheet,
} from 'react-native';
import { toast } from 'sonner-native';

WebBrowser.maybeCompleteAuthSession();

const USER_SCOPES = [
  'user:read:follows',
  'user:read:blocked_users',
  'user:read:emotes',
  'user:manage:blocked_users',
] as const;

const CHANNEL_SCOPES = [
  'channel:read:polls',
  'channel:read:predictions',
  'channel:moderate',
] as const;

const CHAT_SCOPES = ['chat:read', 'chat:edit'] as const;
const WHISPER_SCOPES = ['whispers:read', 'whispers:edit'] as const;

const proxyUrl = new URL(
  Platform.select({
    native: `${process.env.AUTH_PROXY_API_BASE_URL}/proxy`,
    default: `${process.env.AUTH_PROXY_API_BASE_URL}/pending`,
    web: `${process.env.AUTH_PROXY_API_BASE_URL}/pending`,
    ios: `${process.env.AUTH_PROXY_API_BASE_URL}/proxy`,
  }),
).toString();

const { width: screenWidth } = Dimensions.get('window');

export function LoginScreen() {
  const navigation = useAppNavigation();
  const { loginWithTwitch } = useAuthContext();

  const discovery = {
    authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
    tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
    revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
  } as const;

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      scopes: [
        ...USER_SCOPES,
        ...CHAT_SCOPES,
        ...WHISPER_SCOPES,
        ...CHANNEL_SCOPES,
      ],
      responseType: 'token',
      redirectUri: proxyUrl,
      usePKCE: true,
      extraParams: {
        force_verify: 'true',
      },
    },
    discovery,
  );

  const handleAuth = async () => {
    await loginWithTwitch(response);
    if (response?.type === 'success') {
      countMetric('auth.login.success', {
        platform: Platform.OS,
      });
      toast.success('Logged in');

      navigation.push('Tabs', {
        screen: 'Following',
      });
    }
  };

  useEffect(() => {
    if (response && response?.type === 'success') {
      void handleAuth();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.decorativeElements}>
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeCircle2} />
      </View>

      <View style={styles.content}>
        <View style={styles.innerContent}>
          <View style={styles.logoSection}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
              source={require('../../assets/app-icon/app-icon-production.png')}
              style={styles.appIcon}
              contentFit="cover"
            />

            <View style={styles.titleContainer}>
              <Text type="4xl" weight="bold" color="accent" align="center">
                Welcome to Foam
              </Text>
            </View>

            <Text type="lg" color="gray" align="center" style={styles.subtitle}>
              Experience Twitch like never before.{'\n'}
              Enhanced chat • Third-party emotes • Clean UI
            </Text>
          </View>

          <View style={styles.actionSection}>
            <Button
              onPress={() =>
                promptAsync({
                  preferEphemeralSession: false,
                })
              }
              onPressIn={() => {
                navigation.preload('Tabs', { screen: 'Following' });
              }}
              disabled={!request}
              style={[
                styles.loginButton,
                !request && styles.loginButtonDisabled,
              ]}
            >
              <View style={styles.buttonContent}>
                <BrandIcon name="twitch" />
                <Text type="lg" color="gray.text" weight="semibold">
                  Continue with Twitch
                </Text>
              </View>
            </Button>
          </View>

          <View style={styles.featuresSection}>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text type="sm" color="gray">
                  BTTV, FFZ & 7TV emotes
                </Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text type="sm" color="gray">
                  Enhanced chat experience
                </Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text type="sm" color="gray">
                  Intuitive mobile interface
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
    width: '100%',
  },
  appIcon: {
    borderCurve: 'continuous',
    borderRadius: 20,
    elevation: 8,
    height: 100,
    marginBottom: theme.spacing['2xl'],
    shadowColor: theme.colors.accent.ui,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    width: 100,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: theme.colors.gray.ui,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['2xl'],
  },
  decorativeCircle: {
    backgroundColor: theme.colors.accent.ui,
    borderRadius: 60,
    height: 120,
    position: 'absolute',
    width: 120,
  },
  decorativeCircle2: {
    backgroundColor: theme.colors.violet.ui,
    borderRadius: 40,
    height: 80,
    left: -20,
    position: 'absolute',
    top: 40,
    width: 80,
  },
  decorativeElements: {
    opacity: 0.1,
    position: 'absolute',
    right: theme.spacing['2xl'],
    top: theme.spacing['4xl'],
  },
  featureDot: {
    backgroundColor: theme.colors.accent.accent,
    borderRadius: 2,
    height: 4,
    marginRight: theme.spacing.md,
    width: 4,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  featuresList: {
    alignItems: 'flex-start',
  },
  featuresSection: {
    alignItems: 'center',
    opacity: 0.8,
  },
  innerContent: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: '#9146ff',
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    boxShadow: '0px 4px 8px rgba(145, 70, 255, 0.3)',
    justifyContent: 'center',
    maxWidth: 300,
    minHeight: 56,
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.xl,
    width: '100%',
  },
  loginButtonDisabled: {
    backgroundColor: theme.colors.gray.accent,
    shadowOpacity: 0,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['6xl'],
  },
  subtitle: {
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
    maxWidth: screenWidth * 0.8,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
});
