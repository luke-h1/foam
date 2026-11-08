import type { ProviderId } from '@app/types/emote';

export type BadgeProvider = Exclude<ProviderId, 'streamelements'>;

export type SanitisedBadgeType =
  | 'Twitch Channel Badge'
  | 'Twitch Subscriber Badge'
  | 'Twitch Bit Badge'
  | 'Twitch Global Badge'
  | 'Twitch Shared Chat Source'
  | 'FFZ Channel Badge'
  | 'FFZ User Badge'
  | 'FFZ Global Badge'
  | 'BTTV Badge'
  | '7TV Badge'
  | 'Chatterino Badge';

export interface SanitisedBadgeSet {
  id: string;
  url: string;
  type: SanitisedBadgeType;
  title: string;

  color?: string;
  owner_username?: string;
  set: string;
  provider: BadgeProvider;
}
