import Constants from 'expo-constants';
import Client from './Client';
import { createLoggerInterceptor } from './interceptors';

// Get mock server URL from Expo config (only set for E2E variant)
export const mockServerUrl = Constants.expoConfig?.extra?.MOCK_SERVER_URL as
  | string
  | undefined;

export const isE2EMode = !!mockServerUrl;

// Use mock server for E2E tests, otherwise use real Twitch API
const twitchApiBaseUrl = mockServerUrl
  ? `${mockServerUrl}/helix`
  : 'https://api.twitch.tv/helix';

// Twitch Helix API
export const twitchApi = new Client({
  baseURL: twitchApiBaseUrl,
  headers: {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
  },
  requestInterceptors: [createLoggerInterceptor('twitch')],
});

export const twitchBadgeApi = new Client({
  baseURL: 'https://badges.twitch.tv/v1/badges',
  requestInterceptors: [createLoggerInterceptor('twitch')],
});

// Better Twitch TV API
export const bttvApi = new Client({
  baseURL: 'https://api.betterttv.net',
  requestInterceptors: [createLoggerInterceptor('bttv')],
});

// cached Better Twitch TV emote API
export const bttvCachedApi = new Client({
  baseURL: 'https://api.betterttv.net/3/cached',
  requestInterceptors: [createLoggerInterceptor('api')],
});

// Seven TV API
export const sevenTvApi = new Client({
  baseURL: 'https://7tv.io/v3',
  requestInterceptors: [createLoggerInterceptor('stv')],
});

// FrankerzFaceZ API
export const ffzApi = new Client({
  baseURL: 'https://api.frankerfacez.com/v1',
  requestInterceptors: [createLoggerInterceptor('ffz')],
});

// FrankerzFaceZ cached emote API
export const ffzEmoteApi = new Client({
  baseURL: 'https://api.betterttv.net/3/cached/frankerfacez',
  requestInterceptors: [createLoggerInterceptor('ffz')],
});
