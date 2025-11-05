/**
 * ChatUserstate represents the user state from Twitch IRC messages
 * Based on Twitch IRC tag format - see https://dev.twitch.tv/docs/irc/tags/
 */
export interface ChatUserstate {
  /** User's display name */
  'display-name'?: string;
  /** User's login name (lowercase) - also mapped to username for compatibility */
  login?: string;
  /** Username (same as login, lowercase) - for compatibility with tmi.js */
  username?: string;
  /** User's ID */
  'user-id'?: string;
  /** Message ID */
  id?: string;
  /** User's color (hex color code) */
  color?: string;
  /** Badges (parsed object) */

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  badges?: {
    broadcaster?: string;
    moderator?: string;
    subscriber?: string;
    premium?: string;
    partner?: string;
    vip?: string;
    'bits-leader'?: string;
    bits?: string;
    [key: string]: string | undefined;
  };
  /** Raw badges string (format: "badge/version,badge/version") */
  'badges-raw'?: string;
  /** User type (empty, admin, global_mod, staff) */
  'user-type'?: string;
  /** Whether user is a moderator */
  mod?: string;
  /** Whether user is a subscriber */
  subscriber?: string;
  /** Whether user is a turbo user */
  turbo?: string;
  /** Emote sets (comma-separated list of emote set IDs) */
  'emote-sets'?: string;
  /** Additional IRC tags */
  [key: string]: string | { [key: string]: string } | undefined;
}

/**
 * Base interface for common USERNOTICE tags
 * All USERNOTICE messages share these common tags
 */
interface BaseUserNoticeTags extends Record<string, string | undefined> {
  'msg-id': string;
  id?: string;
  'display-name'?: string;
  login?: string;
  color?: string;
  badges?: string;
  'badge-info'?: string;
  emotes?: string;
  flags?: string;
  mod?: string;
  'room-id'?: string;
  subscriber?: '1' | '0'; // 1=yes or 0=not subbed;
  'system-msg'?: string; // raw IRC message
  'tmi-sent-ts'?: string;
  'user-id'?: string;
  'user-type'?: string;
  vip?: '0' | '1';
}

export interface ViewerMilestoneTags extends BaseUserNoticeTags {
  'msg-id': 'viewermilestone';
  'msg-param-category': 'watch-streak';
  'msg-param-copoReward': string; // i.e. 450 = 450 channel points earned
  'msg-param-id': string;
  'msg-param-value': string; // number of days as a string i.e. 5
}

/**
 * Tags for viewermilestone USERNOTICE
 */

// /**
//  * Tags for sub USERNOTICE
//  */
// export interface SubTags extends BaseUserNoticeTags {
//   'msg-id': 'sub';
//   'msg-param-sub-plan'?: string;
// }

// /**
//  * Tags for resub USERNOTICE
//  */
// export interface ResubTags extends BaseUserNoticeTags {
//   'msg-id': 'resub';
//   'msg-param-months'?: string;
//   'msg-param-sub-plan'?: string;
// }

// /**
//  * Tags for subgift USERNOTICE
//  */
// export interface SubGiftTags extends BaseUserNoticeTags {
//   'msg-id': 'subgift';
//   'msg-param-sub-plan'?: string;
//   'msg-param-recipient-display-name'?: string;
//   'msg-param-recipient-id'?: string;
// }

// /**
//  * Tags for submysterygift USERNOTICE
//  */
// export interface SubMysteryGiftTags extends BaseUserNoticeTags {
//   'msg-id': 'submysterygift';
//   'msg-param-sub-plan'?: string;
//   'msg-param-gift-months'?: string;
// }

// /**
//  * Tags for giftpaidupgrade USERNOTICE
//  */
// export interface GiftPaidUpgradeTags extends BaseUserNoticeTags {
//   'msg-id': 'giftpaidupgrade';
//   'msg-param-sender-login'?: string;
//   'msg-param-sender-name'?: string;
// }

// /**
//  * Tags for rewardgift USERNOTICE
//  */
// export interface RewardGiftTags extends BaseUserNoticeTags {
//   'msg-id': 'rewardgift';
//   'msg-param-domain'?: string;
//   'msg-param-reward-id'?: string;
//   'msg-param-reward-title'?: string;
//   'msg-param-reward-cost'?: string;
// }

// /**
//  * Tags for anongiftpaidupgrade USERNOTICE
//  */
// export interface AnonGiftPaidUpgradeTags extends BaseUserNoticeTags {
//   'msg-id': 'anongiftpaidupgrade';
//   'msg-param-sender-login'?: string;
//   'msg-param-sender-name'?: string;
// }

// /**
//  * Tags for raid USERNOTICE
//  */
// export interface RaidTags extends BaseUserNoticeTags {
//   'msg-id': 'raid';
//   'msg-param-viewer-count'?: string;
//   'msg-param-displayName'?: string;
//   'msg-param-login'?: string;
// }

// /**
//  * Tags for unraid USERNOTICE
//  */
// export interface UnraidTags extends BaseUserNoticeTags {
//   'msg-id': 'unraid';
// }

// /**
//  * Tags for bitsbadgetier USERNOTICE
//  */
// export interface BitsBadgeTierTags extends BaseUserNoticeTags {
//   'msg-id': 'bitsbadgetier';
//   'msg-param-threshold'?: string;
// }

// /**
//  * Tags for sharedchatnotice USERNOTICE
//  */
// export interface SharedChatNoticeTags extends BaseUserNoticeTags {
//   'msg-id': 'sharedchatnotice';
//   'msg-param-host-channel-id'?: string;
//   'msg-param-host-channel-login'?: string;
//   'msg-param-host-channel-name'?: string;
// }

// /**
//  * Discriminated union type for USERNOTICE tags based on msg-id
//  * This allows TypeScript to narrow the type based on the msg-id value
//  */
// export type UserNoticeTags =
//   | ViewerMilestoneTags
//   | SubTags
//   | ResubTags
//   | SubGiftTags
//   | SubMysteryGiftTags
//   | GiftPaidUpgradeTags
//   | RewardGiftTags
//   | AnonGiftPaidUpgradeTags
//   | RaidTags
//   | UnraidTags
//   | BitsBadgeTierTags
//   | SharedChatNoticeTags;

// export type UserNoticeTags
