/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
import { sevenTvApi } from './Client';
import seventvSerializer from './serializers/seventv';
import { EmoteTypes } from './serializers/types';

/* 
  urls is in shape of 
    "urls": [
        [
            "1",
            "https://cdn.7tv.app/emote/615079ff20eaf897465a7c27/1x.webp"
        ],
*/

interface Role {
  id: string;
  name: string;
  position: number;
  color: number;
  allowed: number;
  denied: number;
}

interface Owner {
  id: string;
  twitch_id: string;
  login: string;
  display_name: string;
  role: Role;
}

interface GlobalEmoteResponse {
  id: string;
  name: string;
  owner: Owner;
  visibility: number;
  visibility_simple: string[];
  mime: string;
  status: number;
  tags: string[];
  width: number[];
  height: number[];
  urls: {
    '1': string;
    '2': string;
    '4': string;
  }[];
}

interface BadgeResponse {
  t: number;
  badges: {
    id: string;
    name: string;
    tooltip: string;
    urls: [string, string][];
    users: string[];
  }[];
}

const seventvService = {
  /**
   * @returns A list of global 7TV emotes to their URL
   */
  getGlobalEmotes: async () => {
    const res = await sevenTvApi.get<GlobalEmoteResponse[]>('/emotes/global');

    return res.data.map(emote =>
      seventvSerializer.fromSevenTvEmote(emote, EmoteTypes.SevenTVGlobal),
    );
  },
  /**
   * @param id The ID of the user to get emotes for
   * @returns A list of a channel's 7TV emotes to their URL
   * use 71092938 (xqc) for testing
   */
  getChannelEmotes: async (id: string) => {
    const res = await sevenTvApi.get<GlobalEmoteResponse[]>(
      `/users/${id}/emotes`,
    );

    return res.data.map(emote =>
      seventvSerializer.fromSevenTvEmote(emote, EmoteTypes.SevenTVChannel),
    );
  },
  /**
   * @returns a map of user IDS to a list of their 7TV badges
   */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  getBadges: async () => {
    const res = await sevenTvApi.get<BadgeResponse>(
      '/badges?user_identifier=twitch_id',
    );

    if (res.status === 200) {
      const { badges } = res.data;

      const result: Record<string, BadgeResponse[]> = {};

      for (const badge of badges) {
        for (const userId of badge.users) {
          const entry = result[userId];
          const normalizedBadge = seventvSerializer.fromSevenTvBadge(badge);

          if (!entry) {
            result[userId] = [normalizedBadge as unknown as BadgeResponse];
          }

          entry?.push(normalizedBadge as unknown as BadgeResponse);
        }
      }

      return result;
    }
    return null;
  },
};

export default seventvService;
