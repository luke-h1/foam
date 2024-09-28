// eslint-disable-next-line no-shadow
export enum BadgeTypes {
  Twitch = 'twitch',
  BTTV = 'bttv',
  FFZ = 'ffz',
  SevenTV = 'sevenTV',
}

export interface ChatBadge {
  name: string;
  url: string;
  type: BadgeTypes;
  color?: string;
}

export const EmoteTypes = {
  TwitchBitsTier: 'Twitch (Bits Tier)',
  TwitchFollower: 'Twitch (Follower)',
  TwitchSubscriber: 'Twitch (Subscriber)',
  TwitchGlobal: 'Twitch (Global)',
  TwitchUnlocked: 'Twitch (Unlocked)',
  TwitchChannel: 'Twitch (Channel)',
  FFZGlobal: 'FFZ (Global)',
  FFZChannel: 'FFZ (Channel)',
  BTTVGlobal: 'BTTV (Global)',
  BTTVChannel: 'BTTV (Channel)',
  BTTVShared: 'BTTV (Shared)',
  SevenTVGlobal: '7TV (Global)',
  SevenTVChannel: '7TV (Channel)',
} as const;

export type EmoteType = (typeof EmoteTypes)[keyof typeof EmoteTypes];
