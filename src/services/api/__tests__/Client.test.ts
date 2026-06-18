import { ApiError, createApiClient } from '@app/services/api/Client';
import { logger } from '@app/utils/logger';

const mockFetch = jest.fn();

jest.mock('expo/fetch', () => ({
  fetch: (...args: unknown[]) => mockFetch(...args) as Promise<unknown>,
}));

jest.mock('@app/utils/logger', () => {
  const categories: Record<string, unknown> = {};
  return {
    logger: new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          categories[prop] ??= {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          };
          return categories[prop];
        },
      },
    ),
  };
});

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    statusText: status < 400 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

describe('createApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('builds the URL from base URL and serialized params with default headers', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: ['stream'] }));
    const client = createApiClient({
      baseURL: 'https://api.test/helix',
      headers: {
        'Client-ID': 'client-id',
      },
    });

    await expect(
      client.get('/streams', {
        params: {
          first: 20,
          id: ['one', 'two'],
        },
      }),
    ).resolves.toEqual({ data: ['stream'] });

    expect(mockFetch.mock.calls).toEqual([
      [
        'https://api.test/helix/streams?first=20&id=one%2Ctwo',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Client-ID': 'client-id',
          },
          body: undefined,
          signal: expect.any(AbortSignal),
        },
      ],
    ]);
  });

  test('passes JSON bodies through fetch and applies the current auth token', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createApiClient({ baseURL: 'https://api.test/helix' });
    client.setAuthToken('user-token');

    await expect(
      client.post('/eventsub/subscriptions', { type: 'channel.poll.begin' }),
    ).resolves.toEqual({ ok: true });

    expect(mockFetch.mock.calls).toEqual([
      [
        'https://api.test/helix/eventsub/subscriptions',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer user-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'channel.poll.begin' }),
          signal: expect.any(AbortSignal),
        },
      ],
    ]);
  });

  test('removeAuthToken stops sending the Authorization header', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const client = createApiClient({ baseURL: 'https://api.test/helix' });
    client.setAuthToken('user-token');
    client.removeAuthToken();

    await client.get('/streams');

    const [, requestInit] = mockFetch.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(requestInit.headers).toEqual({ Accept: 'application/json' });
  });

  test('throws ApiError with the response body for HTTP failures', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: 'Forbidden' }, 403),
    );
    const client = createApiClient({ baseURL: 'https://api.test/helix' });

    await expect(
      client.post('/eventsub/subscriptions', {
        type: 'channel.prediction.lock',
      }),
    ).rejects.toEqual(
      new ApiError(JSON.stringify({ message: 'Forbidden' }), 403),
    );
  });

  test('resolves undefined for 204 responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: () => Promise.reject(new Error('no body')),
      text: () => Promise.resolve(''),
    });
    const client = createApiClient({ baseURL: 'https://api.test/helix' });

    await expect(
      client.delete('/eventsub/subscriptions'),
    ).resolves.toBeUndefined();
  });

  test('requiresAuth defers the request until a token is set, then sends it', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const client = createApiClient({
      baseURL: 'https://api.test/helix',
      requiresAuth: true,
    });

    const pending = client.get('/streams');
    await Promise.resolve();
    expect(mockFetch).not.toHaveBeenCalled();

    client.setAuthToken('anon-token');
    await expect(pending).resolves.toEqual({ data: [] });

    const [, requestInit] = mockFetch.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(requestInit.headers.Authorization).toBe('Bearer anon-token');
  });

  test('requiresAuth does not defer when an explicit Authorization header is set', async () => {
    jest.useFakeTimers();
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const client = createApiClient({
      baseURL: 'https://api.test/helix',
      requiresAuth: true,
    });

    await expect(
      client.get('/users', { headers: { Authorization: 'Bearer explicit' } }),
    ).resolves.toEqual({ data: [] });

    const [, requestInit] = mockFetch.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(requestInit.headers.Authorization).toBe('Bearer explicit');
  });

  test('logs 4xx failures at warn level, not error', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 404));
    const client = createApiClient({ baseURL: 'https://api.test/helix' });

    await expect(client.get('/users')).rejects.toBeInstanceOf(ApiError);

    expect(jest.mocked(logger.api.warn)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(logger.api.error)).not.toHaveBeenCalled();
  });

  test('logs 5xx failures at error level', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 500));
    const client = createApiClient({ baseURL: 'https://api.test/helix' });

    await expect(client.get('/users')).rejects.toBeInstanceOf(ApiError);

    expect(jest.mocked(logger.api.error)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(logger.api.warn)).not.toHaveBeenCalled();
  });
});
