import axios from 'axios';
import { ffzApi } from './api';
import { components } from './types/generated/ffz.generated';

export type FfzBadge = components['schemas']['Badge'];

export interface FfzGlobalBadgesResponse {
  badges: FfzBadge[];
  users: Record<string, number[]>;
}

export interface FfzApBadge {
  id: string | number;
  tier: 1 | 2 | 3;
  badge_color?: string;
  badge_is_colored?: 0 | 1;
  admin?: 1;
}

export type FfzApGlobalBadgesResponse = FfzApBadge[];

export type FfzEmote = components['schemas']['Emote'];

type FfzEmoteSet = components['schemas']['EmoteSet'];

export interface FfzGlobalEmotesResponse {
  default_sets: number[];
  sets: Record<string, FfzEmoteSet>;
  users: Record<string, string[]>;
}

export interface FfzChannelEmotesResponse {
  room: FfzRoom;
  sets: Record<string, FfzEmoteSet>;
}

interface FfzEmojiVariant {
  codePoints: string;
  sheet: [x: number, y: number];
  has: number;
  skinTone: 1 | 2 | 3 | 4 | 5;
  _: number;
  name: string | string[];
}

export interface FfzEmoji {
  category: number;
  sort: number;
  name: string | string[];
  description: string;
  codePoints: string;
  sheet: [x: number, y: number];
  has: number;
  variants: 0 | FfzEmojiVariant[];
}

export interface FfzEmojiResponse {
  v: number;
  n: number;
  b: number;
  t: number;
  o: number;

  /** Categories */
  c: Record<string, string>;
  e: FfzEmoji[];
}

export type FfzRoom = components['schemas']['Room'];

// cdn
const CDN_URL = 'https://cdn.frankerfacez.com';

// addon pack
const AP_URL = 'https://api.ffzap.com';

const ffzService = {
  listGlobalEmotes: async (): Promise<FfzGlobalEmotesResponse> => {
    const { data } = await ffzApi.get<FfzGlobalEmotesResponse>('/set/global');
    return data;
  },
  listChannelEmotes: async (
    channelId: string,
  ): Promise<FfzChannelEmotesResponse> => {
    const { data } = await ffzApi.get<FfzChannelEmotesResponse>(
      `/room/id/${channelId}`,
    );
    return data;
  },
  listEmoji: async (): Promise<FfzEmojiResponse> => {
    const { data } = await axios.get(`${CDN_URL}/static/emoji/v3.2.json`);
    return data;
  },
  listGlobalBadges: async (): Promise<FfzGlobalBadgesResponse> => {
    const { data } = await ffzApi.get<FfzGlobalBadgesResponse>('/badges/ids');
    return data;
  },
  listApGlobalBadges: async (): Promise<FfzApGlobalBadgesResponse> => {
    const { data } = await axios.get<FfzApGlobalBadgesResponse>(
      `${AP_URL}/v1/supporters`,
    );
    return data;
  },
} as const;

export default ffzService;
