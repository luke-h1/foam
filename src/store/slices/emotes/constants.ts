/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
export const FREQUENTLY_USED_EMOTES_LIMIT = 36;

export enum MessagePartType {
  TEXT = 0,
  MENTION = 4,
  LINK = 5,
  TWITCH_EMOTE = 6,
  TWITCH_CLIP = 7,
  TWITCH_VIDEO = 8,

  BTTV_EMOTE = 101,
  FFZ_EMOTE = 102,
  STV_EMOTE = 103,
  EMOJI = 104,
}

// TODO: convert to string literal
export enum EmoteType {
  Twitch = MessagePartType.TWITCH_EMOTE,
  Bttv = MessagePartType.BTTV_EMOTE,
  Ffz = MessagePartType.FFZ_EMOTE,
  Stv = MessagePartType.STV_EMOTE,
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
