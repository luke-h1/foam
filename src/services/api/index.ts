import Client from './Client';

// Twitch Helix API
export const twitchApi = new Client({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
  },
});

export const twitchBadgeApi = new Client({
  baseURL: 'https://badges.twitch.tv/v1/badges',
});

// Better Twitch TV API
export const bttvApi = new Client({
  baseURL: 'https://api.betterttv.net',
});

// cached Better Twitch TV emote API
export const bttvCachedApi = new Client({
  baseURL: 'https://api.betterttv.net/3/cached',
});

// Seven TV API
export const sevenTvApi = new Client({
  baseURL: 'https://7tv.io/v3',
});

// FrankerzFaceZ API
export const ffzApi = new Client({
  baseURL: 'https://api.frankerfacez.com/v1',
});

// FrankerzFaceZ cached emote API
export const ffzEmoteApi = new Client({
  baseURL: 'https://api.betterttv.net/3/cached/frankerfacez',
});

// IVR api - need to move to our own service. @see logs.ivr.fi & api.ivr.fi
//
export const ivrApi = new Client({
  baseURL: 'https://api.ivr.fi/v2',
});
