import { ChatBadge, EmoteType, BadgeTypes } from '../types';

export interface BadgeInfoFFZ {
  id: number;
  title: string;
  color: string;
  urls: string[][];
}

export interface FFZEmote {
  name: string;
  height: number;
  width: number;
  owner: {
    display_name: string;
    name: string;
  };
  urls: { [key: string]: string }[];
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
