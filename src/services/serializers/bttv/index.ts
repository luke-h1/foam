/**
 * Serializer for emotes and chat badges from bttv service which transforms emote/badge to a common format
 */

import { zeroWidthEmotes } from '@app/utils/zeroWidthEmotes';
import { BadgeTypes, ChatBadge, EmoteType } from '../types';

interface BttvEmote {
  id: string;
  code: string;
}

interface BttvBadgeDetails {
  description: string;
  svg: string;
}

const bttvSerializer = {
  fromBttvEmote: (emote: BttvEmote, type: EmoteType) => {
    return {
      name: emote.code,
      zeroWidth: zeroWidthEmotes.includes(emote.code),
      url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
      type,
    };
  },
  fromBttvBadge: (badge: BttvBadgeDetails): ChatBadge => {
    return {
      name: badge.description,
      url: badge.svg,
      type: BadgeTypes.BTTV,
    };
  },
};

export default bttvSerializer;
