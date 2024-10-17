import Client from './Client';

// Twitch Helix API
export const twitchApi = new Client({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
  },
});
