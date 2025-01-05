import axios from 'axios';
import Client from './Client';

// Twitch Helix API
export const twitchApi = new Client({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
  },
});

// twitch badge API
export const twitchBadgeApi = axios.create({
  baseURL: 'https://badges.twitch.tv/v1/badges',
});

// Better Twitch TV API
export const bttvApi = axios.create({
  baseURL: 'https://api.betterttv.net',
});

// Seven TV V3 API
export const sevenTvApi = axios.create({
  baseURL: 'https://7tv.io/v3',
});

// FrankerzFaceZ API
export const ffzApi = axios.create({
  baseURL: 'https://api.frankerfacez.com/v1',
});
