import { Emote } from '../emotes';
import { TwitchBadgesResponse, TwitchEmote } from '../twitch';

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
  id?: string;
  name: string;
  messages: Messages[];
  recentMessages: string[];
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
   * party emotes in the channel
   */
  emotes: {
    twitch: Emote<TwitchEmote>;
  };

  /**
   * Badges in a given channel
   * TODO: fetch stv, bttv badges
   */
  badges: {
    twitch: TwitchBadgesResponse;
  };
}

interface Me {
  id?: string;
  login?: string;
  displayName?: string;
  picture?: string;
  accessToken?: string;
  globalUserState?: GlobalUserStateTags;
  blockedUsers: string;
}

export const TIMESTAMP_FORMAT = [
  'Disable',
  'h:mm',
  'hh:mm',
  'H:mm',
  'HH:mm',
  'h:mm a',
  'hh:mm a',
] as const;

interface Preferences {
  ui: {
    timestampFormat: 'Disable' | 'h:mm' | 'hh:mm a' | 'hh:mm a';
  };
  twitch: {
    cards: boolean;
    animatedEmotes: boolean;
  };
}

export interface ChatState {
  isConnected: boolean;
  isRegistered: boolean;
  me: Me;
  currentChannel?: string;

  // Emotes
  emotes: {
    twitch: Emote<TwitchEmote>;
  };

  // Badges
  // badges: object;

  preferences: Preferences;
}
