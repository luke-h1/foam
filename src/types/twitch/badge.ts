import type { OpenStringUnion } from '@app/utils/typescript/open-string-union';

export type BadgeProvider = 'twitch' | '7tv' | 'bttv' | 'ffz' | 'chatterino';

export interface SanitisedBadgeSet {
  id: string;
  url: string;
  type: OpenStringUnion<
    | 'Twitch Channel Badge'
    | 'Twitch Subscriber Badge'
    | 'Twitch Bit Badge'
    | 'Twitch Global Badge'
    | 'FFZ Badge'
    | 'FFZ Channel Badge'
    | 'BTTV Badge'
    | '7TV Badge'
  >;
  title: string;

  color?: string | undefined;
  owner_username?: string | undefined;
  set: string;
  provider: BadgeProvider;
}
