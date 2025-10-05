/* eslint-disable camelcase */
import axios, { AxiosHeaders } from 'axios';
import { twitchApi } from './api';

export interface PaginatedList<T> {
  data: T[];
  pagination: {
    cursor: string;
  };
  total?: number;
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

export interface TwitchStream {
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

interface TwitchTokenValidationResponse {
  client_id: string;
  scopes: null;
  expires_in: number;
}

interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number;
  is_featured: boolean;
}

interface TwitchClipResponse {
  data: TwitchClip[];
}

type EventSubStatus =
  /**
   * The subscription is enabled.
   */
  | 'enabled'
  /**
   * The subscription is pending verification of the specified callback URL.
   */
  | 'webhook_callback_verification_pending'
  /**
   * The specified callback URL failed verification.
   */
  | 'webhook_callback_verification_failed'

  /**
   * The notification delivery failure rate was too high
   */
  | 'notification_failures_exceeded'
  /**
   * The authorization was revoked for one or more users specified in the Condition object.
   */
  | 'authorization_revoked'
  /**
   * The moderator that authorized the subscription is no longer one of the broadcaster's moderators.
   */
  | 'moderator_removed'
  /**
   *  One of the users specified in the Condition object was removed.
   */
  | 'user_removed'
  /**
   * The user specified in the Condition object was banned from the broadcaster's chat.
   */
  | 'chat_user_banned'
  /**
   * The subscription to subscription type and version is no longer supported.
   */
  | 'version_removed'

  /**
   * The subscription to the beta subscription type was removed due to maintenance.
   */
  | 'beta_maintenance'

  /**
   * The client closed the connection.
   */
  | 'websocket_disconnected'

  /**
   * The client failed to respond to a ping message.
   */
  | 'websocket_failed_ping_pong'

  /**
   * The client sent a non-pong message.
   */
  | 'websocket_received_inbound_traffic'

  /**
   * The client failed to subscribe to events within the required time.
   */
  | 'websocket_connection_unused'

  /**
   * The Twitch WebSocket server experienced an unexpected error.
   */
  | 'websocket_internal_error'

  /**
   * The Twitch WebSocket server timed out writing the message to the client.
   */
  | 'websocket_network_timeout'

  /**
   *  The Twitch WebSocket server experienced a network error writing the message to the client.
   */
  | 'websocket_network_error'

