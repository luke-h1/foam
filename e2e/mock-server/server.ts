/* eslint-disable camelcase */
/**
 * Mock Server for E2E Testing
 *
 * This server mocks the Twitch Helix API and other services for E2E testing
 * with Detox. It provides deterministic responses for consistent test results.
 *
 * Usage:
 *   bun run e2e:mock-server
 *
 * The server runs on port 3001 by default (configurable via MOCK_SERVER_PORT env var)
 */

import {
  getTopCategoriesResponse,
  getCategoryById,
  searchCategories,
  mockCategories,
} from './fixtures/categories';
import {
  getTopStreamsResponse,
  getStreamByLogin,
  mockStreams,
} from './fixtures/streams';
import {
  getUserByLogin,
  getUserById,
  searchChannels,
  getFollowedStreams,
} from './fixtures/users';
import {
  globalBttvEmotes,
  channelBttvEmotes,
  ffzGlobalSet,
  ffzRoom,
  ffzBadges,
  sevenTvGlobalEmoteSet,
  sevenTvChannelUser,
  sevenTvCosmetics,
  sampleChatMessages,
} from './fixtures/emotes';

declare const Bun: {
  serve(options: {
    port: number;
    fetch(request: Request, server: BunServer): Response | Promise<Response>;
    websocket?: {
      open(ws: BunWebSocket): void;
      message(ws: BunWebSocket, message: string | Uint8Array): void;
      close(ws: BunWebSocket): void;
    };
  }): unknown;
};

interface BunServer {
  upgrade(request: Request): boolean;
}

interface BunWebSocket {
  send(data: string): void;
  close(): void;
  readyState: number;
}

type Handler = (request: Request, url: URL) => Response;

const PORT = Number(process.env.MOCK_SERVER_PORT ?? 3001);

const responseHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...responseHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      ...init?.headers,
    },
  });

const firstParam = (url: URL, name: string) =>
  url.searchParams.get(name) ?? undefined;

const withRouteParams = (
  pathname: string,
  pattern: RegExp,
  handler: Handler,
): Handler | undefined => (pattern.test(pathname) ? handler : undefined);

const health = () =>
  json({ status: 'ok', timestamp: new Date().toISOString() });

const streams: Handler = (_request, url) => {
  const userLogin = firstParam(url, 'user_login');
  const gameId = firstParam(url, 'game_id');
  const after = firstParam(url, 'after');

  if (userLogin) {
    const stream = getStreamByLogin(userLogin);
    return json({ data: stream ? [stream] : [] });
  }

  if (gameId) {
    const categoryStreams = mockStreams.filter(s => s.game_id === gameId);
    return json({
      data: categoryStreams,
      pagination: {},
    });
  }

  return json(getTopStreamsResponse(after));
};

const followedStreams: Handler = (_request, url) =>
  json(getFollowedStreams(firstParam(url, 'user_id') ?? ''));

const topGames: Handler = (_request, url) =>
  json(getTopCategoriesResponse(firstParam(url, 'after')));

const games: Handler = (_request, url) => {
  const category = getCategoryById(firstParam(url, 'id') ?? '');
  return json({ data: category ? [category] : [] });
};

const searchGameCategories: Handler = (_request, url) =>
  json(searchCategories(firstParam(url, 'query') ?? ''));

const searchGameChannels: Handler = (_request, url) =>
  json({ data: searchChannels(firstParam(url, 'query') ?? '') });

const users: Handler = (_request, url) => {
  const login = firstParam(url, 'login');
  const id = firstParam(url, 'id');

  if (login) {
    const user = getUserByLogin(login);
    return json({ data: user ? [user] : [] });
  }

  if (id) {
    const user = getUserById(id);
    return json({ data: user ? [user] : [] });
  }

  const testUser = getUserByLogin('testuser');
  return json({ data: testUser ? [testUser] : [] });
};

