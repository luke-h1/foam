/* eslint-disable @typescript-eslint/no-unused-vars */
import { bttvApi } from './Client';
import bttvSerializer from './serializers/bttv';
import { EmoteType, EmoteTypes } from './serializers/types';

interface BttvEmote {
  name: string;
  width?: number;
  height?: number;
  zeroWidth: boolean;
  url: string;
  type: EmoteType;
  ownerId?: string;
}

export interface ChatBadge {
  name: string;
  url: string;
  type: EmoteType;
  color?: string;
}

interface BttvGlobalEmoteResponse {
  id: string;
  code: string;
  imageType: string;
  animated: boolean;
  userId: string;
  modifier: boolean;
}

type IdCodePair = {
  id: string;
  code: string;
};

interface BttvSingleGlobalEmoteResponse {
  id: string;
  bots: string[];
  avatar: string;
  channelEmotes: IdCodePair[];
  sharedEmotes: IdCodePair[];
}

interface BttvBadgeResponse {
  id: string;
  name: string;
  displayName: string;
  providerId: string;
  badge: {
    type: number;
    description: string;
    svg: string;
  };
}

type BttvBadge = BttvBadgeResponse['badge'] & {
  providerId: string;
};

const bttvService = {
  getGlobalEmotes: async (): Promise<BttvEmote[]> => {
    const res = await bttvApi.get<BttvGlobalEmoteResponse[]>(
      '/3/cached/emotes/global',
    );

    return res.data.map(emote =>
      bttvSerializer.fromBttvEmote(emote, EmoteTypes.BTTVGlobal),
    );
  },
  getChannelEmotes: async (id: string): Promise<BttvEmote[] | Error> => {
    const res = await bttvApi.get<BttvSingleGlobalEmoteResponse>(
      `/3/cached/users/twitch/${id}`,
    );

    const emotesToUrl: BttvEmote[] = [];

    const channelEmotes = res.data.channelEmotes.map(emote =>
      bttvSerializer.fromBttvEmote(emote, EmoteTypes.BTTVChannel),
    );
    const sharedEmotes = res.data.sharedEmotes.map(emote =>
      bttvSerializer.fromBttvEmote(emote, EmoteTypes.BTTVShared),
    );

    emotesToUrl.push(...channelEmotes, ...sharedEmotes);

    return emotesToUrl;
  },
  getBadges: async () => {
    const res = await bttvApi.get<BttvBadgeResponse[]>('/3/cached/badges');
  },
};

export default bttvService;
