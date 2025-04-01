/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { twitchApi } from './api';
import { TwitchBadgesResponse } from './types/twitch/badge';
import { TwitchEmoteSetsResponse } from './types/twitch/emote';
import {
  TwitchGetUsersResponse,
  TwitchUserBlockListsResponse,
  TwitchClipsResponse,
  TwitchVideosResponse,
} from './types/twitch/user';

type GetUsersParams = ({ id: string } | { login: string })[];

const twitchService = {
  listUsers: async (
    params: GetUsersParams,
    accessToken: string,
  ): Promise<TwitchGetUsersResponse> => {
    const q = params
      .map((item: { id?: string; login?: string }) =>
        item.id ? `id=${item.id}` : `login=${item.login}`,
      )
      .join('&');
    const { data } = await twitchApi.get<TwitchGetUsersResponse>(
      `/users?${q}`,
      {
        headers: {
          Authorization: accessToken,
        },
      },
    );
    return data;
  },

  listUserBlockList: async (
    broadcasterId: string,
    accessToken: string,
  ): Promise<TwitchUserBlockListsResponse> => {
    const { data } = await twitchApi.get<TwitchUserBlockListsResponse>(
      `/users/blocks?broadcaster_id=${broadcasterId}`,
      {
        headers: {
          Authorization: accessToken,
        },
      },
    );
    return data;
  },
  listEmoteSets: async (
    ids: string[],
    accessToken: string,
  ): Promise<TwitchEmoteSetsResponse> => {
    const IDS_LIMIT_BY_REQUEST = 25;
    const requests: Promise<TwitchEmoteSetsResponse>[] = [];

    for (let i = 0; i < ids.length; i += IDS_LIMIT_BY_REQUEST) {
      const idsSlice = ids.slice(i, i + IDS_LIMIT_BY_REQUEST);
      const q = idsSlice.map(id => `emote_set_id=${id}`).join('&');
      requests.push(
        twitchApi
          .get(`/chat/emotes/set?${q}`, {
            headers: {
              Authorization: accessToken,
            },
          })
          .then(r => r.data),
      );
    }

    const responses = await Promise.all(requests);

    const data = ([] as TwitchEmoteSetsResponse['data']).concat(
      ...responses.map(r => r.data),
    );

    return {
      data,
      template: responses[0]!.template,
    };
  },

  listGlobalBadges: async (
    accessToken: string,
  ): Promise<TwitchBadgesResponse> => {
    const { data } = await twitchApi.get<TwitchBadgesResponse>(
      '/chat/badges/global',
      {
        headers: {
          Authorization: accessToken,
        },
      },
    );
    return data;
  },
  listChannelBadges: async (
    broadcasterId: string,
    accessToken: string,
  ): Promise<TwitchBadgesResponse> => {
    const { data } = await twitchApi.get<TwitchBadgesResponse>(
      `/chat/badges?broadcaster_id=${broadcasterId}`,
      {
        headers: {
          Authorization: accessToken,
        },
      },
    );
    return data;
  },
  listClips: async (
    clipId: string,
    accessToken: string,
  ): Promise<TwitchClipsResponse> => {
    const { data } = await twitchApi.get<TwitchClipsResponse>(
      `/clips?id=${clipId}`,
      {
        headers: {
          Authorization: accessToken,
        },
      },
    );
    return data;
  },
  listVideos: async (
    videoId: string,
    accessToken: string,
  ): Promise<TwitchVideosResponse> => {
    const { data } = await twitchApi.get<TwitchVideosResponse>(
      `/videos?id=${videoId}`,
      {
        headers: {
          Authorization: accessToken,
        },
      },
    );
    return data;
  },
} as const;

export default twitchService;
