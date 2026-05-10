import { useAuthContext } from '@app/context/AuthContext';
import { sentryService } from '@app/services/sentry-service';
import { logger } from '@app/utils/logger';
import {
  type AuthSessionResult,
  ResponseType,
  useAuthRequest,
} from 'expo-auth-session';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
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

const discovery = {
  authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
  revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
} as const;

const redact = (value: string | null | undefined) =>
  value ? `${value.slice(0, 8)}...` : null;

WebBrowser.maybeCompleteAuthSession();

export function useTwitchSignIn() {
  const { loginWithTwitch } = useAuthContext();
  const authSessionActiveRef = useRef(false);
  const handledAuthResponseKeyRef = useRef<string | null>(null);
  const [isPromptingAuth, setIsPromptingAuth] = useState(false);
  const [authResponse, setAuthResponse] = useState<AuthSessionResult | null>(
    null,
  );

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

  const completeAuth = useCallback(
    async (nextResponse: AuthSessionResult | null) => {
      const successResponse =
        nextResponse?.type === 'success' ? nextResponse : null;

      logger.auth.info('[AUTHDBG] useTwitchSignIn.completeAuth start', {
        responseType: nextResponse?.type ?? null,
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

      await loginWithTwitch(nextResponse);

      if (nextResponse?.type === 'success') {
        sentryService.captureMessage('LoginSuccess');
        toast.success('Logged in');
        logger.auth.info('[AUTHDBG] useTwitchSignIn success, routing');

        router.replace('/tabs/following');
      }

      sentryService.captureMessage(nextResponse?.type || 'unknownAuthEvent');
    },
    [loginWithTwitch],
  );

  const startSignIn = useCallback(async () => {
    if (!request || authSessionActiveRef.current) {
      logger.auth.info('[AUTHDBG] useTwitchSignIn prompt blocked', {
        hasRequest: !!request,
        authSessionActive: authSessionActiveRef.current,
      });

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
      logger.auth.info('[AUTHDBG] useTwitchSignIn prompt start', {
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

      if (promptResult.type === 'success') {
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

      logger.auth.info('[AUTHDBG] useTwitchSignIn prompt result', {
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
      logger.auth.info('[AUTHDBG] useTwitchSignIn prompt finally');
    }
  }, [request]);

  useEffect(() => {
    logger.auth.info('[AUTHDBG] useTwitchSignIn request state', {
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
      const authResponseKey =
        authResponse.url ||
        authResponse.authentication?.accessToken ||
        (typeof authResponse.params.access_token === 'string'
          ? authResponse.params.access_token
          : null);

      if (
        authResponseKey &&
        handledAuthResponseKeyRef.current === authResponseKey
      ) {
        setAuthResponse(null);
        return;
      }

      handledAuthResponseKeyRef.current = authResponseKey;
      setAuthResponse(null);
      void completeAuth(authResponse);
      return;
    }

    if (authResponse) {
      logger.auth.warn('[AUTHDBG] useTwitchSignIn non-success auth response', {
        responseType: authResponse.type,
        responseUrl: null,
        responseParams: null,
        errorCode:
          'errorCode' in authResponse ? (authResponse.errorCode ?? null) : null,
      });
    }
  }, [authResponse, completeAuth]);

  return {
    isPromptingAuth,
    isSignInReady: !!request,
    startSignIn,
  };
}
