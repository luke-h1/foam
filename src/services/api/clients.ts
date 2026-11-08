import { SEVEN_TV_GQL_BASE_URL } from '@app/constants/emote-providers';
import { logger } from '@app/utils/logger';

import { createApiClient } from './client';
import { envTwitchClientId, mockServerUrl } from './env';
import { validateTwitchToken } from './twitch-token-validation';

const twitchApiBaseUrl = mockServerUrl
  ? `${mockServerUrl}/helix`
  : 'https://api.twitch.tv/helix';

let currentTwitchClientId = envTwitchClientId;

export const getTwitchClientId = () => currentTwitchClientId;

async function recoverTwitchClientId(body: string): Promise<boolean> {
  if (!body.includes('Client ID and OAuth token do not match')) {
    return false;
  }

  const token = twitchApi.getAuthToken();

  if (!token) {
    return false;
  }

  const clientId = await validateTwitchToken(token).then(
    validation => validation?.clientId,
    (error: unknown) => {
      logger.auth.warn('failed to fetch twitch token client id', {
        name: 'auth_warn',
        error: error instanceof Error ? error.message : String(error),
      });

      return undefined;
    },
  );

  if (clientId && clientId !== currentTwitchClientId) {
    setTwitchClientId(clientId);
    return true;
  }

  return false;
}

export const twitchApi = createApiClient({
  baseURL: twitchApiBaseUrl,
  headers: { 'Client-ID': envTwitchClientId },
  provider: 'twitch',
  requiresAuth: true,
  onUnauthorized: recoverTwitchClientId,
});

/**
 * Helix rejects a Client-Id header that mismatches the token's client; sync
 * the header to the active token's client ID.
 */
export function setTwitchClientId(clientId: string) {
  currentTwitchClientId = clientId;
  twitchApi.setDefaultHeader('Client-ID', clientId);
}

export const bttvCachedApi = createApiClient({
  baseURL: 'https://api.betterttv.net/3/cached',
  provider: 'bttv',
});

export const sevenTvApi = createApiClient({
  baseURL: 'https://7tv.io/v3',
  provider: '7tv',
});

export const sevenTvGqlApi = createApiClient({
  baseURL: SEVEN_TV_GQL_BASE_URL,
  provider: '7tv',
});

/**
 * FFZ answers 404 "No such room" for a channel that never set up FFZ. That is
 * an empty result, not a failure.
 */
export function isFfzNoSuchRoom(status: number, body: string): boolean {
  return status === 404 && body.includes('No such room');
}

export const ffzApi = createApiClient({
  baseURL: 'https://api.frankerfacez.com/v1',
  provider: 'ffz',
  isExpectedFailure: isFfzNoSuchRoom,
});

/**
 * StreamElements answers 404 for a channel that never used it.
 */
export function isStreamElementsNoData(status: number): boolean {
  return status === 404;
}

export const streamElementsApi = createApiClient({
  baseURL: 'https://api.streamelements.com/kappa/v2',
  provider: 'streamelements',
  isExpectedFailure: isStreamElementsNoData,
});
