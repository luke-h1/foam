import axios from 'axios';

export const bttvApi = axios.create({
  baseURL: 'https://api.betterttv.net',
});

export const sevenTvApi = axios.create({
  baseURL: 'https://api.7tv.app/v2',
});

export const twitchApi = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
});

export const ffzApi = axios.create({
  baseURL: 'https://api.frankerfacez.com/v1',
});
