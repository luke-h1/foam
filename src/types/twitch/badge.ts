import { OpenStringUnion } from '@app/utils/typescript/OpenStringUnion';

/**
 * The canonical provider discriminant for badges; dispatch on this field,
 * never on the `type` display string.
 */
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

  color?: string;
  owner_username?: string;
  set: string;
  provider: BadgeProvider;
}
