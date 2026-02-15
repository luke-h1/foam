import {
  AuthRequestConfig,
  DiscoveryDocument,
  useAuthRequest,
} from 'expo-auth-session';
import Constants from 'expo-constants';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Twitch OAuth (implicit flow).
 * - Native: redirect_uri is foam://auth. On device, system browser redirects back to app (Linking).
 *   On simulator, we open auth in an in-app WebView and intercept foam://auth to mimic the same flow.
 * - Web: redirect to auth proxy (AUTH_PROXY_API_BASE_URL/pending).
 */
const FOAM_AUTH_REDIRECT_URI = 'foam://auth';

const USER_SCOPES = [
  'user:read:follows',
  'user:read:blocked_users',
  'user:read:emotes',
  'user:manage:blocked_users',
  'user:manage:chat_color',
  'user:read:subscriptions',
] as const;

const CHANNEL_SCOPES = [
  'channel:read:polls',
  'channel:read:predictions',
  'channel:moderate',
] as const;

const CHAT_SCOPES = ['chat:read', 'chat:edit'] as const;
const WHISPER_SCOPES = ['whispers:read', 'whispers:edit'] as const;
const MODERATOR_SCOPES = [
  'moderator:read:chatters',
  'moderator:read:followers',
] as const;

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
const proxyBase = process.env.AUTH_PROXY_API_BASE_URL;
const proxyUrl =
  proxyBase != null
    ? new URL(
        Platform.OS === 'web' ? `${proxyBase}/pending` : `${proxyBase}/proxy`,
      ).toString()
    : '';

function getRedirectUri(): string {
  if (!isNative) return proxyUrl || FOAM_AUTH_REDIRECT_URI;
  return FOAM_AUTH_REDIRECT_URI;
}

export const isSimulator = isNative && !Constants.isDevice;

const twitchConfig: AuthRequestConfig = {
  clientId:
    (Constants.expoConfig?.extra?.TWITCH_CLIENT_ID as string | undefined) ??
    process.env.TWITCH_CLIENT_ID,
  clientSecret:
    (Constants.expoConfig?.extra?.TWITCH_CLIENT_SECRET as string | undefined) ??
    process.env.TWITCH_CLIENT_SECRET,
  scopes: [
    ...USER_SCOPES,
    ...CHAT_SCOPES,
    ...WHISPER_SCOPES,
    ...CHANNEL_SCOPES,
    ...MODERATOR_SCOPES,
  ],
  responseType: 'token',
  redirectUri: getRedirectUri(),
  usePKCE: true,
  extraParams: {
    force_verify: 'true',
  },
};

const twitchDiscovery: DiscoveryDocument = {
  authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
  tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
  revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
};

export function useTwitchOauth() {
  const [request, , promptTwitchAsync] = useAuthRequest(
    twitchConfig,
    twitchDiscovery,
  );

  useEffect(() => {
    console.warn('[Auth:OAuth] useTwitchOauth mount', {
      isSimulator,
      hasRequest: !!request,
      platform: Platform.OS,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      isDevice: Constants.isDevice,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulator, request]);

  const getAuthUrlAsync = useCallback(async () => {
    console.warn('[Auth:OAuth] getAuthUrlAsync called', {
      hasRequest: !!request,
    });
    if (!request) {
      console.warn(
        '[Auth:OAuth] getAuthUrlAsync: request is null, returning null',
      );
      return null;
    }
    try {
      const url = await request.makeAuthUrlAsync(twitchDiscovery);
      console.warn('[Auth:OAuth] getAuthUrlAsync result', {
        hasUrl: !!url,
        urlSafe: url?.slice(0, 100),
      });
      return url;
    } catch (e) {
      console.warn('[Auth:OAuth] getAuthUrlAsync throw', e);
      return null;
    }
  }, [request]);

  return {
    promptTwitchAsync,
    getAuthUrlAsync,
    isSimulator,
  };
}
