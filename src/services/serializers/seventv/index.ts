import { BadgeTypes, ChatBadge, EmoteType } from '../types';

interface BadgeInfo7TV {
  tooltip: string;
  urls: string[][];
  users: string[];
}

interface SevenTVEmote {
  name: string;
  visibility_simple: string[];
  width: number[];
  height: number[];
  urls: {
    '1': string;
    '2': string;
    '4': string;
  }[];
}

const seventvSerializer = {
  fromSevenTvEmote: (emote: SevenTVEmote, type: EmoteType) => {
    return {
      name: emote.name,
      width: emote.width[0],
      height: emote.height[0],
      zeroWidth: emote.visibility_simple.includes('ZERO_WIDTH'),
      url: emote.urls[3][1],
      type,
    };
  },
  fromSevenTvBadge: (badge: BadgeInfo7TV): ChatBadge => {
    return {
      name: badge.tooltip,
      url: badge.urls[2][1],
      type: BadgeTypes.SevenTV,
    };
  },
};

export default seventvSerializer;
