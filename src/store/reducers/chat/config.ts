import { OmitStrict } from '@app/types/util';
import { Channel } from './types';
import { MessagePartType } from './util/messages/types/messages';

export const CHANNEL_MESSAGES_LIMIT_DEFAULT = 500;
export const CHANNEL_USERS_LIMIT = 500;
export const CHANNEL_RECENT_INPUTS_LIMIT = 50;

export const CHANNEL_INITIAL_STATE: OmitStrict<Channel, 'name'> = {
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

export const FREQUENTLY_USED_EMOTES_LIMIT = 36;

// TODO: convert to string literal
export enum EmoteType {
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  Twitch = MessagePartType.TWITCH_EMOTE,
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  Bttv = MessagePartType.BTTV_EMOTE,
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  Ffz = MessagePartType.FFZ_EMOTE,
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  Stv = MessagePartType.STV_EMOTE,
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  Emoji = MessagePartType.EMOJI,
}

// https://github.com/FrankerFaceZ/Add-Ons/blob/master/src/ffzap-bttv/index.js#L218
export const BTTV_EMOTES_MODIFIERS: Record<string, string> = {
  cvMask: '3px 0 0 0',
  cvHazmat: '3px 0 0 0',

  // Christmas emotes
  SoSnowy: '2px 0 0 0',
  IceCold: '2px 0 0 0',
  TopHat: '0',
  SantaHat: '0',
  ReinDeer: '0',
  CandyCane: '0',
};

// https://github.com/FrankerFaceZ/FrankerFaceZ/blob/master/src/modules/chat/emotes.js#L20
export const FFZ_EMOTES_MODIFIERS: Record<string, string> = {
  59847: '0 15px 15px 0',
  70852: '0 5px 20px 0',
  70854: '30px 0 0',
  147049: '4px 1px 0 3px',
  147011: '0',
  70864: '0',
  147038: '0',
};

export const DEFAULT_TWITCH_TEMPLATE =
  'https://static-cdn.jtvnw.net/emoticons/v2/{{id}}/{{format}}/{{theme_mode}}/{{scale}}';
