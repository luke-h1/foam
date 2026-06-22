import Constants from 'expo-constants';

import { createApiClient } from './Client';

export const mockServerUrl = Constants.expoConfig?.extra?.MOCK_SERVER_URL as
  | string
  | undefined;

export const isE2EMode = !!mockServerUrl;

const twitchApiBaseUrl = mockServerUrl
  ? `${mockServerUrl}/helix`
  : 'https://api.twitch.tv/helix';

const envTwitchClientId =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_TWITCH_CLIENT_ID as
    | string
    | undefined) ?? process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID;

let currentTwitchClientId = envTwitchClientId;

export const getTwitchClientId = () => currentTwitchClientId;

export const twitchApi = createApiClient({
  baseURL: twitchApiBaseUrl,
  headers: { 'Client-ID': envTwitchClientId ?? '' },
  logPrefix: 'twitch',
  requiresAuth: true,
});

/**
 * Helix rejects requests whose Client-Id header does not match the client the
 * token was issued for. Anonymous tokens come from the auth proxy and may be
 * issued under a different client ID than EXPO_PUBLIC_TWITCH_CLIENT_ID, so we
 * sync the header to the active token's client ID.
 */
export function setTwitchClientId(clientId: string) {
  currentTwitchClientId = clientId;
  twitchApi.setDefaultHeader('Client-ID', clientId);
}

export const bttvCachedApi = createApiClient({
  baseURL: 'https://api.betterttv.net/3/cached',
  logPrefix: 'bttv',
});

export const sevenTvApi = createApiClient({
  baseURL: 'https://7tv.io/v3',
  logPrefix: 'stv',
});

export const ffzApi = createApiClient({
  baseURL: 'https://api.frankerfacez.com/v1',
  logPrefix: 'ffz',
});

export const streamElementsApi = createApiClient({
  baseURL: 'https://api.streamelements.com/kappa/v2',
  logPrefix: 'streamElements',
});
