import Constants from 'expo-constants';
import Client from './Client';
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
  (Constants.expoConfig?.extra?.TWITCH_CLIENT_ID as string | undefined) ??
  process.env.TWITCH_CLIENT_ID;

export const twitchApi = new Client({
  baseURL: twitchApiBaseUrl,
  headers: {
    'Client-ID': twitchClientId,
  },
  requestInterceptors: [createLoggerInterceptor('twitch')],
  responseInterceptors: [createTracingInterceptor],
});

export const twitchBadgeApi = new Client({
  baseURL: 'https://badges.twitch.tv/v1/badges',
  requestInterceptors: [createLoggerInterceptor('twitch')],
  responseInterceptors: [createTracingInterceptor],
});

export const bttvApi = new Client({
  baseURL: 'https://api.betterttv.net',
  requestInterceptors: [createLoggerInterceptor('bttv')],
  responseInterceptors: [createTracingInterceptor],
});

export const bttvCachedApi = new Client({
  baseURL: 'https://api.betterttv.net/3/cached',
  requestInterceptors: [createLoggerInterceptor('api')],
  responseInterceptors: [createTracingInterceptor],
});

export const sevenTvApi = new Client({
  baseURL: 'https://7tv.io/v3',
  requestInterceptors: [createLoggerInterceptor('stv')],
  responseInterceptors: [createTracingInterceptor],
});

export const ffzApi = new Client({
  baseURL: 'https://api.frankerfacez.com/v1',
  requestInterceptors: [createLoggerInterceptor('ffz')],
  responseInterceptors: [createTracingInterceptor],
});

export const ffzEmoteApi = new Client({
  baseURL: 'https://api.betterttv.net/3/cached/frankerfacez',
  requestInterceptors: [createLoggerInterceptor('ffz')],
  responseInterceptors: [createTracingInterceptor],
});