  /**
   * The client failed to reconnect to the Twitch WebSocket server within the required time after a Reconnect Message.
   */
  | 'websocket_failed_to_reconnect';

interface EventSubscription {
  id: string;
  status: EventSubStatus;
  type: string;
  version: string;
  condition: object; // todo - type better
  created_at: string;
  transport: object; // todo - type better
  method: 'webhook' | 'websocket';
  callback: string;
  session_id: string;
  connected_at?: string;
  disconnected_at?: string;
  cost: number;
}

interface UserBlockList {
  user_id: string;
  user_login: string;
  display_name: string;
}

export const twitchService = {
  /**
   * @see https://dev.twitch.tv/docs/authentication/refresh-tokens#refreshing-access-tokens
   */
  getRefreshToken: async (refreshToken: string): Promise<RefreshToken> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data } = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID}&client_secret=${process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refreshToken}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  },

  /**
   * @see https://dev.twitch.tv/docs/api/reference/#get-global-emotes
   */
  listGlobalEmotes: async () => {
    const { data } = await twitchApi.get<{ data: Emote[] }>(
      '/chat/emotes/global',
    );
    return data;
  },

  /**
   * @returns a token for an anonymous user
   */
  getDefaultToken: async (): Promise<DefaultTokenResponse> => {
    const { data } = await axios.get<{ data: DefaultTokenResponse }>(
      `${process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL}/token`,
      {
        headers: {
          'x-api-key': process.env.EXPO_PUBLIC_AUTH_PROXY_API_KEY,
        },
      },
    );

    if (!data.data.access_token) {
      console.error('no token received from auth lambda');
    }

    return data.data;
  },

  /**
   * @param token
   * @returns a boolean indicating whether the token is valid or not
   * @see https://dev.twitch.tv/docs/authentication/validate-tokens#validating-tokens
   */
  validateToken: async (token: string): Promise<boolean> => {
    const res = await axios.get<TwitchTokenValidationResponse>(
      'https://id.twitch.tv/oauth2/validate',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res.status === 200) {
      return true;
    }

    return false;
  },

  /**
   * @param cursor
   * @returns an object that contains the top 20 streams and a cursor for further requests
   * @requires a non-anon token
   */
  getTopStreams: async (
    cursor?: string,
  ): Promise<PaginatedList<TwitchStream>> => {
    const result = await twitchApi.get<PaginatedList<TwitchStream>>(
      '/streams',
      {
        params: {
          ...(cursor && { after: cursor }),
        },
      },
    );

    return result;
  },

  getStreamsUnderCategory: async (
    gameId: string,
    headers: AxiosHeaders,
    cursor?: string,
  ): Promise<PaginatedList<TwitchStream>> => {
    const result = await twitchApi.get<PaginatedList<TwitchStream>>(
      '/streams',
      {
        headers,
        params: {
          game_id: gameId,
          ...(cursor && { after: cursor }),
        },
      },
    );

    return result;
  },

  getStream: async (userLogin: string) => {
    const params: Record<string, string> = {};

    if (userLogin) {
      params.user_login = userLogin;
    }

    const result = await twitchApi.get<{ data: TwitchStream[] }>('/streams', {
      params: {
        first: 15,
        ...params,
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

    return result[0] as Channel;
  },

  getTopCategories: async (
    cursor?: string,
    beforeCursor?: string,
  ): Promise<PaginatedList<Category>> => {
    return twitchApi.get<PaginatedList<Category>>('/games/top', {
      params: {
        ...(beforeCursor && { before: beforeCursor }),
        ...(cursor && { after: cursor }),
      },
    });
  },

  getUserImage: async (userId: string): Promise<string> => {
    const result = await twitchApi.get<{
      data: { profile_image_url: string }[];
    }>('/users', {
      params: {
        login: userId,
      },
    });

    return result.data[0]?.profile_image_url as string;
  },
  getFollowedStreams: async (userId: string): Promise<TwitchStream[]> => {
    const result = await twitchApi.get<{ data: TwitchStream[] }>(
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
        Authorization: `Bearer ${token}`,
      },
    });
    return result.data[0] as UserInfoResponse;
  },
  getUser: async (userId?: string, id?: string): Promise<UserInfoResponse> => {
    const params: Record<string, string> = {};
    if (userId) {
      params.login = userId;
    }

    if (id) {
      params.id = id;
    }

    const result = await twitchApi.get<{ data: UserInfoResponse[] }>('/users', {
      params,
    });

    return (result.data[0] as UserInfoResponse) ?? '';
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
  getStreamsByCategory: async (gameId: string, cursor?: string) => {
    return twitchApi.get<PaginatedList<TwitchStream>>('/streams', {
      params: {
        game_id: gameId,
        ...(cursor && { after: cursor }),
      },
    });
  },

  getCategory: async (id: string): Promise<Category> => {
    const result = await twitchApi.get<{ data: Category[] }>('/games', {
      params: {
        id,
      },
    });
    return result.data[0] as Category;
  },

  searchCategories: async (query: string, cursor?: string) => {
    return twitchApi.get<PaginatedList<Category>>('/search/categories', {
      params: {
        query,
        ...(cursor && { after: cursor }),
      },
    });
  },
  getClip: async (id: string): Promise<TwitchClip> => {
    const result = await twitchApi.get<TwitchClipResponse>('clips', {
      params: {
        id,
      },
    });
    return result.data[0] as TwitchClip;
  },

  /**
   * Retrieves a list of event-sub subscriptions that the client in the access token has created
   * @see https://dev.twitch.tv/docs/api/reference#get-eventsub-subscriptions
   */
  listEventSubscriptions: async ({
    status,
    type,
    after,
    subscription_id,
    user_id,
  }: {
    status?: string;
    type?: string;
    after?: string;
    subscription_id?: string;
    user_id?: string;
  }) => {
    return twitchApi.get<
      PaginatedList<EventSubscription> & {
        total_cost: number;
        max_total_cost: number;
      }
    >('/eventsub/subscriptions', {
      params: {
        status,
        type,
        user_id,
        subscription_id,
        after,
      },
    });
  },

  /**
   * Creates an EventSub subscription
   * @see https://dev.twitch.tv/docs/api/reference#create-eventsub-subscription
   */
  createEventSubscription: async ({
    type,
    version,
    condition,
    transport,
  }: {
    type: string;
    version: string;
    condition: Record<string, string>;
    transport: {
      method: 'websocket';
      session_id: string;
    };
  }) => {
    return twitchApi.post<{
      data: EventSubscription[];
      total: number;
      total_cost: number;
      max_total_cost: number;
    }>('/eventsub/subscriptions', {
      type,
      version,
      condition,
      transport,
    });
  },

  /**
   * Deletes an EventSub subscription
   * @see https://dev.twitch.tv/docs/api/reference#delete-eventsub-subscription
   */
  deleteEventSubscription: async (subscriptionId: string) => {
    return twitchApi.delete('/eventsub/subscriptions', {
      params: {
        id: subscriptionId,
      },
    });
  },

  /**
   * @see https://dev.twitch.tv/docs/api/reference#block-user
   */
  blockUser: async (
    targetUserId: string,
    sourceContext?: 'chat' | 'whisper',
    reason?: 'harassment' | 'spam' | 'other',
  ) => {
    return twitchApi.put(
      '/users/blocks',
      {},
      {
        params: {
          target_user_id: targetUserId,
          source_context: sourceContext,
          reason,
        },
      },
    );
  },

  getUserBlockList: async (
    broadcasterId: string,
    first?: number,
    after?: number,
  ) => {
    return twitchApi.get<PaginatedList<UserBlockList>>('/users/blocks', {
      params: {
        broadcaster_id: broadcasterId,
        first,
        after,
      },
    });
  },
  unblockUser: async (targetUserId: string) => {
    return twitchApi.delete('/users/blocks', {
      params: {
        target_user_id: targetUserId,
      },
    });
  },
};
