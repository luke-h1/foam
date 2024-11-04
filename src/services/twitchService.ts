import axios, { AxiosHeaders } from 'axios';
import { twitchApi } from './api';

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

const twitchService = {
  getRefreshToken: async (refreshToken: string): Promise<string> => {
    const { data } = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID}&client_secret=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refreshToken}`,
    );

    return data;
  },

  // getGlobalEmotes: async (headers: AxiosHeaders) => {
  //   const data = await twitchApi.get<Emote>('/chat/emotes/global', {
  //     headers,
  //   });

  //   const emotes = data.map((emote: TwitchEmote) => {
  //     return twitchSerializer.fromTwitchEmote(emote, EmoteTypes.TwitchGlobal);
  //   });

  //   return emotes;
  // },
  // getChannelBadges: async (id: string) => {
  //   const { data } = await twitchApi.get(`/chat/badges?broadcaster_id=${id}`, {
  //     headers: {
  //       'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
  //     },
  //   });
  //   return data;
  // },

  // // ---------------------------------------------------------------------
  // // NEEDS TO BE re-checked and moved to emoteService
  // getChannelEmotes: async (id: string, headers: AxiosHeaders) => {
  //   const { data } = await twitchApi.get(`/chat/emotes?broadcaster_id=${id}`, {
  //     headers,
  //   });

  //   return data.map((emote: TwitchEmote) => {
  //     switch (emote.emoteType) {
  //       case 'bitstier':
  //         return twitchSerializer.fromTwitchEmote(
  //           emote,
  //           EmoteTypes.TwitchBitsTier,
  //         );

  //       case 'follower':
  //         return twitchSerializer.fromTwitchEmote(
  //           emote,
  //           EmoteTypes.TwitchFollower,
  //         );

  //       case 'subscriptions':
  //         return twitchSerializer.fromTwitchEmote(
  //           emote,
  //           EmoteTypes.TwitchChannel,
  //         );

  //       default:
  //         return twitchSerializer.fromTwitchEmote(
  //           emote,
  //           EmoteTypes.TwitchChannel,
  //         );
  //     }
  //   });
  // },
  // getEmoteSets: async (setId: string, headers?: AxiosHeaders) => {
  //   const { data } = await twitchApi.get(
  //     `/chat/emotes/set?emote_set_id=${setId}`,
  //     {
  //       headers,
  //     },
  //   );

  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   return data.map((emote: any) => {
  //     switch (emote.type) {
  //       case 'globals':
  //       case 'smilies':
  //         return twitchSerializer.fromTwitchEmote(
  //           emote,
  //           EmoteTypes.TwitchGlobal,
  //         );

  //       case 'subscriptions':
  //         return twitchSerializer.fromTwitchEmote(
  //           emote,
  //           EmoteTypes.TwitchSubscriber,
  //         );

  //       default:
  //         return twitchSerializer.fromTwitchEmote(
  //           emote,
  //           EmoteTypes.TwitchUnlocked,
  //         );
  //     }
  //   });
  // },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getGlobalBadges: async (headers: AxiosHeaders) => {},

  /**
   * @returns a token for an anonymous user
   */
  getDefaultToken: async (): Promise<DefaultTokenResponse> => {
    // const isExpoGo =
    //   Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

    // const { data } = await axios.get(
    //   `${process.env.EXPO_PUBLIC_PROXY_API_BASE_URL}/proxy/default-token`,
    //   {
    //     params: {
    //       isExpoGo,
    //     },
    //   },
    // );
    // console.log('data', data);
    // return data;

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
   * @param headers
   * @param cursor
   * @returns an object that contains the top 20 streams and a cursor for further requests
   * @requires a non-anon token
   */
  getTopStreams: async (cursor?: string): Promise<Stream[]> => {
    const result = await twitchApi.get<{ data: Stream[] }>('/streams', {
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        // Authorization: `Bearer ${token}`,
      },
      params: {
        after: cursor,
      },
    });
    return result.data;
  },

  getStreamsUnderCategory: async (
    gameId: string,
    headers: AxiosHeaders,
    cursor?: string,
  ): Promise<Stream[]> => {
    return twitchApi.get<Stream[]>('/streams', {
      headers,
      params: {
        game_id: gameId,
        after: cursor,
      },
    });
  },

  getStream: async (userLogin: string) => {
    const result = await twitchApi.get<{ data: Stream[] }>(`/streams`, {
      params: {
        user_login: userLogin,
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

  getTopCategories: async () => {
    const { data } = await twitchApi.get<{ data: Category[] }>('/games/top');
    return data;
  },

  getUserImage: async (userId: string): Promise<string> => {
    // TODO: work out the proper response type here
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
      `/streams/followed`,
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
  ): Promise<Stream[]> => {
    const result = await twitchApi.get<{ data: Stream[] }>('/streams', {
      params: {
        game_id: gameId,
        after: cursor,
      },
    });

    return result.data;
  },

  getCategory: async (id: string): Promise<Category> => {
    const result = await twitchApi.get<{ data: Category[] }>('/games', {
      params: {
        id,
      },
    });
    return result.data[0];
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
