import axios, { AxiosHeaders } from 'axios';
import { twitchApi } from './api';
import { components } from './types/generated/twitch.generated';

export interface PaginatedList<T> {
  data: T[];
  pagination: {
    cursor?: string;
  };
}

export interface UserInfoResponse {
  broadcaster_type: string;
  created_at: string;
  description: string;
  display_name: string;
  id: string;
  login: string;
  offline_image_url: string;
  profile_image_url: string;
  type: string;
  view_count: number;
}

export interface Stream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: unknown[];
  tags: string[];
  is_mature: boolean;
}

export interface Channel {
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
}

export interface Category {
  box_art_url: string;
  id: string;
  igdb_id?: string; // can be an empty string so we specify undefined to represent the falsy value
  name: string;
}

export interface SearchChannelResponse {
  broadcaster_language: string;
  broadcaster_login: string;
  display_name: string;
  game_id: string;
  game_name: string;
  id: string;
  is_live: boolean;
  tag_ids: unknown[];
  tags: string[];
  thumbnail_url: string;
  title: string;
  started_at: string;
}

export interface DefaultTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface Emote {
  format: string[];
  id: string;
  images: {
    url_1x: string;
    url_2x: string;
    url_4x: string;
    name: string;
    scale: ['1.0', '2.0', '3.0'];
    theme_mode: ['light', 'dark'];
  }[];
}

interface RefreshToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// emote_type: 'globals' | 'smilies' | 'limitedtime' | 'subscriptions' | 'follower' | 'twofactor';
export type TwitchEmote = components['schemas']['Emote'];

export type TwitchEmoteSetsResponse =
  components['schemas']['GetEmoteSetsResponse'];

export type TwitchBadgesResponse =
  components['schemas']['GetGlobalChatBadgesResponse'];

export type TwitchBadgeVersion =
  components['schemas']['ChatBadge']['versions'][number];

export type TwitchUser = components['schemas']['User'];
export type TwitchGetUsersResponse =
  components['schemas']['GetUsersResponse']['data'];

export type TwitchUserBlockListsResponse =
  components['schemas']['GetUserBlockListResponse'];
export type TwitchClipsResponse = components['schemas']['GetClipsResponse'];
export type TwitchVideosResponse = components['schemas']['GetVideosResponse'];

type GetUsersParams = ({ id: string } | { login: string })[];

