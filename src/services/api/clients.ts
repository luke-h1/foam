import Constants from 'expo-constants';
import { createApiClient } from './Client';

export const mockServerUrl = Constants.expoConfig?.extra?.MOCK_SERVER_URL as
  | string
  | undefined;

export const isE2EMode = !!mockServerUrl;

const twitchApiBaseUrl = mockServerUrl
  ? `${mockServerUrl}/helix`
  : 'https://api.twitch.tv/helix';

export const twitchClientId =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_TWITCH_CLIENT_ID as
    | string
    | undefined) ?? process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID;

export const twitchApi = createApiClient({
  baseURL: twitchApiBaseUrl,
  headers: { 'Client-ID': twitchClientId ?? '' },
  logPrefix: 'twitch',
});

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
