import Client from './Client';

// helix API
export const twitchApi = new Client({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
  },
});

// emotes + badge APIs

// bttv emote API (un-cached)
export const bttvApi = new Client({
  baseURL: 'https://api.betterttv.net',
});

// bttv API (cached)
export const bttvCachedApi = new Client({
  baseURL: 'https://api.betterttv.net/3/cached',
});

// 7tv API
export const sevenTvApi = new Client({
  baseURL: 'https://7tv.io/v3',
});

// twitch badge API
export const twitchBadgeApi = new Client({
  baseURL: 'https://badges.twitch.tv/v1/badges',
});

// frankerzface API (uncached)
export const ffzApi = new Client({
  baseURL: 'https://api.frankerfacez.com/v1',
});

// frankerzface API (cached)
export const ffzCachedApi = new Client({
  baseURL: 'https://api.betterttv.net/3/cached/frankerfacez',
});