const channels: Handler = (_request, url) => {
  const user = getUserById(firstParam(url, 'broadcaster_id') ?? '');

  if (!user) {
    return json([]);
  }

  return json([
    {
      broadcasterId: user.id,
      broadcasterLogin: user.login,
      broadcasterName: user.display_name,
    },
  ]);
};

const globalTwitchEmotes = () =>
  json({
    data: [
      {
        id: '1',
        name: 'Kappa',
        format: ['static'],
        images: {
          url_1x:
            'https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/1.0',
          url_2x:
            'https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/2.0',
          url_4x:
            'https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/3.0',
        },
      },
      {
        id: '2',
        name: 'PogChamp',
        format: ['static'],
        images: {
          url_1x:
            'https://static-cdn.jtvnw.net/emoticons/v2/305954156/static/light/1.0',
          url_2x:
            'https://static-cdn.jtvnw.net/emoticons/v2/305954156/static/light/2.0',
          url_4x:
            'https://static-cdn.jtvnw.net/emoticons/v2/305954156/static/light/3.0',
        },
      },
    ],
  });

const anonymousToken = () =>
  json({
    data: {
      access_token: 'mock_access_token_for_e2e_testing',
      expires_in: 3600,
      token_type: 'bearer',
    },
  });

const refreshedToken = () =>
  json({
    access_token: 'mock_refreshed_access_token',
    refresh_token: 'mock_refresh_token',
    expires_in: 3600,
    scope: 'user:read:email',
    token_type: 'bearer',
  });

const validateOauth: Handler = request => {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return json({ message: 'Unauthorized' }, { status: 401 });
  }

  return json({
    client_id: 'mock_client_id',
    scopes: null,
    expires_in: 3600,
  });
};

const globalBttvEmotesHandler: Handler = () => json(globalBttvEmotes);

const channelBttvEmotesHandler: Handler = (_request, url) => {
  const twitchId = url.pathname.split('/').pop() ?? 'unknown';
  return json(channelBttvEmotes(twitchId));
};

const channelTwitchEmotes = () =>
  json({
    data: [
      {
        id: '300000001',
        name: 'mockChannelEmote',
        emote_type: 'subscriptions',
        emote_set_id: '1',
        tier: '1000',
        format: ['static'],
        scale: ['1.0', '2.0', '3.0'],
        theme_mode: ['light', 'dark'],
        images: {
          url_1x:
            'https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/1.0',
          url_2x:
            'https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/2.0',
          url_4x:
            'https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/3.0',
        },
      },
    ],
    template:
      'https://static-cdn.jtvnw.net/emoticons/v2/{{id}}/{{format}}/{{theme_mode}}/{{scale}}',
  });

const channelTwitchBadges = () =>
  json({
    data: [
      {
        set_id: 'subscriber',
        versions: [
          {
            id: '0',
            title: 'Subscriber',
            description: 'Subscriber',
            image_url_1x:
              'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1',
            image_url_2x:
              'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2',
            image_url_4x:
              'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3',
            click_action: null,
            click_url: null,
          },
        ],
      },
    ],
  });

const globalTwitchBadges = () =>
  json({
    data: [
      {
        set_id: 'moderator',
        versions: [
          {
            id: '1',
            title: 'Moderator',
            description: 'Moderator',
            image_url_1x:
              'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1',
            image_url_2x:
              'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2',
            image_url_4x:
              'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3',
            click_action: null,
            click_url: null,
          },
        ],
      },
    ],
  });

const ffzRoomHandler: Handler = (_request, url) => {
  const channelId = url.pathname.split('/').pop() ?? '1';
  return json(ffzRoom(channelId));
};

const ffzGlobalSetHandler: Handler = () => json(ffzGlobalSet);
const ffzBadgesHandler: Handler = () => json(ffzBadges);

const sevenTvGlobalEmoteSetHandler: Handler = () => json(sevenTvGlobalEmoteSet);

const sevenTvChannelUserHandler: Handler = (_request, url) => {
  const twitchId = url.pathname.split('/').pop() ?? '0';
  return json(sevenTvChannelUser(twitchId));
};

const sevenTvCosmeticsHandler: Handler = () => json(sevenTvCosmetics);

