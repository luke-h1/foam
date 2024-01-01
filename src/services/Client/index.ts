import axios from 'axios';

export const bttvApi = axios.create({
  baseURL: 'https://api.betterttv.net',
});

export const sevenTvApi = axios.create({
  baseURL: 'https://api.7tv.app/v2',
});

export const twitchApi = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
  },
});

export const ffzApi = axios.create({
  baseURL: 'https://api.frankerfacez.com/v1',
});
