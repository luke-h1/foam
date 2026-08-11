import { OpenStringUnion } from '@app/utils/typescript/OpenStringUnion';

/**
 * The canonical provider discriminant for badges, matching the emote
 * `EmoteProvider` spelling ('7tv', 'bttv', 'ffz') plus the badge-only
 * providers. Dispatch on this field, never on the `type` display string.
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
  /**
   * The set ID
   */
  set: string;
  provider: BadgeProvider;
}
