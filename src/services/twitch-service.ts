/* eslint-disable camelcase */
import { fetch } from 'expo/fetch';
import Constants from 'expo-constants';

import { parseJsonOnWorklet } from '@app/lib/offThreadJson';
import type { PaginatedList } from '@app/types/twitch/api';
import type {
  DefaultTokenResponse,
  RefreshTokenResponse,
} from '@app/types/twitch/auth';
import type { TwitchCheermote } from '@app/types/twitch/bits';
import type { Category } from '@app/types/twitch/category';
import type {
  Channel,
  FollowedChannel,
  SearchChannelResponse,
} from '@app/types/twitch/channel';
import type {
  TwitchPinnedChatMessage,
  TwitchSendChatMessageResult,
} from '@app/types/twitch/chat';
import type {
  TwitchClip,
  TwitchClipDownload,
  TwitchClipsRequestParams,
  TwitchCreatedClip,
} from '@app/types/twitch/clip';
import type { TwitchChatSettingsPatch } from '@app/types/twitch/moderation';
import type { TwitchHelixPoll } from '@app/types/twitch/poll';
import type { TwitchHelixPrediction } from '@app/types/twitch/prediction';
import type { TwitchStream } from '@app/types/twitch/stream';
import type {
  UserBlockList,
  UserBlockListRequestParams,
  UserInfoResponse,
} from '@app/types/twitch/user';
import type {
  TwitchVideo,
  TwitchVideosRequestParams,
} from '@app/types/twitch/video';
import {
  cacheChannelPointRewardTitle,
  getCachedChannelPointRewardTitle,
} from '@app/utils/chat/channelPointRewardTitleStore';
import { logger } from '@app/utils/logger';

import {
  getTwitchClientId,
  isE2EMode,
  mockServerUrl,
  setTwitchClientId,
  twitchApi,
} from './api/clients';

const authProxyBaseUrl =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL as
    string | undefined) ?? process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL;

const authProxyApiKey =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_AUTH_PROXY_API_KEY as
    string | undefined) ?? process.env.EXPO_PUBLIC_AUTH_PROXY_API_KEY;

// Cap follow-list pagination so a pathological follow count (Helix allows
// thousands) can't fan out into dozens of sequential requests on tab load.
const MAX_FOLLOWED_CHANNELS = 400;

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

interface AuthProxyResponse<T> {
  data: T | null;
  error?: string | null;
}

interface TwitchClipResponse {
  data: TwitchClip[];
}

