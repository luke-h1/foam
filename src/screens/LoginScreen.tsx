/* eslint-disable @typescript-eslint/no-misused-promises */
import { Button, Typography, Image } from '@app/components';
import { BrandIcon } from '@app/components/BrandIcon';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks';
import { sentryService } from '@app/services';
import { useAuthRequest } from 'expo-auth-session';
import { useEffect } from 'react';
import { Platform, SafeAreaView, View, Dimensions } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { toast } from 'sonner-native';

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
      // Use implicit flow to avoid code exchange.
      responseType: 'token',
      redirectUri: proxyUrl,

      // Enable PKCE (Proof Key for Code Exchange) to prevent another app from intercepting the redirect request.
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
      sentryService.captureMessage('LoginSuccess');
      toast.success('Logged in');

      navigation.push('Tabs', {
        screen: 'Following',
      });
    }

    sentryService.captureMessage(response?.type || 'unknownAuthEvent');
  };

  useEffect(() => {
    if (response && response?.type === 'success') {
      void handleAuth();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative background elements */}
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
              <Typography
                size="4xl"
                fontWeight="bold"
                color="accent"
                align="center"
              >
                Welcome to Foam
              </Typography>
            </View>

            <Typography
              size="lg"
              color="gray"
              align="center"
              style={styles.subtitle}
            >
              Experience Twitch like never before.{'\n'}
              Enhanced chat • Third-party emotes • Clean UI
            </Typography>
          </View>

          <View style={styles.actionSection}>
            <Button
              onPress={() => promptAsync()}
              disabled={!request}
              style={[
                styles.loginButton,
                !request && styles.loginButtonDisabled,
              ]}
            >
              <View style={styles.buttonContent}>
                <BrandIcon name="twitch" />
                <Typography size="lg" color="gray.text" fontWeight="semiBold">
                  Continue with Twitch
                </Typography>
              </View>
            </Button>
          </View>

          <View style={styles.featuresSection}>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Typography size="sm" color="gray">
                  BTTV, FFZ & 7TV emotes
                </Typography>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Typography size="sm" color="gray">
                  Enhanced chat experience
                </Typography>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Typography size="sm" color="gray">
                  Intuitive mobile interface
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.ui,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
  },
  innerContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['6xl'],
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: theme.spacing['2xl'],
    shadowColor: theme.colors.accent.ui,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
    maxWidth: screenWidth * 0.8,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  loginButton: {
    backgroundColor: '#9146ff',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing['3xl'],
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9146ff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
    width: '100%',
    maxWidth: 300,
  },
  loginButtonDisabled: {
    backgroundColor: theme.colors.gray.accent,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  twitchIcon: {
    width: 20,
    height: 20,
    marginRight: theme.spacing.md,
    tintColor: 'white',
  },
  featuresSection: {
    alignItems: 'center',
    opacity: 0.8,
  },
  featuresList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent.accent,
    marginRight: theme.spacing.md,
  },
  decorativeElements: {
    position: 'absolute',
    top: theme.spacing['4xl'],
    right: theme.spacing['2xl'],
    opacity: 0.1,
  },
  decorativeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.accent.ui,
    position: 'absolute',
  },
  decorativeCircle2: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.violet.ui,
    position: 'absolute',
    top: 40,
    left: -20,
  },
}));
