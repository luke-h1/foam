/* eslint-disable no-restricted-syntax */
import { ffzApi } from './Client';
import ffzSerializer, { FFZEmote } from './serializers/ffz';
import { ChatBadge, EmoteTypes } from './serializers/types';

interface Emoticon {
  id: number;
  name: string;
  height: number;
  width: number;
  public: boolean;
  hidden: boolean;
  modifier: boolean;
  modifier_flags: number;
  offset: null;
  margins: null;
  css: null;
  owner: {
    _id: number;
    name: string;
    display_name: string;
  };
  artist: null;
  urls: { [key: string]: string }[];
  status: number;
  usage_count: number;
  created_at: string;
  last_updated: string | null;
}

interface GlobalEmoteResponse {
  default_sets: number[];
  sets: {
    [key: string]: {
      id: number;
      _type: number;
      icon: string | null;
      title: string;
      css: string | null;
      emoticons: Emoticon[];
    };
  };
}

interface GetRoomInfoResponse {
  room: {
    _id: number;
    twitch_id: number;
    youtube_id: string | null;
    id: string;
    is_group: boolean;
    display_name: string; // channel name i.e. xQc
    set: number;
    moderator_badge: string;
    vip_badge: string | null;
    mod_urls: {
      '1': string;
      '2'?: string;
      '3'?: string;
    };
    user_badges: object;
    user_badge_ids: object;
    css: null;
  };
  sets: {
    [key: string]: {
      id: number;
      _type: number;
      icon: string | null;
      title: string;
      css: string | null;
      emoticons: Emoticon[];
    };
  };
}

interface BadgeResponse {
  badges: {
    id: number;
    name: string;
    title: string;
    slot: number;
    replaces: string;
    color: string;
    image: string;
    urls: string[][];
    css: null;
  }[];
  users: {
    [key: string]: number[];
  };
}

const ffzService = {
  /**
   *
   * @returns a map of global FFZ emotes to their URL
   * @description
   */
  getGlobalEmotes: async () => {
    const res = await ffzApi.get<GlobalEmoteResponse>('/set/global');

    const defaultSets = res.data.default_sets;

    const emotes: FFZEmote[] = [];

    for (const set of defaultSets) {
      const { emoticons } = res.data.sets[set];

      for (const emote of emoticons) {
        emotes.push({
          height: emote.height,
          name: emote.name,
          urls: emote.urls,
          width: emote.width,
          owner: emote.owner,
        });
      }
    }

    return emotes.map(emote =>
      ffzSerializer.fromFFZEmote(emote, EmoteTypes.FFZChannel),
    );
  },
  /**
   *
   * @param id the ID of the room to get emotes for - twitch channel ID
   * use 71092938 for testing
   * @returns a channel's FFZ room info including custom badges and emotes used
   */
  getRoomInfo: async (id: string) => {
    const res = await ffzApi.get<GetRoomInfoResponse>(`/room/id/${id}`);

    const { emoticons } = res.data.sets[res.data.room.set];

    const emotes = emoticons.map(emote =>
      ffzSerializer.fromFFZEmote(emote, EmoteTypes.FFZChannel),
    );

    return {
      roomInfo: res.data.room,
      emotes,
    };
  },
  getBadges: async () => {
    const res = await ffzApi.get<BadgeResponse>('/badges/ids');

    const { badges, users } = res.data;

    const result: Record<string, ChatBadge[]> = {};

    for (const badge of badges) {
      // eslint-disable-next-line guard-for-in
      for (const userId in users[badge.id]) {
        const entry = result[userId];
        const normalizedBadge = ffzSerializer.fromFFZBadge(badge);

        if (!entry) {
          result[userId] = [normalizedBadge as unknown as ChatBadge];
        }

        entry?.push(normalizedBadge as unknown as ChatBadge);
      }
    }
    return result;
  },
};
export default ffzService;
