/* eslint-disable camelcase */
import type { TwitchHelixPoll } from '@app/types/twitch/poll';
import type { TwitchHelixPrediction } from '@app/types/twitch/prediction';
import Constants from 'expo-constants';
import { twitchApi, mockServerUrl, isE2EMode, twitchClientId } from './api';
import Client, { isFetchHttpError, type ClientHeaders } from './api/Client';

import {
  cacheChannelPointRewardTitle,
  getCachedChannelPointRewardTitle,
} from '@app/utils/chat/channelPointRewardTitleStore';

const authProxyBaseUrl =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL as
    | string
    | undefined) ?? process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL;

const authProxyApiKey =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_AUTH_PROXY_API_KEY as
    | string
    | undefined) ?? process.env.EXPO_PUBLIC_AUTH_PROXY_API_KEY;
const authProxyApi = new Client({ baseURL: authProxyBaseUrl });
const twitchAuthApi = new Client({ baseURL: 'https://id.twitch.tv/oauth2' });

export interface PaginatedList<T> {
  data: T[];
  pagination?: {
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
  profilePicture?: string;
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

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface AuthProxyResponse<T> {
  data: T | null;
  error?: string | null;
}

interface TwitchTokenValidationResponse {
  client_id: string;
  scopes: null;
  expires_in: number;
}

export interface TwitchClip {
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

export interface TwitchClipDownload {
  clip_id: string;
  landscape_download_url: string | null;
  portrait_download_url: string | null;
}

interface TwitchClipDownloadResponse {
  data: TwitchClipDownload[];
}

export interface TwitchClipsRequestParams {
  broadcasterId: string;
  after?: string;
  endedAt?: string;
  first?: number;
  startedAt?: string;
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

export interface UserBlockList {
  user_id: string;
  user_login: string;
  display_name: string;
}

export interface UserBlockListRequestParams {
  broadcasterId: string;
  first?: number;
  after?: number;
}

export type TwitchChatMessageFragment = {
  type: 'text' | 'cheermote' | 'emote' | 'mention';
  text: string;
  cheermote?: unknown;
  emote?: {
    id?: string;
    emote_set_id?: string;
    owner_id?: string;
    format?: string[];
  };
  mention?: {
    user_id?: string;
    user_login?: string;
    user_name?: string;
  };
};

export type TwitchPinnedChatMessage = {
  broadcaster_id?: string;
  broadcaster_login?: string;
  broadcaster_name?: string;
  created_at?: string;
  expires_at?: string | null;
  message?:
    | string
    | {
        fragments?: TwitchChatMessageFragment[];
        text?: string;
      };
  message_id: string;
  moderator_id?: string;
  moderator_login?: string;
  moderator_name?: string;
  pinned_by_login?: string;
  pinned_by_name?: string;
  pinned_by_user_id?: string;
  updated_at?: string;
};

export type TwitchSendChatMessageResult = {
  drop_reason?: {
    code: string;
    message: string;
  } | null;
  is_sent: boolean;
  message_id: string;
};

type PinnedChatMessageParams = {
  broadcasterId: string;
  moderatorId: string;
};

type PinnedChatMessageMutationParams = PinnedChatMessageParams & {
  durationSeconds?: number;
  messageId: string;
};

type SendChatMessageParams = {
  broadcasterId: string;
  forSourceOnly?: boolean;
  message: string;
  pin?: boolean;
  replyParentMessageId?: string;
  senderId: string;
};

function normalizeDuration(durationSeconds: number | undefined) {
  if (!durationSeconds) {
    return undefined;
  }

  return Math.max(1, Math.trunc(durationSeconds));
}

export function getPinnedChatMessageText(
  pinnedMessage: TwitchPinnedChatMessage,
): string {
  if (typeof pinnedMessage.message === 'string') {
    return pinnedMessage.message;
  }

  return (
    pinnedMessage.message?.text ??
    pinnedMessage.message?.fragments?.map(fragment => fragment.text).join('') ??
    ''
  );
}

export const twitchService = {
  /**
   * @see https://dev.twitch.tv/docs/authentication/refresh-tokens#refreshing-access-tokens
   */
  getRefreshToken: async (
    refreshToken: string,
  ): Promise<RefreshTokenResponse> => {
    const response = await authProxyApi.post<
      AuthProxyResponse<RefreshTokenResponse>
    >('/refresh-token', undefined, {
      params: {
        token: refreshToken,
        app: 'foam-app',
      },
      headers: {
        'x-api-key': authProxyApiKey,
      },
    });

    if (!response.data) {
      throw new Error(response.error ?? 'Failed to refresh Twitch token');
    }

    return response.data;
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
   * @see https://dev.twitch.tv/docs/api/reference/#get-pinned-chat-message
   */
  getPinnedChatMessage: async ({
    broadcasterId,
    moderatorId,
  }: PinnedChatMessageParams): Promise<TwitchPinnedChatMessage | null> => {
    const result = await twitchApi.get<{ data?: TwitchPinnedChatMessage[] }>(
      '/chat/pins',
      {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId,
        },
      },
    );

    return result.data?.[0] ?? null;
  },

  /**
   * @see https://dev.twitch.tv/docs/api/reference/#pin-chat-message
   */
  pinChatMessage: async ({
    broadcasterId,
    durationSeconds,
    messageId,
    moderatorId,
  }: PinnedChatMessageMutationParams): Promise<void> => {
    await twitchApi.put(
      '/chat/pins',
      {
        duration: normalizeDuration(durationSeconds),
        message_id: messageId,
      },
      {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId,
        },
      },
    );
  },

  /**
   * @see https://dev.twitch.tv/docs/api/reference/#update-pinned-chat-message
   */
  updatePinnedChatMessage: async ({
    broadcasterId,
    durationSeconds,
    messageId,
    moderatorId,
  }: PinnedChatMessageMutationParams): Promise<void> => {
    await twitchApi.patch(
      '/chat/pins',
      {
        duration: normalizeDuration(durationSeconds),
        message_id: messageId,
      },
      {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId,
        },
      },
    );
  },

  /**
   * @see https://dev.twitch.tv/docs/api/reference/#unpin-chat-message
   */
  unpinChatMessage: async ({
    broadcasterId,
    moderatorId,
  }: PinnedChatMessageParams): Promise<void> => {
    await twitchApi.delete('/chat/pins', {
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
      },
    });
  },

  /**
   * @see https://dev.twitch.tv/docs/api/reference/#send-chat-message
   */
  sendChatMessage: async ({
    broadcasterId,
    forSourceOnly,
    message,
    pin,
    replyParentMessageId,
    senderId,
  }: SendChatMessageParams): Promise<
    TwitchSendChatMessageResult | undefined
  > => {
    const result = await twitchApi.post<{
      data?: TwitchSendChatMessageResult[];
    }>('/chat/messages', {
      broadcaster_id: broadcasterId,
      for_source_only: forSourceOnly,
      message,
      pin,
      reply_parent_message_id: replyParentMessageId,
      sender_id: senderId,
    });

    return result.data?.[0];
  },

  /**
   * @returns a token for an anonymous user
   */
  getDefaultToken: async (): Promise<DefaultTokenResponse> => {
    // Use mock server for E2E tests
    const tokenUrl = isE2EMode
      ? `${mockServerUrl}/token`
      : `${authProxyBaseUrl}/token`;

    const response = await authProxyApi.get<{ data: DefaultTokenResponse }>(
      tokenUrl,
      {
        headers: isE2EMode
          ? {}
          : {
              'x-api-key': authProxyApiKey,
            },
      },
    );

    if (!response.data.access_token) {
      console.error('no token received from auth lambda');
    }

    return response.data;
  },

  /**
   * @param token
   * @returns a boolean indicating whether the token is valid or not
   * @see https://dev.twitch.tv/docs/authentication/validate-tokens#validating-tokens
   */
  validateToken: async (token: string): Promise<boolean> => {
    try {
      await twitchAuthApi.get<TwitchTokenValidationResponse>('/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch (error) {
      if (isFetchHttpError(error) && error.response) {
        return false;
      }
      throw error;
    }
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
        headers: {
          'Client-Id': twitchClientId,
        },
        params: {
          ...(cursor && { after: cursor }),
        },
      },
    );

    return result;
  },

