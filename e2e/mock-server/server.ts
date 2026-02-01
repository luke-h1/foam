/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/**
 * Mock Server for E2E Testing
 *
 * This server mocks the Twitch Helix API and other services for E2E testing
 * with Maestro. It provides deterministic responses for consistent test results.
 *
 * Usage:
 *   bun run e2e:mock-server
 *
 * The server runs on port 3001 by default (configurable via MOCK_SERVER_PORT env var)
 */

import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';

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

const app = express();
const PORT = process.env.MOCK_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /helix/streams - Get top streams or stream by user_login
app.get('/helix/streams', (req: Request, res: Response) => {
  const { user_login, game_id, after } = req.query;

  if (user_login) {
    const stream = getStreamByLogin(user_login as string);
    res.json({ data: stream ? [stream] : [] });
    return;
  }

  if (game_id) {
    const categoryStreams = mockStreams.filter(s => s.game_id === game_id);
    res.json({
      data: categoryStreams,
      pagination: {},
    });
    return;
  }

  const response = getTopStreamsResponse(after as string | undefined);
  res.json(response);
});

app.get('/helix/streams/followed', (req: Request, res: Response) => {
  const { user_id } = req.query;
  const response = getFollowedStreams(user_id as string);
  res.json(response);
});

app.get('/helix/games/top', (req: Request, res: Response) => {
  const { after } = req.query;
  const response = getTopCategoriesResponse(after as string | undefined);
  res.json(response);
});

app.get('/helix/games', (req: Request, res: Response) => {
  const { id } = req.query;
  const category = getCategoryById(id as string);
  res.json({ data: category ? [category] : [] });
});

app.get('/helix/search/categories', (req: Request, res: Response) => {
  const { query } = req.query;
  const response = searchCategories(query as string);
  res.json(response);
});

app.get('/helix/search/channels', (req: Request, res: Response) => {
  const { query } = req.query;
  const channels = searchChannels(query as string);
  res.json({ data: channels });
});

app.get('/helix/users', (req: Request, res: Response) => {
  const { login, id } = req.query;

  if (login) {
    const user = getUserByLogin(login as string);
    res.json({ data: user ? [user] : [] });
    return;
  }

  if (id) {
    const user = getUserById(id as string);
    res.json({ data: user ? [user] : [] });
    return;
  }

  const testUser = getUserByLogin('testuser');
  res.json({ data: testUser ? [testUser] : [] });
});

app.get('/helix/channels', (req: Request, res: Response) => {
  const { broadcaster_id } = req.query;
  const user = getUserById(broadcaster_id as string);

  if (user) {
    res.json([
      {
        broadcasterId: user.id,
        broadcasterLogin: user.login,
        broadcasterName: user.display_name,
      },
    ]);
    return;
  }

  res.json([]);
});

app.get('/helix/chat/emotes/global', (_req: Request, res: Response) => {
  res.json({
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
});

// GET /token - Get anonymous token
app.get('/token', (_req: Request, res: Response) => {
  res.json({
    data: {
      access_token: 'mock_access_token_for_e2e_testing',
      expires_in: 3600,
      token_type: 'bearer',
    },
  });
});

app.post('/oauth2/token', (_req: Request, res: Response) => {
  res.json({
    access_token: 'mock_refreshed_access_token',
    refresh_token: 'mock_refresh_token',
    expires_in: 3600,
    scope: 'user:read:email',
    token_type: 'bearer',
  });
});

app.get('/oauth2/validate', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    res.json({
      client_id: 'mock_client_id',
      scopes: null,
      expires_in: 3600,
    });
    return;
  }
  res.status(401).json({ message: 'Unauthorized' });
});

// BetterTTV global emotes
app.get('/3/cached/emotes/global', (_req: Request, res: Response) => {
  res.json([
    { id: 'bttv1', code: 'OMEGALUL', imageType: 'png', animated: false },
    { id: 'bttv2', code: 'monkaS', imageType: 'png', animated: false },
  ]);
});

// BetterTTV channel emotes
app.get('/3/cached/users/twitch/:userId', (_req: Request, res: Response) => {
  res.json({
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
});

// FrankerFaceZ emotes
app.get('/v1/room/id/:userId', (_req: Request, res: Response) => {
  res.json({
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
});

// 7TV emotes
app.get('/v3/emote-sets/global', (_req: Request, res: Response) => {
  res.json({
    emotes: [
      {
        id: '7tv1',
        name: 'Sadge',
        data: { host: { url: 'https://cdn.7tv.app/emote/7tv1' } },
      },
    ],
  });
});

app.get('/mock/streams', (_req: Request, res: Response) => {
  res.json(mockStreams);
});

app.get('/mock/categories', (_req: Request, res: Response) => {
  res.json(mockCategories);
});

// POST /mock/reset - Reset any stateful mock data (currently stateless)
app.post('/mock/reset', (_req: Request, res: Response) => {
  // Reset any stateful mock data here if needed
  res.json({ status: 'reset complete' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  console.warn(`[404] Route not found: ${_req.method} ${_req.path}`);
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    Foam E2E Mock Server                          ║
╠══════════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                     ║
║                                                                  ║
║  Available endpoints:                                            ║
║  - GET  /health                    Health check                  ║
║  - GET  /helix/streams             Top streams                   ║
║  - GET  /helix/streams/followed    Followed streams              ║
║  - GET  /helix/games/top           Top categories                ║
║  - GET  /helix/games               Category by ID                ║
║  - GET  /helix/search/categories   Search categories             ║
║  - GET  /helix/search/channels     Search channels               ║
║  - GET  /helix/users               User info                     ║
║  - GET  /helix/channels            Channel info                  ║
║  - GET  /token                     Auth token                    ║
║                                                                  ║
║  Debug endpoints:                                                ║
║  - GET  /mock/streams              List all mock streams         ║
║  - GET  /mock/categories           List all mock categories      ║
║  - POST /mock/reset                Reset mock state              ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
