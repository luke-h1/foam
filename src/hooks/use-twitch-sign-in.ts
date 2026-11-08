import { useRef, useState } from 'react';

import {
  type AuthSessionResult,
  type DiscoveryDocument,
  ResponseType,
  useAuthRequest,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { toast } from 'sonner-native';

import { useAuthContext } from '@app/context/AuthContext';
import {
  AUTH_APP_RETURN_URL,
  AUTH_REDIRECT_URI,
} from '@app/context/authLinking';
import { envTwitchClientId } from '@app/services/api/env';
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

const discovery = {
  authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
  revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
  tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
} satisfies DiscoveryDocument;

interface UseTwitchSignInOptions {
  onSuccess?: () => Promise<void> | void;
}

export function useTwitchSignIn(options: UseTwitchSignInOptions = {}) {
  const { loginWithTwitch } = useAuthContext();
  const { onSuccess } = options;
  const authSessionActiveRef = useRef(false);
  const [isPromptingAuth, setIsPromptingAuth] = useState(false);

  const [request] = useAuthRequest(
    {
      clientId: envTwitchClientId,
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
      redirectUri: AUTH_REDIRECT_URI,
      usePKCE: false,
      extraParams: {
        force_verify: 'true',
      },
    },
    discovery,
  );

  const completeAuth = async (nextResponse: AuthSessionResult) => {
    const result = await loginWithTwitch(nextResponse);

    if (!result.ok) {
      logger.auth.warn(`Twitch sign in event: ${nextResponse.type}`, {
        name: 'auth_warning',
        category: 'Auth',
        action: 'login_event_non_success',
        responseType: nextResponse.type,
        reason: result.reason,
      });

      return;
    }

    logger.auth.info('Twitch sign in succeeded', {
      name: 'auth_info',
      category: 'Auth',
      action: 'login_success',
      responseType: nextResponse.type,
    });

    toast.success('Logged in');
    await onSuccess?.();
  };

  const startSignIn = async () => {
    if (!request) {
      toast.error('Twitch sign-in is not ready yet');
      return;
    }

    if (authSessionActiveRef.current) {
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
        AUTH_APP_RETURN_URL,
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

      await completeAuth(parsedResult);
    } catch (error) {
      logger.auth.warn('Twitch sign-in prompt failed', {
        name: 'twitch_sign_in_warning',
        error,
        action: 'prompt_failed',
      });
      toast.error('Twitch sign-in failed. Please try again.');
    }

    endPrompt();
  };

  return {
    isPromptingAuth,
    isSignInReady: !!request,
    startSignIn,
  };
}
