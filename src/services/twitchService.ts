/* eslint-disable */
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { twitchApi } from './Client';
import twitchSerializer, { TwitchEmote } from './serializers/twitch';
import { EmoteTypes } from './serializers/types';

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

export interface UserResponse {
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

const twitchService = {
  getRefreshToken: async (refreshToken: string): Promise<string> => {
    // TODO: - Luke, don't think this is needed - can remove
    const res = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID}&client_secret=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refreshToken}`,
    );

    return res.data;
  },

  getGlobalEmotes: async (headers: AxiosHeaders) => {
    const res = await twitchApi.get('/chat/emotes/global', {
      headers,
    });

    const emotes = res.data.map((emote: TwitchEmote) => {
      return twitchSerializer.fromTwitchEmote(emote, EmoteTypes.TwitchGlobal);
    });

    return emotes;
  },
  getChannelBadges: async (id: string) => {
    const res = await twitchApi.get(`/chat/badges?broadcaster_id=${id}`, {
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      },
    });
    return res.data;
  },

  // ---------------------------------------------------------------------
  // NEEDS TO BE re-checked
  getChannelEmotes: async (id: string, headers: AxiosHeaders) => {
    const res = await twitchApi.get(`/chat/emotes?broadcaster_id=${id}`, {
      headers,
    });

    return res.data.map((emote: TwitchEmote) => {
      switch (emote.emoteType) {
        case 'bitstier':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchBitsTier,
          );

        case 'follower':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchFollower,
          );

        case 'subscriptions':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchChannel,
          );

        default:
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchChannel,
          );
      }
    });
  },
  getEmoteSets: async (setId: string, headers?: AxiosHeaders) => {
    const res = await twitchApi.get(`/chat/emotes/set?emote_set_id=${setId}`, {
      headers,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data.map((emote: any) => {
      switch (emote.type) {
        case 'globals':
        case 'smilies':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchGlobal,
          );

        case 'subscriptions':
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchSubscriber,
          );

        default:
          return twitchSerializer.fromTwitchEmote(
            emote,
            EmoteTypes.TwitchUnlocked,
          );
      }
    });
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getGlobalBadges: async (headers: AxiosHeaders) => {},

  /**
   * @returns a token for an anonymous user
   */
  getDefaultToken: async (): Promise<DefaultTokenResponse> => {
    const { data } = await axios.get(
      'http://localhost:6500/api/proxy/default-token',
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
   * @param headers
   * @param cursor
   * @returns an object that contains the top 20 streams and a cursor for further requests
   * @requires a non-anon token
   */
  getTopStreams: async (cursor?: string): Promise<Stream[]> => {
    const url = cursor ? `/streams?after=${cursor}` : '/streams';

    const res = await twitchApi.get(url, {
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        // Authorization: `Bearer ${token}`,
      },
    });

    return res.data.data;
  },

  // Returns a Stream object that contains the list of streams under the given game/category ID.
  getStreamsUnderCategory: async (
    gameId: string,
    headers: AxiosHeaders,
    cursor?: string,
  ): Promise<Stream[]> => {
    const url = cursor
      ? `/streams?game_id=${gameId}&after=${cursor}`
      : `/streams?game_id=${gameId}`;

    const res = await twitchApi.get(url, {
      headers,
    });

    return res.data;
  },

  // Returns a Stream object containing the stream info associated with the given userLogin
  getStream: async (userLogin: string) => {
    /**
     * This is typed as a Stream[] because the Twitch API returns an array of 1 single Stream
     */
    const res = await twitchApi.get<{ data?: Stream[] }>(
      `/streams?user_login=${userLogin}`,
      {
        headers: {
          'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        },
      },
    );

    return res.data.data?.[0];
  },
  // responsds with 410 GONE
  /* 
    {
        "error": "Gone",
        "status": 410,
        "message": "This API is not available."
    }
  */
  // getFollowedChannels: async (userId: string) => {
  //   console.log('user id is', userId)
  //   const { token } = await getTokens();
  //   console.log('token is', token);
  //   const res = await twitchApi.get(`/users/follows?from_id=${userId}`, {
  //     headers: {
  //       'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
  //       // Authorization: `Bearer ${token}`,
  //     },
  //   })
  //   console.log('[twitchService]: getFollowedChannels', res.data);

  //   return res.data;
  // },

  // returns a channel object containing the channel info associated with the given userId
  getChannel: async (userId: string) => {
    const res = await twitchApi.get<Channel[]>(
      `/channels?broadcaster_id=${userId}`,
    );

    return res.data[0];
  },

  getTopCategories: async () => {
    const res = await twitchApi.get<{ data: Category[] }>('/games/top');
    return res.data.data;
  },

  getUserImage: async (userId: string): Promise<string> => {
    const res = await twitchApi.get(`/users?login=${userId}`);

    return res.data.data[0].profile_image_url;
  },
  getFollowedStreams: async (userId: string): Promise<Stream[]> => {
    const res = await twitchApi.get(`/streams/followed?user_id=${userId}`);
    return res.data.data;
  },

  getUserInfo: async (token: string): Promise<UserInfoResponse> => {
    const res = await twitchApi.get('/users', {
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data[0];
  },
  getUser: async (userId: string): Promise<UserResponse> => {
    const res = await twitchApi.get(`/users?login=${userId}`);

    return res.data.data[0];
  },

  searchChannels: async (query: string): Promise<SearchChannelResponse[]> => {
    const res = await twitchApi.get(`/search/channels?query=${query}`);

    return res.data.data;
  },
  getStreamsByCategory: async (
    gameId: string,
    cursor?: string,
  ): Promise<Stream[]> => {
    const url = cursor
      ? `/streams?game_id=${gameId}&after=${cursor}`
      : `/streams?game_id=${gameId}`;

    const res = await twitchApi.get(url);

    return res.data.data;
  },

  getCategory: async (id: string): Promise<Category> => {
    const res = await twitchApi.get(`/games?id=${id}`);
    return res.data.data[0];
  },

  // ----------------- NOT IMPLEMENTED ----------------- //
  // searchCategories: async (query: string, cursor?: string) => {},

  // getSubscriberCount: async (userId: string) => {},

  // getUserBlockedList: async (
  //   id: string,
  //   headers: AxiosHeaders,
  //   cursor?: string,
  // ) => {},

  // blockUser: async (userId: string) => {},
  // unBlockUser: async (userId: string) => {},
};

export default twitchService;