const twitchService = {
  getRefreshToken: async (refreshToken: string): Promise<RefreshToken> => {
    const { data } = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID}&client_secret=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refreshToken}`,
    );

    return data;
  },

  listGlobalEmotes: async () => {
    const { data } = await twitchApi.get<{ data: Emote[] }>(
      `/chat/emotes/global`,
    );
    return data;
  },

  /**
   * @returns a token for an anonymous user
   */
  getDefaultToken: async (): Promise<DefaultTokenResponse> => {
    const { data } = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      null,
      {
        params: {
          client_id: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
          client_secret: process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET,
          grant_type: 'client_credentials',
        },
        headers: {
          'Content-Type': 'x-www-form-urlencoded',
        },
      },
    );
    return data;
  },

  /**
   * @param token
   * @returns a boolean indicating whether the token is valid or not
   */
  validateToken: async (token: string): Promise<boolean> => {
    const res = await axios.get('https://id.twitch.tv/oauth2/validate', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) {
      return true;
    }

    return false;
  },

  /**
   *
   * @param cursor
   * @returns an object that contains the top 20 streams and a cursor for further requests
   * @requires a non-anon token
   */
  getTopStreams: async (cursor?: string): Promise<PaginatedList<Stream>> => {
    const result = await twitchApi.get<PaginatedList<Stream>>('/streams', {
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      },
      params: {
        after: cursor,
      },
    });

    return result;
  },

  getStreamsUnderCategory: async (
    gameId: string,
    headers: AxiosHeaders,
    cursor?: string,
  ): Promise<PaginatedList<Stream>> => {
    const result = await twitchApi.get<PaginatedList<Stream>>('/streams', {
      headers,
      params: {
        game_id: gameId,
        after: cursor,
      },
    });

    return result;
  },

  getStream: async (userLogin: string) => {
    const result = await twitchApi.get<{ data: Stream[] }>(`/streams`, {
      params: {
        user_login: userLogin,
        first: 15,
      },
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      },
    });

    return result.data[0];
  },

  getChannel: async (userId: string): Promise<Channel> => {
    const result = await twitchApi.get<Channel[]>('/channels', {
      params: {
        broadcaster_id: userId,
      },
    });

    return result[0];
  },

  getTopCategories: async (
    cursor?: string,
    beforeCursor?: string,
  ): Promise<PaginatedList<Category>> => {
    return twitchApi.get<PaginatedList<Category>>('/games/top', {
      params: {
        before: beforeCursor,
        after: cursor,
      },
    });
  },

  getUserImage: async (userId: string): Promise<string> => {
    // TODO: work out the full response type here
    const result = await twitchApi.get<{
      data: { profile_image_url: string }[];
    }>('/users', {
      params: {
        login: userId,
      },
    });

    return result.data[0].profile_image_url;
  },
  getFollowedStreams: async (userId: string): Promise<Stream[]> => {
    const result = await twitchApi.get<{ data: Stream[] }>(
      '/streams/followed',
      {
        params: {
          user_id: userId,
        },
      },
    );
    return result.data;
  },

  getUserInfo: async (token: string): Promise<UserInfoResponse> => {
    const result = await twitchApi.get<{ data: UserInfoResponse[] }>('/users', {
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    });
    return result.data[0];
  },
  getUser: async (userId: string): Promise<UserInfoResponse> => {
    const result = await twitchApi.get<{ data: UserInfoResponse[] }>('/users', {
      params: {
        login: userId,
      },
    });

    return result.data[0];
  },

  searchChannels: async (query: string): Promise<SearchChannelResponse[]> => {
    const result = await twitchApi.get<{ data: SearchChannelResponse[] }>(
      '/search/channels',
      {
        params: {
          query,
        },
      },
    );

    return result.data;
  },
  getStreamsByCategory: async (
    gameId: string,
    cursor?: string,
  ): Promise<PaginatedList<Stream>> => {
    return twitchApi.get<PaginatedList<Stream>>('/streams', {
      params: {
        game_id: gameId,
        after: cursor,
      },
    });
  },

  getCategory: async (id: string): Promise<Category> => {
    const result = await twitchApi.get<{ data: Category[] }>('/games', {
      params: {
        id,
      },
    });
    return result.data[0];
  },

  searchCategories: async (query: string, cursor?: string) => {
    return twitchApi.get<PaginatedList<Category>>('/search/categories', {
      params: {
        query,
        after: cursor,
      },
    });
  },
  listUsers: async (
    params: GetUsersParams,
  ): Promise<TwitchGetUsersResponse> => {
    const q = params
      .map((item: { id?: string; login?: string }) =>
        item.id ? `id=${item.id}` : `login=${item.login}`,
      )
      .join('&');

    return twitchApi.get<TwitchGetUsersResponse>(`/users?${q}`);
  },
  listUserBlockList: async (
    broadcasterId: string,
  ): Promise<TwitchUserBlockListsResponse> => {
    return twitchApi.get<TwitchUserBlockListsResponse>('/users/blocks', {
      params: {
        broadcaster_id: broadcasterId,
      },
    });
  },
  listEmoteSets: async (ids: string[]): Promise<TwitchEmoteSetsResponse> => {
    const IDS_LIMIT_BY_REQUEST = 25;
    const requests: Promise<TwitchEmoteSetsResponse>[] = [];

    for (let i = 0; i < ids.length; i += IDS_LIMIT_BY_REQUEST) {
      const idsSlice = ids.slice(i, i + IDS_LIMIT_BY_REQUEST);
      requests.push(
        twitchApi.get<TwitchEmoteSetsResponse>('/chat/emotes/set', {
          params: { emote_set_id: idsSlice },
        }),
      );
    }

    const responses = await Promise.all(requests);

    const data = ([] as TwitchEmoteSetsResponse['data']).concat(
      ...responses.map(r => r.data),
    );

    return {
      data,
      template: responses[0].template,
    };
  },

  listGlobalBadges: async (): Promise<TwitchBadgesResponse> => {
    return twitchApi.get<TwitchBadgesResponse>('/chat/badges/global');
  },

  listChannelBadges: async (
    broadcasterId: string,
  ): Promise<TwitchBadgesResponse> => {
    return twitchApi.get<TwitchBadgesResponse>('/chat/badges', {
      params: {
        broadcaster_id: broadcasterId,
      },
    });
  },

  listClips: async (clipId: string): Promise<TwitchClipsResponse> => {
    return twitchApi.get<TwitchClipsResponse>('/clips', {
      params: {
        id: clipId,
      },
    });
  },

  listVideos: async (videoId: string): Promise<TwitchVideosResponse> => {
    return twitchApi.get<TwitchVideosResponse>('/videos', {
      params: {
        id: videoId,
      },
    });
  },

  // getSubscriberCount: async (userId: string) => {},
  // blockUser: async (userId: string) => {},
  // unBlockUser: async (userId: string) => {},
};

export default twitchService;