  getStreamsUnderCategory: async (
    gameId: string,
    headers: ClientHeaders,
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
      headers: {
        'Client-Id': twitchClientId,
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
        'Client-Id': twitchClientId,
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
    const result = await twitchApi.get<TwitchClipResponse>('/clips', {
      params: {
        id,
      },
    });
    return result.data[0] as TwitchClip;
  },

  getClips: async ({
    after,
    broadcasterId,
    endedAt,
    first = 20,
    startedAt,
  }: TwitchClipsRequestParams): Promise<PaginatedList<TwitchClip>> => {
    return twitchApi.get<PaginatedList<TwitchClip>>('/clips', {
      params: {
        broadcaster_id: broadcasterId,
        first,
        ...(after && { after }),
        ...(endedAt && { ended_at: endedAt }),
        ...(startedAt && { started_at: startedAt }),
      },
    });
  },

  /**
   * @see https://dev.twitch.tv/docs/api/reference/#get-clips-download
   */
  getClipDownload: async ({
    broadcasterId,
    clipId,
    editorId,
  }: {
    broadcasterId: string;
    clipId: string;
    editorId: string;
  }): Promise<TwitchClipDownload | null> => {
    const result = await twitchApi.get<
      TwitchClipDownloadResponse & { error?: string; message?: string }
    >('/clips/downloads', {
      params: {
        broadcaster_id: broadcasterId,
        clip_id: clipId,
        editor_id: editorId,
      },
    });

    if (!result || !Array.isArray(result.data)) {
      throw new Error(
        result?.message ?? result?.error ?? 'Failed to get clip download URL',
      );
    }

    return result.data[0] ?? null;
  },

  getPolls: async ({
    broadcasterId,
    id,
    first,
    after,
  }: {
    broadcasterId: string;
    id?: string | string[];
    first?: number;
    after?: string;
  }) => {
    const ids = Array.isArray(id) ? id : id ? [id] : undefined;

    return twitchApi.get<PaginatedList<TwitchHelixPoll>>('/polls', {
      params: {
        broadcaster_id: broadcasterId,
        id: ids,
        first,
        after,
      },
    });
  },

  getPredictions: async ({
    broadcasterId,
    id,
    first,
    after,
  }: {
    broadcasterId: string;
    id?: string | string[];
    first?: number;
    after?: string;
  }) => {
    const ids = Array.isArray(id) ? id : id ? [id] : undefined;

    return twitchApi.get<PaginatedList<TwitchHelixPrediction>>('/predictions', {
      params: {
        broadcaster_id: broadcasterId,
        id: ids,
        first,
        after,
      },
    });
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

  getUserBlockList: async (params: UserBlockListRequestParams) => {
    return twitchApi.get<PaginatedList<UserBlockList>>('/users/blocks', {
      params: {
        broadcaster_id: params.broadcasterId,
        first: params.first,
        after: params.after,
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

  /**
   * @see https://dev.twitch.tv/docs/api/reference#get-custom-reward
   */
  getCustomChannelRewardTitle: async (
    broadcasterId: string,
    rewardId: string,
  ): Promise<string | undefined> => {
    const cached = getCachedChannelPointRewardTitle(broadcasterId, rewardId);
    if (cached) {
      return cached;
    }

    try {
      const { data } = await twitchApi.get<{
        data: { id: string; title: string }[];
      }>('/channel_points/custom_rewards', {
        params: {
          broadcaster_id: broadcasterId,
          id: rewardId,
        },
      });
      const title = data[0]?.title?.trim();
      if (title) {
        cacheChannelPointRewardTitle(broadcasterId, rewardId, title);
        return title;
      }
    } catch {
      return undefined;
    }
    return undefined;
  },
};
