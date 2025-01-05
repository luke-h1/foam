import { BttvBadge, BttvEmote } from '@app/services/bttvService';
import { ChatterinoBadge } from '@app/services/chatterinoService';
import { FfzApBadge, FfzBadge, FfzEmote } from '@app/services/ffzService';
import { StvBadge, StvEmote } from '@app/services/stvService';
import { TwitchEmote } from '@app/services/twitchService';
import { Badge, Emote } from '@app/services/types/util';
import { EntityId, EntityState } from '@reduxjs/toolkit';
import { TwitchBadges } from '../util/messages/types/badges';
import { Messages } from '../util/messages/types/messages';
import { Options } from '../util/options/options';
import { Emoji, HtmlEmote } from './emote';

type TStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

export type FetchResult<
  TResult,
  A extends Record<string, unknown> = Record<string, unknown>,
> = {
  status: TStatus;
  data?: TResult;
} & A;

export type UserType = '' | 'admin' | 'global_mod' | 'staff';

export interface GlobalUserStateTags {
  badgeInfo: Record<string, string>;
  badges: Record<string, string>;
  color?: string;
  displayName?: string;
  emoteSets: string[];
  userId: string;
  userType: UserType;
}

export interface UserStateTags {
  badgeInfo: Record<string, string>;
  badges: Record<string, string>;
  color?: string;
  displayName?: string;
  emoteSets: string[];
  mod: boolean;
  subscriber: boolean;
  userType: UserType;
}

export interface RoomStateTags {
  emoteOnly: boolean;
  followersOnly: false | number;
  r9k: boolean;
  roomId: string;
  slow: number;
  subsOnly: boolean;
}

export interface Channel {
  id: string;
  name: string;
  messages: Messages[];
  recentMessages: FetchResult<string[]>;
  ready: boolean;

  /*
   * First msg in array should have alternative bg. Used in split chat
   */
  isFirstMessageAltBg: boolean;

  roomState?: RoomStateTags;
  userState?: UserStateTags;

  /**
   * Users in the chat. Used for autocomplete when typing `@`
   */
  users: string[];

  /**
   * Recent user inputs in a given channel
   */
  recentInputs: string[];

  /**
   * First party emotes in the channel
   */
  emotes: {
    bttv: FetchResult<Emote<BttvEmote>>;
    ffz: FetchResult<Emote<FfzEmote>>;
    stv: FetchResult<Emote<StvEmote>>;
  };

  /**
   * Badges in a given channel
   * TODO: fetch stv, bttv badges
   */
  badges: {
    twitch: FetchResult<TwitchBadges>;
  };
}

export interface ChatState {
  isConnected: boolean;
  isRegistered: boolean;
  channels: EntityState<Channel, EntityId>;
  currentChannel?: string;

  // Emotes
  emotes: {
    twitch: FetchResult<
      Emote<TwitchEmote>,
      { setIds?: string[]; template?: string }
    >;
    bttv: FetchResult<Emote<BttvEmote>>;
    ffz: FetchResult<Emote<FfzEmote>>;
    stv: FetchResult<Emote<StvEmote>>;
    emoji: FetchResult<Emote<Emoji>>;
  };

  // Badges
  badges: {
    twitch: FetchResult<Badge<TwitchBadges>>;
    bttv: FetchResult<Badge<BttvBadge>>;
    ffz: FetchResult<Badge<FfzBadge>>;

    // todo doc this
    ffzAp: FetchResult<Badge<FfzApBadge>>;

    stv: FetchResult<Badge<StvBadge>>;

    chatterino: FetchResult<Badge<ChatterinoBadge>>;
  };

  options: Options;
}

interface ASuggestions {
  isActive: boolean;
  activeIndex: number;
  start: number;
  end: number;
}

type UserSuggestions = ASuggestions & {
  type: 'users';
  items: string[];
};

type EmoteSuggestions = ASuggestions & {
  type: 'emotes';
  items: HtmlEmote[];
};

export type SuggestionState = UserSuggestions | EmoteSuggestions;

export type SendMessageFn = (channel: string, message: string) => void;

export type LocalStorageChannels = [name: string, id?: string][];
