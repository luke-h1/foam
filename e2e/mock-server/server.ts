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

declare const Bun: {
  serve(options: {
    port: number;
    fetch(request: Request): Response | Promise<Response>;
  }): unknown;
};

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

const globalBttvEmotes = () =>
  json([
    { id: 'bttv1', code: 'OMEGALUL', imageType: 'png', animated: false },
    { id: 'bttv2', code: 'monkaS', imageType: 'png', animated: false },
  ]);

const channelBttvEmotes = () =>
  json({
    channelEmotes: [
      {
        id: 'bttvch1',
        code: 'FeelsGoodMan',
        imageType: 'png',
        animated: false,
      },
    ],
    sharedEmotes: [],
  });

const ffzRoom = () =>
  json({
    room: { set: 1 },
    sets: {
      1: {
        emoticons: [
          {
            id: 1,
            name: 'LULW',
            urls: { 1: 'https://cdn.frankerfacez.com/emote/128054/1' },
          },
        ],
      },
    },
  });

const sevenTvGlobalEmotes = () =>
  json({
    emotes: [
      {
        id: '7tv1',
        name: 'Sadge',
        data: { host: { url: 'https://cdn.7tv.app/emote/7tv1' } },
      },
    ],
  });

const reset = () => json({ status: 'reset complete' });

const routes: Record<string, Partial<Record<string, Handler>>> = {
  GET: {
    '/3/cached/emotes/global': globalBttvEmotes,
    '/health': health,
    '/helix/channels': channels,
    '/helix/chat/emotes/global': globalTwitchEmotes,
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
    '/v3/emote-sets/global': sevenTvGlobalEmotes,
  },
  POST: {
    '/mock/reset': reset,
    '/oauth2/token': refreshedToken,
  },
};

const paramRoutes: Record<string, Array<[RegExp, Handler]>> = {
  GET: [
    [/^\/3\/cached\/users\/twitch\/[^/]+$/, channelBttvEmotes],
    [/^\/v1\/room\/id\/[^/]+$/, ffzRoom],
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
  ); // NOSONAR - dev-only request logging.

  const handler = getHandler(request.method, url.pathname);

  if (!handler) {
    console.warn(`[404] Route not found: ${request.method} ${url.pathname}`); // NOSONAR - dev-only request logging.
    return json({ error: 'Not found' }, { status: 404 });
  }

  return handler(request, url);
};

// todo - add chat support
// todo - add dummy stream support

Bun.serve({
  port: PORT,
  fetch: request => {
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
║  Server running at: http://localhost:${PORT}                    ║
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
║                                                                 ║
║  Debug endpoints:                                               ║
║  - GET  /mock/streams              List all mock streams        ║
║  - GET  /mock/categories           List all mock categories     ║
║  - POST /mock/reset                Reset mock state             ║
╚══════════════════════════════════════════════════════════════════╝
`);
