import { Channel } from './types';

export const CHANNEL_MESSAGES_LIMIT_DEFAULT = 500;
export const CHANNEL_USERS_LIMIT = 500;
export const CHANNEL_RECENT_INPUTS_LIMIT = 50;

export const CHANNEL_INITIAL_STATE: Omit<Channel, 'name'> = {
  messages: [],
  recentMessages: { status: 'idle' },
  ready: false,
  isFirstMessageAltBg: false,
  users: [],
  recentInputs: [],
  badges: {
    twitch: { status: 'idle' },
  },
  emotes: {
    bttv: { status: 'idle' },
    ffz: { status: 'idle' },
    stv: { status: 'idle' },
  },
};

export const SUGGESTION_TYPES = {
  users: {
    name: 'users',
    limit: 5,
    regex: /^@([\w\d_]*)$/,
  },
  emotes: {
    name: 'emotes',
    limit: 10,
    regex: /^:([\w\d_]{2,})$/,
  },
};
