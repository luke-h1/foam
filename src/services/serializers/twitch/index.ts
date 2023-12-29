import { BadgeTypes, ChatBadge, EmoteType } from '../types';

export interface TwitchEmote {
  id: string;
  name: string;
  emoteType?: string;
  ownerId?: string;
}

export interface BadgeInfoTwitch {
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  id: string;
  title: string;
  description: string;
}

const twitchSerializer = {
  fromTwitchEmote: (emote: TwitchEmote, type: EmoteType) => {
    return {
      name: emote.name,
      zeroWidth: false,
      url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
      type,
      ownerId: emote.ownerId,
    };
  },
  fromTwitchBadge: (badge: BadgeInfoTwitch): ChatBadge => {
    return {
      name: badge.title,
      url: badge.image_url_4x,
      type: BadgeTypes.Twitch,
    };
  },
};
export default twitchSerializer;
