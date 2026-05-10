/* eslint-disable @typescript-eslint/no-misused-promises */
import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Button } from '@app/components/Button/Button';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { sentryService } from '@app/services/sentry-service';
import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';
import {
  type AuthSessionResult,
  ResponseType,
  useAuthRequest,
} from 'expo-auth-session';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  View,
  StyleSheet,
} from 'react-native';
import { toast } from 'sonner-native';
import { LinearGradient } from 'expo-linear-gradient';

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

WebBrowser.maybeCompleteAuthSession();

const authProxyBaseUrl =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL as
    | string
    | undefined) ?? process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL;

const proxyUrl = new URL(
  Platform.select({
    native: `${authProxyBaseUrl}/proxy`,
    default: `${authProxyBaseUrl}/pending`,
    web: `${authProxyBaseUrl}/pending`,
    ios: `${authProxyBaseUrl}/proxy`,
  }),
).toString();
const appReturnUrl = 'foam://';

const { width: screenWidth } = Dimensions.get('window');

const redact = (value: string | null | undefined) =>
  value ? `${value.slice(0, 8)}…` : null;

export function LoginScreen() {
  const { loginWithTwitch } = useAuthContext();
  const authSessionActiveRef = useRef(false);
  const [isPromptingAuth, setIsPromptingAuth] = useState(false);
  const [authResponse, setAuthResponse] = useState<AuthSessionResult | null>(
    null,
  );

  const discovery = {
    authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
    revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
  } as const;

  const [request, response] = useAuthRequest(
    {
      clientId:
        (Constants.expoConfig?.extra?.EXPO_PUBLIC_TWITCH_CLIENT_ID as
          | string
          | undefined) ?? process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      scopes: [
        ...USER_SCOPES,
        ...CHAT_SCOPES,
        ...WHISPER_SCOPES,
        ...CHANNEL_SCOPES,
      ],
      responseType: ResponseType.Token,
      redirectUri: proxyUrl,
      usePKCE: false,
      extraParams: {
        force_verify: 'true',
      },
    },
    discovery,
  );

  const handleAuth = async () => {
    const successResponse =
      authResponse?.type === 'success' ? authResponse : null;

    logger.auth.info('[AUTHDBG] LoginScreen.handleAuth start', {
      responseType: authResponse?.type ?? null,
      responseUrl: successResponse?.url ?? null,
      hasAuthentication: !!successResponse?.authentication,
      responseParams: successResponse?.params ?? null,
      accessTokenPreview:
        redact(successResponse?.authentication?.accessToken) ??
        redact(
          typeof successResponse?.params?.access_token === 'string'
            ? successResponse.params.access_token
            : null,
        ),
    });

    await loginWithTwitch(authResponse);
    if (authResponse?.type === 'success') {
      sentryService.captureMessage('LoginSuccess');
      toast.success('Logged in');
      logger.auth.info('[AUTHDBG] LoginScreen.handleAuth success, routing');

      router.replace('/tabs/following');
    }

    sentryService.captureMessage(authResponse?.type || 'unknownAuthEvent');
  };

  const handleContinueWithTwitch = async () => {
    if (!request || authSessionActiveRef.current) {
      logger.auth.info(
        '[AUTHDBG] LoginScreen.handleContinueWithTwitch blocked',
        {
          hasRequest: !!request,
          authSessionActive: authSessionActiveRef.current,
        },
      );
      if (!request) {
        toast.error('Twitch sign-in is not ready yet');
      }
      return;
    }

    authSessionActiveRef.current = true;
    setIsPromptingAuth(true);

    try {
      const authUrl =
        request.url ?? (await request.makeAuthUrlAsync(discovery));
      logger.auth.info('[AUTHDBG] LoginScreen.promptAsync start', {
        redirectUri: proxyUrl,
        appReturnUrl,
        authUrl,
        responseType: ResponseType.Token,
        usePKCE: false,
      });

      const promptResult = await WebBrowser.openAuthSessionAsync(
        authUrl,
        appReturnUrl,
        {
          preferEphemeralSession: false,
        },
      );
      let parsedResult: AuthSessionResult;
      let successPromptResultRaw: typeof promptResult | null = null;

      if (promptResult.type === 'success' && request) {
        successPromptResultRaw = promptResult;
        parsedResult = request.parseReturnUrl(promptResult.url);
      } else {
        switch (promptResult.type) {
          case 'cancel':
          case 'dismiss':
          case 'opened':
          case 'locked':
            parsedResult = { type: promptResult.type };
            break;
          default:
            parsedResult = { type: 'cancel' };
            break;
        }
      }

      const successPromptResult =
        parsedResult.type === 'success' ? parsedResult : null;

      setAuthResponse(parsedResult);

      logger.auth.info('[AUTHDBG] LoginScreen.promptAsync result', {
        type: parsedResult.type,
        rawType: promptResult.type,
        rawUrl: successPromptResultRaw?.url ?? null,
        url: successPromptResult?.url ?? null,
        params: successPromptResult?.params ?? null,
        errorCode:
          'errorCode' in parsedResult ? (parsedResult.errorCode ?? null) : null,
        hasAuthentication: !!successPromptResult?.authentication,
        accessTokenPreview:
          redact(successPromptResult?.authentication?.accessToken) ??
          redact(
            typeof successPromptResult?.params.access_token === 'string'
              ? successPromptResult.params.access_token
              : null,
          ),
      });
    } finally {
      authSessionActiveRef.current = false;
      setIsPromptingAuth(false);
      logger.auth.info('[AUTHDBG] LoginScreen.promptAsync finally');
    }
  };

  useEffect(() => {
    logger.auth.info('[AUTHDBG] LoginScreen auth request state', {
      hasRequest: !!request,
      responseType: authResponse?.type ?? null,
      loadedResponseType: response?.type ?? null,
      redirectUri: proxyUrl,
      appReturnUrl,
      platform: Platform.OS,
    });
  }, [request, response, authResponse]);

  useEffect(() => {
    if (authResponse?.type === 'success') {
      void handleAuth();
      return;
    }

    if (authResponse) {
      logger.auth.warn('[AUTHDBG] LoginScreen non-success auth response', {
        responseType: authResponse.type,
        responseUrl: null,
        responseParams: null,
        errorCode:
          'errorCode' in authResponse ? (authResponse.errorCode ?? null) : null,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authResponse]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['rgba(34,197,94,0.16)', 'rgba(34,197,94,0.03)', 'transparent']}
        locations={[0, 0.35, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        pointerEvents="none"
        style={styles.accentGlow}
      />

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
              <Text
                type="4xl"
                weight="bold"
                color="gray.text"
                align="center"
                variant="display"
              >
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
              onPress={() => {
                void handleContinueWithTwitch();
              }}
              disabled={!request || isPromptingAuth}
              style={[
                styles.loginButton,
                (!request || isPromptingAuth) && styles.loginButtonDisabled,
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
  container: {
    flex: 1,
    backgroundColor: theme.color.background.dark,
  },
  accentGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.space36,
  },
  innerContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    paddingHorizontal: theme.space28,
    paddingVertical: theme.space44,
    width: '100%',
    maxWidth: 400,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.space56,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderCurve: 'continuous',
    marginBottom: theme.space36,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.space16,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.space20,
    color: theme.color.textSecondary.dark,
    lineHeight: 24,
    maxWidth: screenWidth * 0.8,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.space44,
  },
  loginButton: {
    backgroundColor: '#9146ff',
    paddingVertical: theme.space28,
    paddingHorizontal: theme.space44,
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    borderColor: '#a970ff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 12px 32px rgba(145, 70, 255, 0.26)',
    minHeight: 56,
    width: '100%',
    maxWidth: 300,
  },
  loginButtonDisabled: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.color.border.dark,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresSection: {
    alignItems: 'center',
    borderTopColor: theme.color.border.dark,
    borderTopWidth: 1,
    opacity: 0.88,
    paddingTop: theme.space28,
    width: '100%',
  },
  featuresList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.space12,
    paddingHorizontal: theme.space16,
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colorDarkGreen,
    marginRight: theme.space16,
  },
});