interface TwitchClipDownloadResponse {
  data: TwitchClipDownload[];
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
    const url = new URL(`${authProxyBaseUrl}/refresh-token`);
    url.searchParams.set('token', refreshToken);
    url.searchParams.set('app', 'foam-app');

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'x-api-key': authProxyApiKey ?? '' },
    });
    const body = await parseJsonOnWorklet<
      AuthProxyResponse<RefreshTokenResponse>
    >(await res.text());

    if (!body.data) {
      throw new Error(body.error ?? 'Failed to refresh Twitch token');
    }

    return body.data;
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
    const tokenUrl = isE2EMode
      ? `${mockServerUrl}/token`
      : `${authProxyBaseUrl}/token`;

    const res = await fetch(tokenUrl, {
      headers: isE2EMode ? {} : { 'x-api-key': authProxyApiKey ?? '' },
    });
    const body = await parseJsonOnWorklet<{ data: DefaultTokenResponse }>(
      await res.text(),
    );

    if (!body.data.access_token) {
      logger.auth.error('no token received from auth lambda');
    } else {
      // Fresh proxy tokens may be issued under a different client ID than
      // EXPO_PUBLIC_TWITCH_CLIENT_ID; sync the Helix Client-Id header to it.
      await twitchService.validateToken(body.data.access_token);
    }

    return body.data;
  },

  /**
   * @param token
   * @returns a boolean indicating whether the token is valid or not
   * @see https://dev.twitch.tv/docs/authentication/validate-tokens#validating-tokens
   */
  validateToken: async (token: string): Promise<boolean> => {
    if (isE2EMode) {
      return true;
    }
    const res = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status !== 200) {
      return false;
    }
    // Helix rejects requests whose Client-Id header does not match the client
    // the token was issued for, so adopt the token's client ID.
    const body = await parseJsonOnWorklet<{
      client_id?: string;
      expires_in?: number;
    } | null>(await res.text()).catch(() => null);
    if (body?.client_id && body.client_id !== getTwitchClientId()) {
      setTwitchClientId(body.client_id);
    }
    if (typeof body?.expires_in === 'number') {
      logger.auth.info('twitch token validated', {
        name: 'auth_info',
        expiresInSeconds: body.expires_in,
        expiresAt: new Date(Date.now() + body.expires_in * 1000).toISOString(),
      });
    }
    return true;
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
    headers: Record<string, string>,
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

  getCheermotes: async (broadcasterId?: string): Promise<TwitchCheermote[]> => {
    const result = await twitchApi.get<{ data: TwitchCheermote[] }>(
      '/bits/cheermotes',
      {
        params: {
          ...(broadcasterId && { broadcaster_id: broadcasterId }),
        },
      },
    );
    return result.data;
  },

  getFollowedChannels: async (userId: string): Promise<FollowedChannel[]> => {
    const channels: FollowedChannel[] = [];
    let cursor: string | undefined;

    do {
      const result = await twitchApi.get<PaginatedList<FollowedChannel>>(
        '/channels/followed',
        {
          params: {
            user_id: userId,
            first: 100,
            ...(cursor && { after: cursor }),
          },
        },
      );
      channels.push(...result.data);
      cursor = result.pagination?.cursor;
    } while (cursor && channels.length < MAX_FOLLOWED_CHANNELS);

    return channels;
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

  getUsersById: async (ids: string[]): Promise<UserInfoResponse[]> => {
    if (ids.length === 0) {
      return [];
    }

    // Helix /users takes repeated id params (max 100 per request), which the
    // shared client's comma-joining array serializer can't produce.
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += 100) {
      batches.push(ids.slice(i, i + 100));
    }

    const results = await Promise.all(
      batches.map(batch =>
        twitchApi.get<{ data: UserInfoResponse[] }>(
          `/users?${batch.map(id => `id=${encodeURIComponent(id)}`).join('&')}`,
        ),
      ),
    );

    return results.flatMap(result => result.data ?? []);
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
  /**
   * @see https://dev.twitch.tv/docs/api/reference/#create-clip
   * Requires the clips:edit scope. Twitch captures the clip asynchronously;
   * the returned edit_url is valid immediately, the clip itself shortly after.
   * Returns null when Twitch accepts the request but produces no clip (e.g.
   * clipping restricted on the channel or the stream just went offline).
   */
  createClip: async (
    broadcasterId: string,
  ): Promise<TwitchCreatedClip | null> => {
    const result = await twitchApi.post<{ data: TwitchCreatedClip[] }>(
      '/clips',
      undefined,
      {
        params: {
          broadcaster_id: broadcasterId,
        },
      },
    );
    return result.data?.[0] ?? null;
  },

  getClip: async (id: string): Promise<TwitchClip> => {
    const result = await twitchApi.get<TwitchClipResponse>('/clips', {
      params: {
        id,
      },
    });
    return result.data[0] as TwitchClip;
  },

  /**
   * @see https://dev.twitch.tv/docs/api/reference/#ban-user
   * A duration makes it a timeout; without one the ban is permanent.
   */
  banChatUser: async (
    broadcasterId: string,
    moderatorId: string,
    userId: string,
    options?: { durationSeconds?: number; reason?: string },
  ): Promise<void> => {
    await twitchApi.post(
      '/moderation/bans',
      {
        data: {
          user_id: userId,
          ...(options?.durationSeconds && {
            duration: options.durationSeconds,
          }),
          ...(options?.reason && { reason: options.reason }),
        },
      },
      {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId,
        },
      },
    );
  },

  deleteChatMessage: async (
    broadcasterId: string,
    moderatorId: string,
    messageId: string,
  ): Promise<void> => {
    await twitchApi.delete('/moderation/chat', {
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
        message_id: messageId,
      },
    });
  },

  unbanChatUser: async (
    broadcasterId: string,
    moderatorId: string,
    userId: string,
  ): Promise<void> => {
    await twitchApi.delete('/moderation/bans', {
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
        user_id: userId,
      },
    });
  },

  warnChatUser: async (
    broadcasterId: string,
    moderatorId: string,
    userId: string,
    reason: string,
  ): Promise<void> => {
    await twitchApi.post(
      '/moderation/warnings',
      {
        data: {
          user_id: userId,
          reason,
        },
      },
      {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId,
        },
      },
    );
  },

  sendChatAnnouncement: async (
    broadcasterId: string,
    moderatorId: string,
    message: string,
  ): Promise<void> => {
    await twitchApi.post(
      '/chat/announcements',
      { message },
      {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId,
        },
      },
    );
  },

  sendShoutout: async (
    fromBroadcasterId: string,
    toBroadcasterId: string,
    moderatorId: string,
  ): Promise<void> => {
    await twitchApi.post('/chat/shoutouts', undefined, {
      params: {
        from_broadcaster_id: fromBroadcasterId,
        to_broadcaster_id: toBroadcasterId,
        moderator_id: moderatorId,
      },
    });
  },

  updateChatSettings: async (
    broadcasterId: string,
    moderatorId: string,
    patch: TwitchChatSettingsPatch,
  ): Promise<void> => {
    await twitchApi.patch('/chat/settings', patch, {
      params: {
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
      },
    });
  },

  updateShieldMode: async (
    broadcasterId: string,
    moderatorId: string,
    isActive: boolean,
  ): Promise<void> => {
    await twitchApi.put(
      '/moderation/shield_mode',
      { is_active: isActive },
      {
        params: {
          broadcaster_id: broadcasterId,
          moderator_id: moderatorId,
        },
      },
    );
  },

  getClipsByIds: async (ids: string[]): Promise<TwitchClip[]> => {
    if (ids.length === 0) {
      return [];
    }

    // Helix /clips takes repeated id params (max 100 per request), which the
    // shared client's comma-joining array serializer can't produce.
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += 100) {
      batches.push(ids.slice(i, i + 100));
    }

    const results = await Promise.all(
      batches.map(batch =>
        twitchApi.get<{ data: TwitchClip[] }>(
          `/clips?${batch.map(id => `id=${encodeURIComponent(id)}`).join('&')}`,
        ),
      ),
    );

    return results.flatMap(result => result.data ?? []);
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
   * @see https://dev.twitch.tv/docs/api/reference/#get-videos
   */
  getVideos: async ({
    after,
    first = 20,
    type = 'archive',
    userId,
  }: TwitchVideosRequestParams): Promise<PaginatedList<TwitchVideo>> => {
    return twitchApi.get<PaginatedList<TwitchVideo>>('/videos', {
      params: {
        user_id: userId,
        first,
        type,
        ...(after && { after }),
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
