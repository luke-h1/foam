import { ChatBadge, EmoteType, BadgeTypes } from '../types';

interface BadgeInfoFFZ {
  id: string;
  title: string;
  color: string;
  urls: string[][];
}

interface FFZEmote {
  name: string;
  height: number;
  width: number;
  urls: {
    '1': string;
    '2': string;
    '4': string;
  }[];
}

const ffzSerializer = {
  fromFFZEmote: (badge: FFZEmote, type: EmoteType) => {
    return {
      name: badge.name,
      url: badge.urls[2][1],
      type,
    };
  },
  fromFFZBadge: (badge: BadgeInfoFFZ): ChatBadge => {
    return {
      name: badge.title,
      url: badge.urls[2][1],
      color: badge.color,
      type: BadgeTypes.FFZ,
    };
  },
};

export default ffzSerializer;
