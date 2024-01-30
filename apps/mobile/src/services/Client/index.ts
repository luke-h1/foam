import axios from 'axios';

export const bttvApi = axios.create({
  baseURL: 'https://api.betterttv.net',
});

export const sevenTvApi = axios.create({
  baseURL: 'https://7tv.io/v3',
});

export const twitchApi = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
  },
});

export const twitchBadgeApi = axios.create({
  baseURL: 'https://badges.twitch.tv/v1/badges',
});

export const ffzApi = axios.create({
  baseURL: 'https://api.frankerfacez.com/v1',
});

export const ffzEmoteApi = axios.create({
  baseURL: 'https://api.betterttv.net/3/cached/frankerfacez',
});

export const bttvEmoteApi = axios.create({
  baseURL: 'https://api.betterttv.net/3/cached',
});
