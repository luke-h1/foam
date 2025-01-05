import { PrivateMessage } from '@twurple/chat';
import { MessageBadge } from './badges';

export enum MessageType {
  PRIVATE_MESSAGE = 0,
  NOTICE = 1,
  USER_NOTICE = 2,
}

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

export const IRCV3_KNOWN_COMMANDS = new Map([['PRIVMSG', PrivateMessage]]);

export interface MessagePartText {
  type: MessagePartType.TEXT;
  content: string;
}

interface MessagePartEmoteContent {
  id: string;
  modifiers: MessagePartEmoteModifier[];
}

// twitch emote message
export interface MessagePartTwitchEmote {
  type: MessagePartType.TWITCH_EMOTE;
  content: MessagePartEmoteContent;
}

// bttv emote
export interface MessagePartBttvEmote {
  type: MessagePartType.BTTV_EMOTE;
  content: MessagePartEmoteContent;
}

// ffz emote
export interface MessagePartFfzEmote {
  type: MessagePartType.FFZ_EMOTE;
  content: MessagePartEmoteContent;
}

// seven tv emote
export type MessagePartStvEmote = {
  type: MessagePartType.STV_EMOTE;
  content: MessagePartEmoteContent;
};

// emojicon emote
export type MessagePartEmoji = {
  type: MessagePartType.EMOJI;
  content: MessagePartEmoteContent;
};

// mention
export interface MessagePartMention {
  type: MessagePartType.MENTION;
  content: {
    displayText: string;
    recipient: string;
  };
}

// link
export interface MessagePartLink {
  type: MessagePartType.LINK;
  content: {
    displayText: string;
    url: string;
  };
}

// twitch clip
export type MessagePartTwitchClip = {
  type: MessagePartType.TWITCH_CLIP;
  content: {
    displayText: string;
    slug: string;
    url: string;
  };
};

// twitch video
export interface MessagePartTwitchVideo {
  type: MessagePartType.TWITCH_VIDEO;
  content: {
    displayText: string;
    id: string;
    url: string;
  };
}

export type MessagePart =
  | MessagePartText
  | MessagePartTwitchEmote
  | MessagePartBttvEmote
  | MessagePartFfzEmote
  | MessagePartStvEmote
  | MessagePartEmoji
  | MessagePartMention
  | MessagePartLink
  | MessagePartTwitchClip
  | MessagePartTwitchVideo;

export type MessagePartEmote =
  | MessagePartTwitchEmote
  | MessagePartBttvEmote
  | MessagePartFfzEmote
  | MessagePartStvEmote
  | MessagePartEmoji;

export type MessagePartEmoteModifier =
  | MessagePartBttvEmote
  | MessagePartFfzEmote
  | MessagePartStvEmote;

interface MessageUser {
  id: string;
  login: string;
  displayName?: string;
  color?: string;
}

interface MessagePrivateTags {
  emotes?: string;
  badges?: string;
}

interface AMessage {
  id: string;
  channelName: string;
  timestamp: number;
  user: MessageUser;
  badges: MessageBadge[];
  parts: MessagePart[];
  body: string;
  _tags: MessagePrivateTags;
}

export enum MessageCardType {
  TWITCH_CLIP = 0,
  TWITCH_VIDEO = 1,
  // YOUTUBE_VIDEO = 2,
  // STREAMABLE = 3
  // 7TV = 4
}

export const TWITCH_CLIP_REGEX =
  /^(?:https?:\/\/)?(?:clips\.twitch\.tv\/|(?:www\.|m\.)?twitch\.tv\/(?:[\d\w]+)\/clip\/)([\d\w-]+)(?:\?.+)?$/;

export const TWITCH_VIDEO_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?twitch\.tv\/videos\/(\d+)(?:\?.+)?$/;

export const YOUTUBE_VIDEO_REGEX =
  /^((?:https?:)?\/\/)?((?:www|m)\.)?(?:youtube\.com|youtu.be)(\/(?!channel)(?:[\w-]+\?v=|embed\/|v\/|shorts\/)?)([\w-]+)(\S+)?$/;

export type MessageCard = {
  type: MessageCardType;
  id: string;
  url: string;
};

export type MessageCardDetails = {
  id: string;
  src: string;
  srcSet: string;
  title: string;
  description: string;
};

export type MessageTypePrivate = AMessage & {
  type: MessageType.PRIVATE_MESSAGE;
  card: MessageCard | null;
  /** Whether the message is a cheer */
  isCheer: boolean;
  /** Whether the message represents a redemption of a custom channel points reward */
  isRedemption: boolean;
  /** Whether the message is highlighted by using channel points */
  isPointsHighlight: boolean;
  /** Starts with `/me` in the twitch chat */
  isAction: boolean;
  /** Is message was deleted by mods */
  isDeleted: boolean;
  /** Is message loaded from the recent-messages */
  isHistory: boolean;
  /** Is message was sent by current user with chat.say() */
  isSelf: boolean;
  /** Is message highlighted according highlight settings */
  isHighlighted: boolean;

  // isHidden: boolean;
};

export type MessageTypeUserNotice = AMessage & {
  type: MessageType.USER_NOTICE;
  /** @see https://dev.twitch.tv/docs/irc/tags#usernotice-tags */
  noticeType: string;
  systemMessage: string;
};

export interface MessageTypeNotice {
  type: MessageType.NOTICE;
  id: string;
  channelName: string;
  body: string;
  /** @see https://dev.twitch.tv/docs/irc/msg-id */
  noticeType: string;
}

export type Messages =
  | MessageTypePrivate
  | MessageTypeUserNotice
  | MessageTypeNotice;
