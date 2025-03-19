/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
import { TwitchEmote } from '../twitch';

export interface Emote<TValue> {
  entries: Record<string, TValue>;
  names: Record<string, string>;
}

export interface Emoji {
  category: number;
  sort: number;
  char: string;
  name: string | string[];
  codePoints: string;
  variants: string[];
}

export interface AllEmotes {
  twitch?: Emote<TwitchEmote>;
}

export interface HTMLEmote {
  id: string;
  title: string;
  alt: string;
  src: string;
  srcSet: string;
  sources: [mime: `image/${string}`, srcSet: string][];
  owner: {
    id?: string;
    name?: string;
    displayName?: string;
  };
}

export type EmoteType = 'Twitch';

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
export enum EmoteMessageType {
  Twitch = MessagePartType.TWITCH_EMOTE,
}
