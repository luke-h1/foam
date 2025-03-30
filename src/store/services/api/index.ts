import axios from 'axios';

// Twitch Helix API
export const twitchApi = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
  },
});

// twitch badge API
export const twitchBadgeApi = axios.create({
  baseURL: 'https://badges.twitch.tv/v1/badges',
});

// Better Twitch TV API
export const bttvApi = axios.create({
  baseURL: 'https://api.betterttv.net/3',
});

// cached bttv emote API
export const bttvCachedApi = axios.create({
  baseURL: 'https://api.betterttv.net/3/cached',
});

// Seven TV API
export const sevenTvApi = axios.create({
  baseURL: 'https://7tv.io/v3',
});

// FrankerzFaceZ API
export const ffzApi = axios.create({
  baseURL: 'https://api.frankerfacez.com/v1',
});

// chatterino API
export const chatterinoApi = axios.create({
  baseURL: 'http://localhost:1234',
});