const reset = () => json({ status: 'reset complete' });

const routes: Record<string, Partial<Record<string, Handler>>> = {
  GET: {
    '/3/cached/emotes/global': globalBttvEmotesHandler,
    '/health': health,
    '/helix/channels': channels,
    '/helix/chat/badges': channelTwitchBadges,
    '/helix/chat/badges/global': globalTwitchBadges,
    '/helix/chat/emotes': channelTwitchEmotes,
    '/helix/chat/emotes/global': globalTwitchEmotes,
    '/helix/eventsub/subscriptions': () =>
      json({ data: [], total: 0, max_total_cost: 10000, total_cost: 0 }),
    '/helix/games': games,
    '/helix/games/top': topGames,
    '/helix/search/categories': searchGameCategories,
    '/helix/search/channels': searchGameChannels,
    '/helix/streams': streams,
    '/helix/streams/followed': followedStreams,
    '/helix/users': users,
    '/mock/categories': () => json(mockCategories),
    '/mock/streams': () => json(mockStreams),
    '/oauth2/validate': validateOauth,
    '/token': anonymousToken,
    '/v1/badges': ffzBadgesHandler,
    '/v1/set/global': ffzGlobalSetHandler,
    '/v3/cosmetics': sevenTvCosmeticsHandler,
    '/v3/emote-sets/global': sevenTvGlobalEmoteSetHandler,
  },
  POST: {
    '/helix/eventsub/subscriptions': () =>
      json(
        {
          data: [
            {
              id: 'mock-sub-id',
              status: 'enabled',
              type: 'channel.chat.message',
              version: '1',
              cost: 0,
              condition: {},
              transport: { method: 'websocket', session_id: 'mock-session' },
              created_at: new Date().toISOString(),
            },
          ],
          total: 1,
          max_total_cost: 10000,
          total_cost: 0,
        },
        { status: 202 },
      ),
    '/mock/reset': reset,
    '/oauth2/token': refreshedToken,
  },
  DELETE: {
    '/helix/eventsub/subscriptions': () => new Response(null, { status: 204 }),
  },
};

const paramRoutes: Record<string, [RegExp, Handler][]> = {
  GET: [
    [/^\/3\/cached\/users\/twitch\/[^/]+$/, channelBttvEmotesHandler],
    [/^\/v1\/room\/id\/[^/]+$/, ffzRoomHandler],
    [/^\/v3\/users\/twitch\/[^/]+$/, sevenTvChannelUserHandler],
  ],
};

const getHandler = (method: string, pathname: string) =>
  routes[method]?.[pathname] ??
  paramRoutes[method]
    ?.map(([pattern, handler]) => withRouteParams(pathname, pattern, handler))
    .find((handler): handler is Handler => handler !== undefined);

const handleRequest = (request: Request) => {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: responseHeaders,
      status: 204,
    });
  }

  console.log(
    `[${new Date().toISOString()}] ${request.method} ${url.pathname}`,
  );

  const handler = getHandler(request.method, url.pathname);

  if (!handler) {
    console.warn(`[404] Route not found: ${request.method} ${url.pathname}`);
    return json({ error: 'Not found' }, { status: 404 });
  }

  return handler(request, url);
};

const IRC_PORT = Number(process.env.MOCK_IRC_PORT ?? 6667);

