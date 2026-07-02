export interface TwitchEmote {
  id: string;
  name: string;
  emote_type:
    | 'bitstier'
    | 'channelpoints'
    | 'follower'
    | 'globals'
    | 'hypetrain'
    | 'none'
    | 'owl2019'
    | 'prime'
    | 'rewards'
    | 'smilies'
    | 'subscriptions'
    | 'turbo'
    | 'twofactor';
  emote_set_id: string;
  owner_id: string;
  format: ['static' | 'animated'];
  scale: ['1.0', '2.0', '3.0'];
  theme_mode: ['light', 'dark'];
}
