import axios from 'axios';
import { proxyApi, twitchApi } from './api';

export interface UserInfoResponse {
  id: string;
  login: string;
  type: string;
  description: string;
  display_name: string;
  view_count: number;
  offline_image_url: string;
  profile_image_url: string;
  broadcaster_type: string;
  created_at: string;
}

type UserImage = Pick<UserInfoResponse, 'profile_image_url'>;

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

const twitchService = {
  getDefaultToken: async (): Promise<DefaultTokenResponse> => {
    return proxyApi.get('/default-token');
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
  getTopStreams: async (cursor?: string): Promise<Stream[]> => {
    const url = cursor ? `/streams?after=${cursor}` : '/streams';
    const { data } = await twitchApi.get<{ data: Stream[] }>(url);
    return data;
  },

  /**
   * Returns array of streams under the given game/category ID
   */
  getStreamsUnderCategory: async (
    gameId: string,
    cursor?: string,
  ): Promise<Stream[]> => {
    const url = cursor
      ? `/streams?game_id=${gameId}&after=${cursor}`
      : `/streams?game_id=${gameId}`;

    return twitchApi.get(url);
  },

  /**
   * Returns a stream associated with the given userLogin
   * Twitch returns an array of 1 single stream for some reason
   * which is the reasoning for the different type passed to axios
   */
  getStream: async (userLogin: string): Promise<Stream> => {
    const response = await twitchApi.get<{ data: Stream[] }>('/streams', {
      params: {
        user_login: userLogin,
      },
    });

    return response.data[0];
  },

  /**
   * Returns a channel i.e. https://www.twitch.tv/monstercat
   */
  getChannel: async (userId: string): Promise<Channel> => {
    return twitchApi.get('/channels', {
      params: {
        broadcaster_id: userId,
      },
    });
  },
  getTopCategories: async () => {
    return twitchApi.get('/games/top');
  },
  /**
   * Gets a user's pfp
   */
  getUserProfilePicture: async (userId: string): Promise<string> => {
    const response = await twitchApi.get<UserImage>('/users', {
      params: {
        login: userId,
      },
    });
    return response.profile_image_url;
  },
  getFollowedStreams: async (userId: string): Promise<Stream[]> => {
    return twitchApi.get('/streams/followed', {
      params: {
        user_id: userId,
      },
    });
  },
  /**
   * Gets currently logged in user's info
   */
  getUserInfo: async (token: string): Promise<UserInfoResponse> => {
    const response = await twitchApi.get<UserInfoResponse[]>('/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response[0];
  },
  getUser: async (userId: string): Promise<UserInfoResponse> => {
    const response = await twitchApi.get<UserInfoResponse[]>('/users', {
      params: {
        login: userId,
      },
    });

    return response[0];
  },
  searchChannels: async (query: string): Promise<SearchChannelResponse[]> => {
    return twitchApi.get(`/search/channels`, {
      params: {
        query,
      },
    });
  },
  getCategory: async (id: string): Promise<Category> => {
    const response = await twitchApi.get<Category[]>('/games', {
      params: {
        id,
      },
    });
    return response[0];
  },
} as const;

export default twitchService;