// Minimal IRC-over-WebSocket mock that satisfies the Twitch chat handshake.
// Sends GLOBALUSERSTATE + ROOMSTATE after CAP / NICK / JOIN so the app
// transitions out of the "connecting" state.
Bun.serve({
  port: IRC_PORT,
  fetch: (request, server) => {
    if (server.upgrade(request)) {
      return new Response(null, { status: 101 });
    }
    return new Response('IRC WebSocket server', { status: 200 });
  },
  websocket: {
    open(ws) {
      ws.send(':tmi.twitch.tv 001 justinfan12345 :Welcome, GLHF!');
      ws.send(':tmi.twitch.tv 002 justinfan12345 :Your host is tmi.twitch.tv');
      ws.send(':tmi.twitch.tv 003 justinfan12345 :This server is rather new');
      ws.send(':tmi.twitch.tv 004 justinfan12345 :-');
      ws.send(':tmi.twitch.tv 375 justinfan12345 :-');
      ws.send(
        ':tmi.twitch.tv 372 justinfan12345 :You are in a maze of twisty passages.',
      );
      ws.send(':tmi.twitch.tv 376 justinfan12345 :>');
    },
    message(ws, message) {
      const msg = typeof message === 'string' ? message : message.toString();

      if (msg.startsWith('CAP REQ')) {
        ws.send(
          ':tmi.twitch.tv CAP * ACK :twitch.tv/commands twitch.tv/membership twitch.tv/tags',
        );
        return;
      }

      if (msg.startsWith('JOIN')) {
        const channel = msg.split(' ')[1]?.trim() ?? '#unknown';
        ws.send(
          `:justinfan12345!justinfan12345@justinfan12345.tmi.twitch.tv JOIN ${channel}`,
        );
        ws.send(
          `@emote-only=0;followers-only=-1;r9k=0;slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE ${channel}`,
        );
        ws.send(
          `@color=;display-name=justinfan12345;emote-sets=0;user-id=12345;user-type= :tmi.twitch.tv GLOBALUSERSTATE`,
        );
        ws.send(
          `:tmi.twitch.tv 353 justinfan12345 = ${channel} :justinfan12345`,
        );
        ws.send(
          `:tmi.twitch.tv 366 justinfan12345 ${channel} :End of /NAMES list`,
        );
        // Send a burst of sample chat messages with third-party emote references
        // so the chat renders populated content in E2E tests.
        for (const chatMsg of sampleChatMessages(channel)) {
          ws.send(chatMsg);
        }
        return;
      }

      if (msg === 'PING :tmi.twitch.tv' || msg.startsWith('PING')) {
        ws.send('PONG :tmi.twitch.tv');
      }
    },
    close(_ws) {},
  },
});

Bun.serve({
  port: PORT,
  fetch: (request, _server) => {
    try {
      return handleRequest(request);
    } catch (error) {
      console.error('[Error]', error);
      return json({ error: 'Internal server error' }, { status: 500 });
    }
  },
});

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    Foam E2E Mock Server                         ║
╠══════════════════════════════════════════════════════════════════╣
║  HTTP server:  http://localhost:${PORT}                         ║
║  IRC WebSocket: ws://localhost:${IRC_PORT}                      ║
║                                                                 ║
║  Available endpoints:                                           ║
║  - GET  /health                    Health check                 ║
║  - GET  /helix/streams             Top streams                  ║
║  - GET  /helix/streams/followed    Followed streams             ║
║  - GET  /helix/games/top           Top categories               ║
║  - GET  /helix/games               Category by ID               ║
║  - GET  /helix/search/categories   Search categories            ║
║  - GET  /helix/search/channels     Search channels              ║
║  - GET  /helix/users               User info                    ║
║  - GET  /helix/channels            Channel info                 ║
║  - GET  /token                     Auth token                   ║
║  - GET  /3/cached/emotes/global    BTTV global emotes           ║
║  - GET  /3/cached/users/twitch/:id BTTV channel emotes          ║
║  - GET  /v1/set/global             FFZ global emotes            ║
║  - GET  /v1/room/id/:id            FFZ channel emotes           ║
║  - GET  /v1/badges                 FFZ badges                   ║
║  - GET  /v3/emote-sets/global      7TV global emote set         ║
║  - GET  /v3/users/twitch/:id       7TV channel user+emotes      ║
║  - GET  /v3/cosmetics              7TV cosmetics/badges         ║
║                                                                 ║
║  Debug endpoints:                                               ║
║  - GET  /mock/streams              List all mock streams        ║
║  - GET  /mock/categories           List all mock categories     ║
║  - POST /mock/reset                Reset mock state             ║
╚══════════════════════════════════════════════════════════════════╝
`);
