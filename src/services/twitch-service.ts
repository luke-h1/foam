import { fetch } from 'expo/fetch';
import { z } from 'zod';

import { parseJsonOnWorklet } from '@app/lib/off-thread-json/parseJsonOnWorklet';
import type { PaginatedList } from '@app/types/twitch/api';
import type {
  DefaultTokenResponse,
  RefreshTokenResponse,
} from '@app/types/twitch/auth';
import type { TwitchCheermote } from '@app/types/twitch/bits';
import type { Category } from '@app/types/twitch/category';
import type {
  FollowedChannel,
  SearchChannelResponse,
} from '@app/types/twitch/channel';
import type {
  TwitchPinnedChatMessage,
  TwitchSendChatMessageResult,
} from '@app/types/twitch/chat';
import type {
  TwitchClip,
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
import { chunk } from '@app/utils/collection/chunk';
import { logger } from '@app/utils/logger';

import { getTwitchClientId, setTwitchClientId, twitchApi } from './api/clients';
import {
  authProxyApiKey,
  authProxyBaseUrl,
  isE2EMode,
  mockServerUrl,
} from './api/env';
import { validateTwitchToken } from './api/twitch-token-validation';

// Cap follow-list pagination so a pathological follow count (Helix allows
// thousands) can't fan out into dozens of sequential requests on tab load.
const MAX_FOLLOWED_CHANNELS = 400;

const tokenExpirySecondsSchema = z.number();

interface AuthProxyResponse<T> {
  data: T | null;
  error?: string | null;
}

interface TwitchClipResponse {
  data: TwitchClip[];
}

type EventSubStatus =
  | 'enabled'
  | 'webhook_callback_verification_pending'
  | 'webhook_callback_verification_failed'
  | 'notification_failures_exceeded'
  | 'authorization_revoked'
  | 'moderator_removed'
  | 'user_removed'
  | 'chat_user_banned'
  | 'version_removed'
  | 'beta_maintenance'
  /**
   * The client (not the server) closed the connection.
   */
  | 'websocket_disconnected'
  | 'websocket_failed_ping_pong'
  /**
   * The client sent a non-pong message.
   */
  | 'websocket_received_inbound_traffic'
  /**
   * The client failed to subscribe to events within the required time.
   */
  | 'websocket_connection_unused'
  | 'websocket_internal_error'
  | 'websocket_network_timeout'
  | 'websocket_network_error'
  | 'websocket_failed_to_reconnect';

interface EventSubscription {
  id: string;
  status: EventSubStatus;
  type: string;
  version: string;
  condition: object;
  created_at: string;
  transport: object;
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

// Helix takes repeated id params (max 100 per request), which the shared
// client's comma-joining array serializer can't produce.
async function fetchBatchedByIds<T>(
  basePath: string,
  ids: string[],
  paramName: 'id' | 'login' = 'id',
): Promise<T[]> {
  if (ids.length === 0) {
    return [];
  }

  const results = await Promise.all(
    chunk(ids, 100).map(batch =>
      twitchApi.get<{ data: T[] }>(
        `${basePath}?${batch.map(id => `${paramName}=${encodeURIComponent(id)}`).join('&')}`,
      ),
    ),
  );

  return results.flatMap(result => result.data ?? []);
}

type PinnedChatMessageParts = Exclude<
  NonNullable<TwitchPinnedChatMessage['message']>,
  string
>;

const isPinnedChatMessageParts = (
  message: TwitchPinnedChatMessage['message'],
): message is PinnedChatMessageParts => message instanceof Object;

export function getPinnedChatMessageText(
  pinnedMessage: TwitchPinnedChatMessage,
): string {
  const { message } = pinnedMessage;

  if (isPinnedChatMessageParts(message)) {
    return (
      message.text ??
      message.fragments?.map(fragment => fragment.text).join('') ??
      ''
    );
  }

  return message ?? '';
}

interface AuthProxyRequest {
  method: 'GET' | 'POST';
  path: '/token' | '/refresh-token';
  searchParams?: Record<string, string>;
  label: string;
}

async function requestAuthProxy<T>({
  method,
  path,
  searchParams = {},
  label,
}: AuthProxyRequest): Promise<T> {
  let url: URL;

  try {
    url = new URL(`${isE2EMode ? mockServerUrl : authProxyBaseUrl}${path}`);
  } catch {
    throw new Error(`Auth proxy ${label} URL is not valid`);
  }

  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    method,
    headers: isE2EMode ? {} : { 'x-api-key': authProxyApiKey },
  });

  if (!res.ok) {
    throw new Error(
      `Auth proxy ${label} request failed: HTTP ${res.status} (${res.headers.get('content-type') ?? 'no content-type'})`,
    );
  }

  return parseJsonOnWorklet<T>(await res.text());
}

