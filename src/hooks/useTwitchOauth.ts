import { useAuthContext } from '@app/context';
import { logger } from '@app/utils/logger';
import {
  AuthRequestConfig,
  DiscoveryDocument,
  useAuthRequest,
} from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { InteractionManager, Platform } from 'react-native';
import { useAsyncEffect } from './useAsyncEffect';

/**
 * Experimental oauth hook
 * crashes the app with UIViewControllerHierarchyInconsistency at the moment
 */

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
    native: `${process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL}/proxy`,
    default: `${process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL}/pending`,
    web: `${process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL}/pending`,
    ios: `${process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL}/proxy`,
  }),
).toString();

const twitchConfig: AuthRequestConfig = {
  clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
  clientSecret: process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET,
  scopes: [
    ...USER_SCOPES,
    ...CHAT_SCOPES,
    ...WHISPER_SCOPES,
    ...CHANNEL_SCOPES,
  ],
  responseType: 'token',
  redirectUri: proxyUrl,
  /**
   * Enable PKCE (Proof Key for Code Exchange) to prevent another app from intercepting the redirect request.
   */
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
  const router = useRouter();
  const { loginWithTwitch } = useAuthContext();
  const [twitchRequest, twitchResponse, promptTwitchAsync] = useAuthRequest(
    twitchConfig,
    twitchDiscovery,
  );

  const signInWithTwitch = async () => {
    try {
      if (!twitchRequest) {
        logger.auth.error('no twitch request');
        return;
      }
      await loginWithTwitch(twitchResponse);

      if (twitchResponse?.type === 'success') {
        // Wait for any pending interactions to complete before navigating
        InteractionManager.runAfterInteractions(() => {
          router.push('/(tabs)/following');
        });
      }
    } catch (error) {
      logger.auth.error('Failed to sign in with twitch', error);
    }
  };

  useAsyncEffect(async () => {
    if (twitchResponse && twitchResponse?.type === 'success') {
      await signInWithTwitch();
    }
  }, [twitchResponse]);

  return {
    promptTwitchAsync,
    twitchResponse,
  };
}
