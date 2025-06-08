import Client from './Client';
import { createLoggerInterceptor } from './interceptors';

// Twitch Helix API
export const twitchApi = new Client({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.TWITCH_CLIENT_ID as string,
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
