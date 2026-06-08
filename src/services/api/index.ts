import Constants from 'expo-constants';
import Client from './Client';
import { chatFetch } from './fetch';
import { createLoggerInterceptor } from './interceptors/loggerInterceptor';
import { createTracingInterceptor } from './interceptors/tracingInterceptor';

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

const twitchHelixClientOptions = {
  baseURL: twitchApiBaseUrl,
  headers: {
    'Client-ID': twitchClientId,
  },
  requestInterceptors: [createLoggerInterceptor('twitch')],
  responseInterceptors: [createTracingInterceptor],
};

export const twitchApi = new Client(twitchHelixClientOptions);

export const twitchChatApi = new Client({
  ...twitchHelixClientOptions,
  fetchFn: chatFetch,
});

const twitchAuthClients = [twitchApi, twitchChatApi] as const;

export function setTwitchApiAuthToken(token: string): void {
  twitchAuthClients.forEach(client => {
    client.setAuthToken(token);
  });
}

export function removeTwitchApiAuthToken(): void {
  twitchAuthClients.forEach(client => {
    client.removeAuthToken();
  });
}

export const bttvCachedApi = new Client({
  baseURL: 'https://api.betterttv.net/3/cached',
  fetchFn: chatFetch,
  requestInterceptors: [createLoggerInterceptor('bttv')],
  responseInterceptors: [createTracingInterceptor],
});

export const sevenTvApi = new Client({
  baseURL: 'https://7tv.io/v3',
  fetchFn: chatFetch,
  requestInterceptors: [createLoggerInterceptor('stv')],
  responseInterceptors: [createTracingInterceptor],
});

export const ffzApi = new Client({
  baseURL: 'https://api.frankerfacez.com/v1',
  fetchFn: chatFetch,
  requestInterceptors: [createLoggerInterceptor('ffz')],
  responseInterceptors: [createTracingInterceptor],
});