export const twitchService = {
  /**
   * @see https://dev.twitch.tv/docs/authentication/refresh-tokens#refreshing-access-tokens
   */
  getRefreshToken: async (
    refreshToken: string,
  ): Promise<RefreshTokenResponse> => {
    const body = await requestAuthProxy<
      AuthProxyResponse<RefreshTokenResponse>
    >({
      method: 'POST',
      path: '/refresh-token',
      searchParams: { token: refreshToken, app: 'foam-app' },
      label: 'refresh',
    });

    if (!body.data) {
      throw new Error(body.error ?? 'Failed to refresh Twitch token');
    }

    return body.data;
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

  getDefaultToken: async (): Promise<DefaultTokenResponse> => {
    const body = await requestAuthProxy<{ data: DefaultTokenResponse }>({
      method: 'GET',
      path: '/token',
      label: 'token',
    });

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
   * @returns whether the token is valid
   * @see https://dev.twitch.tv/docs/authentication/validate-tokens#validating-tokens
   */
  validateToken: async (token: string): Promise<boolean> => {
    const validation = await validateTwitchToken(token);

    if (!validation) {
      return false;
    }

    // Helix rejects requests whose Client-Id header does not match the client
    // the token was issued for, so adopt the token's client ID.
    if (validation.clientId && validation.clientId !== getTwitchClientId()) {
      setTwitchClientId(validation.clientId);
    }

    const expiresIn = tokenExpirySecondsSchema.safeParse(
      validation.expiresInSeconds,
    );

    if (expiresIn.success) {
      logger.auth.info('twitch token validated', {
        name: 'auth_info',
        expiresInSeconds: expiresIn.data,
        expiresAt: new Date(Date.now() + expiresIn.data * 1000).toISOString(),
      });
    }

    return true;
  },

  /**
   * The top 20 streams per page. Needs a non-anonymous token.
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

  getStream: async (userLogin: string) => {
    const params: Record<string, string> = {};

    if (userLogin) {
      params['user_login'] = userLogin;
    }

    const result = await twitchApi.get<{ data: TwitchStream[] }>('/streams', {
      params: {
        first: 15,
        ...params,
      },
    });

    // An offline channel has no stream. React Query rejects `undefined` data
    // as an error, so offline is `null`.
    return result.data[0] ?? null;
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
    // SAFETY: Helix /users returns one entry for the token's own user
    return result.data[0] as UserInfoResponse;
  },
  getUser: async (userId?: string, id?: string): Promise<UserInfoResponse> => {
    const params: Record<string, string> = {};

    if (userId) {
      params['login'] = userId;
    }

    if (id) {
      params['id'] = id;
    }

    const result = await twitchApi.get<{ data: UserInfoResponse[] }>('/users', {
      params,
    });

    // SAFETY: Helix /users returns one entry for a single login or id
    return (result.data[0] as UserInfoResponse) ?? '';
  },

  getUsersById: (ids: string[]): Promise<UserInfoResponse[]> =>
    fetchBatchedByIds<UserInfoResponse>('/users', ids),

  getUsersByLogin: (logins: string[]): Promise<UserInfoResponse[]> =>
    fetchBatchedByIds<UserInfoResponse>('/users', logins, 'login'),

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

  getCategory: async (id: string): Promise<Category | null> => {
    const result = await twitchApi.get<{ data: Category[] }>('/games', {
      params: {
        id,
      },
    });

    // An unknown id returns no entry. React Query rejects `undefined` data
    // as an error, so not found is `null`.
    return result.data[0] ?? null;
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
   * Needs clips:edit; null when Twitch accepts but produces no clip.
   * @see https://dev.twitch.tv/docs/api/reference/#create-clip
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

  /**
   * Helix answers a deleted or unknown clip id with an empty `data` array.
   */
  getClip: async (id: string): Promise<TwitchClip | null> => {
    const result = await twitchApi.get<TwitchClipResponse>('/clips', {
      params: {
        id,
      },
    });

    return result.data?.[0] ?? null;
  },

  /**
   * @see https://dev.twitch.tv/docs/api/reference/#ban-user
   * A duration makes it a timeout; without one the ban is permanent.
   */
  banChatUser: async (
    broadcasterId: string,
    moderatorId: string,
    userId: string,
    options?: {
      durationSeconds?: number;
      reason?: string;
    },
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

  getClipsByIds: (ids: string[]): Promise<TwitchClip[]> =>
    fetchBatchedByIds<TwitchClip>('/clips', ids),

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
    let ids: string[] | undefined;

    if (Array.isArray(id)) {
      ids = id;
    } else if (id) {
      ids = [id];
    }

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
    let ids: string[] | undefined;

    if (Array.isArray(id)) {
      ids = id;
    } else if (id) {
      ids = [id];
    }

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
};
