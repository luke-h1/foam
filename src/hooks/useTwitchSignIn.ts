import { useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  type AuthSessionResult,
  DiscoveryDocument,
  ResponseType,
  useAuthRequest,
} from 'expo-auth-session';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { toast } from 'sonner-native';

import { useAuthContext } from '@app/context/AuthContext';
import i18next from '@app/i18n/i18next';
import { logger } from '@app/utils/logger';

const USER_SCOPES = [
  'user:read:follows',
  'user:read:blocked_users',
  'user:read:emotes',
  'user:manage:blocked_users',
] as const;

const CHANNEL_SCOPES = [
  'channel:read:polls',
  'channel:read:predictions',
  'channel:read:redemptions',
  'channel:moderate',
] as const;

const CLIP_SCOPES = [
  'channel:manage:clips',
  'editor:manage:clips',
  'clips:edit',
] as const;

const CHAT_SCOPES = ['chat:read', 'chat:edit', 'user:write:chat'] as const;

const MODERATOR_CHAT_SCOPES = [
  'moderator:read:chat_messages',
  'moderator:manage:chat_messages',
] as const;

const MODERATION_SCOPES = [
  'moderator:manage:banned_users',
  'moderator:manage:shield_mode',
  'moderator:manage:announcements',
  'moderator:manage:shoutouts',
  'moderator:manage:warnings',
  'moderator:manage:chat_settings',
] as const;

const WHISPER_SCOPES = ['whispers:read', 'whispers:edit'] as const;

const authProxyBaseUrl =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL as
    string | undefined) ?? process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL;

const proxyUrl = new URL(
  Platform.select({
    native: `${authProxyBaseUrl}/proxy`,
    default: `${authProxyBaseUrl}/pending`,
    web: `${authProxyBaseUrl}/pending`,
    ios: `${authProxyBaseUrl}/proxy`,
  }),
).toString();

function getWebAuthRedirectUrl() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/auth`;
  }

  return 'https://foam-app.com/auth';
}

const redirectUri = Platform.OS === 'web' ? getWebAuthRedirectUrl() : proxyUrl;
const appReturnUrl =
  Platform.OS === 'web' ? getWebAuthRedirectUrl() : 'foam://auth';

const discovery = {
  authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
  revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
  tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
} satisfies DiscoveryDocument;

WebBrowser.maybeCompleteAuthSession();

interface UseTwitchSignInOptions {
  onSuccess?: () => Promise<void> | void;
}

export function useTwitchSignIn(options: UseTwitchSignInOptions = {}) {
  const { loginWithTwitch } = useAuthContext();
  const { onSuccess } = options;
  const authSessionActiveRef = useRef(false);
  const handledAuthResponseKeyRef = useRef<string | null>(null);
  const [isPromptingAuth, setIsPromptingAuth] = useState(false);
  const [authResponse, setAuthResponse] = useState<AuthSessionResult | null>(
    null,
  );

  const [request] = useAuthRequest(
    {
      clientId:
        (Constants.expoConfig?.extra?.EXPO_PUBLIC_TWITCH_CLIENT_ID as
          string | undefined) ?? process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      scopes: [
        ...USER_SCOPES,
        ...CHAT_SCOPES,
        ...MODERATOR_CHAT_SCOPES,
        ...MODERATION_SCOPES,
        ...WHISPER_SCOPES,
        ...CHANNEL_SCOPES,
        ...CLIP_SCOPES,
      ],
      responseType: ResponseType.Token,
      redirectUri,
      usePKCE: false,
      extraParams: {
        force_verify: 'true',
      },
    },
    discovery,
  );

  const completeAuth = async (nextResponse: AuthSessionResult | null) => {
    if (nextResponse?.type !== 'success') {
      await loginWithTwitch(nextResponse);

      const hasAuthentication = nextResponse
        ? 'authentication' in nextResponse && !!nextResponse.authentication
        : false;

      logger.auth.warn(
        `Twitch sign in event: ${nextResponse?.type || 'unknownAuthEvent'}`,
        {
          name: 'auth_warning',
          error: nextResponse,
          category: 'Auth',
          action: 'login_event_non_success',
          responseType: nextResponse?.type ?? 'unknownAuthEvent',
          hasAuthentication,
        },
      );
      return;
    }

    await loginWithTwitch(nextResponse);

    const hasAuthentication =
      'authentication' in nextResponse && !!nextResponse.authentication;

    logger.auth.info('Twitch sign in succeeded', {
      name: 'auth_info',
      category: 'Auth',
      action: 'login_success',
      responseType: nextResponse.type,
      hasAuthentication,
    });
    toast.success(i18next.t('auth:loggedIn'));

    if (onSuccess) {
      await onSuccess();
      return;
    }

    router.replace('/tabs/following');
  };

  const startSignIn = async () => {
    if (!request || authSessionActiveRef.current) {
      if (!request) {
        toast.error(i18next.t('auth:signInNotReady'));
      }
      return;
    }

    authSessionActiveRef.current = true;
    setIsPromptingAuth(true);

    const endPrompt = () => {
      authSessionActiveRef.current = false;
      setIsPromptingAuth(false);
    };

    try {
      const authUrl =
        request.url ?? (await request.makeAuthUrlAsync(discovery));

      const promptResult = await WebBrowser.openAuthSessionAsync(
        authUrl,
        appReturnUrl,
        {
          preferEphemeralSession: false,
        },
      );
      let parsedResult: AuthSessionResult;
      if (promptResult.type === 'success') {
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

      if (parsedResult.type === 'success') {
        const successAuthResponseKey =
          parsedResult.url ||
          parsedResult.authentication?.accessToken ||
          (typeof parsedResult.params.access_token === 'string'
            ? parsedResult.params.access_token
            : null);

        if (
          successAuthResponseKey &&
          handledAuthResponseKeyRef.current !== successAuthResponseKey
        ) {
          handledAuthResponseKeyRef.current = successAuthResponseKey;
          await completeAuth(parsedResult);
          setAuthResponse(null);
          endPrompt();
          return;
        }
      }

      setAuthResponse(parsedResult);
    } catch (error) {
      logger.auth.warn('Twitch sign-in prompt failed', {
        name: 'twitch_sign_in_warning',
        error,
        action: 'prompt_failed',
      });
      toast.error(i18next.t('auth:signInFailed'));
    }

    endPrompt();
  };

  const authResponseRef = useRef(authResponse);
  authResponseRef.current = authResponse;

  return {
    isPromptingAuth,
    isSignInReady: !!request,
    startSignIn,
  };
}
