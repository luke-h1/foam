/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable */
import axios, { AxiosHeaders, AxiosResponse } from 'axios';
import { twitchApi } from './Client';
import twitchSerializer from './serializers/twitch';
import { EmoteTypes } from './serializers/types';
import getTokens from '../utils/getTokens';

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

interface Channel {
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
}

interface ChannelQuery {
  broadcasterLogin: string;
  displayName: string;
  id: string;
  isLive: boolean;
  startedAt: string;
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

const twitchService = {
  getRefreshToken: async (refreshToken: string) => {
    const res = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID}&client_secret=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refreshToken}`,
    );

    console.log('[getRefreshToken]:', res.data);

    return res.data;
  },

  getGlobalEmotes: async (headers: AxiosHeaders) => {
    const res = await twitchApi.get('/chat/emotes/global', {
      headers,
    });

    // TODO: type this once auth is sorted
    const emotes = res.data.map((emote: any) => {
      return twitchSerializer.fromTwitchEmote(emote, EmoteTypes.TwitchGlobal);
    });

    return emotes;
  },
  getChannelEmotes: async (id: string, headers: AxiosHeaders) => {
    const res = await twitchApi.get(`/chat/emotes?broadcaster_id=${id}`, {
      headers,
    });

    return res.data.map((emote: any) => {
      switch (emote.type) {
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
   *
   * @returns a token for an anonymous user
   */
  getDefaultToken: async (): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }> => {
    const res = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID}&client_secret=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    );
    console.log('[twitchService.getDefaultToken]:', res.data);
    return res.data;
  },

  /**
   *
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
  getTopStreams: async (cursor?: string) => {
    const url = cursor ? `/streams?after=${cursor}` : '/streams';

    const res = await twitchApi.get<{ data: Stream[] }>(url, {
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
  ) => {
    const url = cursor
      ? `/streams?game_id=${gameId}&after=${cursor}`
      : `/streams?game_id=${gameId}`;

    const res = await twitchApi.get<Stream[]>(url, {
      headers,
    });

    if (res.status === 200) {
      return res.data;
    }

    throw new Error('Failed to get streams under category');
  },

  // Returns a Stream object containing the stream info associated with the given userLogin
  getStream: async (userLogin: string, headers: AxiosHeaders) => {
    const res = await twitchApi.get<Stream>(
      `/streams?user_login=${userLogin}`,
      {
        headers,
      },
    );

    if (!res.data) {
      return null; // user is offline
    }

    return res.data;
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
  getChannel: async (userId: string, headers: AxiosHeaders) => {
    const res = await twitchApi.get<Channel[]>(
      `/channels?broadcaster_id=${userId}`,
      { headers },
    );

    if (res.status === 200) {
      return res.data[0];
    }

    throw new Error('Failed to get channel');
  },

  getTopCategories: async (token: string) => {
    const res = await twitchApi.get<{ data: Category[] }>('/games/top', {
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data;
  },

  getUserImage: async (userId: string): Promise<string> => {
    const res = await twitchApi.get(`/users?login=${userId}`, {
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      },
    });

    return res.data.data[0].profile_image_url;
  },
  getFollowedStreams: async (userId: string) => {
    console.log('headers are', twitchApi.defaults.headers);
    const { anonToken, token } = await getTokens();
    console.log('anontoken is', anonToken);

    console.log('user_id', userId);

    if (!userId) {
      throw new Error('User id is not defined');
    }

    const res = await twitchApi.get<{ data: Stream[] }>(
      `/streams/followed?user_id=${userId}`,
      {
        headers: {
          'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        },
      },
    );
    return res.data;
  },

  getUserInfo: async (token: string) => {
    const res = await twitchApi.get<{ data: UserInfoResponse[] }>('/users', {
      headers: {
        'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data[0];
  },

  searchChannels: async (query: string) => {
    const res = await twitchApi.get<{ data: SearchChannelResponse[] }>(
      `/search/channels?query=${query}`,
      {
        headers: {
          'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        },
      },
    );

    return res.data.data;
  },

  // ----------------- NOT IMPLEMENTED ----------------- //
  getCategory: async (gameId: string) => {},
  searchCategories: async (
    headers: AxiosHeaders,
    query: string,
    cursor?: string,
  ) => {},

  getSubscriberCount: async (userId: string) => {},

  getUserBlockedList: async (
    id: string,
    headers: AxiosHeaders,
    cursor?: string,
  ) => {},

  blockUser: async (userId: string) => {},
  unBlockUser: async (userId: string) => {},
};

export default twitchService;
