/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosHeaders } from 'axios';
import { twitchApi } from './Client';
import twitchSerializer from './serializers/twitch';
import { EmoteTypes } from './serializers/types';

interface TwitchUser {
  id: string;
  login: string;
  displayName: string;
  profileImageUrl: string;
}

interface Stream {
  userId: string;
  userLogin: string;
  userName: string;
  gameId: string;
  gameName: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
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

const twitchService = {
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
  getDefaultToken: async (): Promise<{ access_token: string }> => {
    const res = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      {},
      {
        params: {
          client_id: 'TWITCH_CLIENT_ID',
          client_secret: 'TWITCH_CLIENT_SECRET',
          grant_type: 'client_credentials',
        },
      },
    );
    if (res.status === 200) {
      return res.data.access_token;
    }

    throw new Error('Failed to get token');
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
   */
  getTopStreams: async (token: string, cursor?: string) => {
    const url = cursor ? `/streams?after=${cursor}` : '/streams';

    try {
      return twitchApi.get<Stream[]>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Client-Id': process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        },
      });
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  /**
   *
   * @param id
   * @param headers
   * @param cursor
   * @returns an object that contains the given user ID's top 20 followed streams and a cursor for further requests
   */
  getFollowedStreams: async (
    id: string,
    headers: AxiosHeaders,
    cursor?: string,
  ) => {
    const url = cursor
      ? `/streams/followed?user_id=${id}`
      : `/streams/followed?user_id=${id}&after=${cursor}`;

    const res = await twitchApi.get<Stream[]>(url, {
      headers,
    });

    if (res.status === 200) {
      return res.data;
    }

    throw new Error('Failed to get followed streams');
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

  /**
   *
   * @param userLogin
   * @param id
   * @param headers
   * @returns TwitchUser object containing the user info associated with the given userLogin or id
   */
  getUser: async (token: string) => {
    // const url = id ? `/users?id=${id}` : `/users?login=${userLogin}`;

    const res = await twitchApi.get<TwitchUser>('/users', {
      headers: {
        Authorization: `Bearer ${token}`,
        clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      },
    });

    if (res.status === 200) {
      if (!res.data) {
        throw new Error('User does not exist');
      }

      return res.data;
    }

    throw new Error('Failed to get user');
  },

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

  // returns a list of ChanelQuery objects containing the channels that match the closest given query
  searchChannels: async (query: string, headers: AxiosHeaders) => {
    const res = await twitchApi.get<ChannelQuery[]>(
      `/search/channels?first=8&query=${query}`,
      {
        headers,
      },
    );

    if (res.status === 200) {
      return res.data;
    }

    throw new Error('Failed to search channels');
  },

  getTopCategories: async (headers: AxiosHeaders, cursor?: string) => {},

  getCategory: async (gameId: string, headers: AxiosHeaders) => {},

  searchCategories: async (
    headers: AxiosHeaders,
    query: string,
    cursor?: string,
  ) => {},

  getSubscriberCount: async (userId: string, headers: AxiosHeaders) => {},

  getUserBlockedList: async (
    id: string,
    headers: AxiosHeaders,
    cursor?: string,
  ) => {},

  blockUser: async (userId: string, headers: AxiosHeaders) => {},
  unBlockUser: async (userId: string, headers: AxiosHeaders) => {},
};

export default twitchService;
