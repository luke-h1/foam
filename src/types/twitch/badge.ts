import { OpenStringUnion } from '@app/utils/typescript/OpenStringUnion';

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
    | '7TV Badge'
  >;
  title: string;

  color?: string;
  owner_username?: string;
  /**
   * The set ID
   */
  set: string;
  /**
   * The provider of the badge (7TV, BTTV, FFZ)
   */
  provider?: '7tv' | 'bttv' | 'ffz';
}
