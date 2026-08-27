import type { FetchResponse } from 'expo/build/winter/fetch/FetchResponse';
import { fetch } from 'expo/fetch';

import { ApiError, createApiClient } from '@app/services/api/Client';
import { logger } from '@app/utils/logger';

type MockRequestInit = {
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
  signal: AbortSignal;
};

type MockResponseBody = {
  data?: string[];
  error?: string;
  message?: string;
  ok?: boolean;
  status?: number;
};

/**
 * `expo/fetch` already carries a jest.fn() mock at __mocks__/expo/fetch.ts,
 * so this file only needs a typed handle onto it.
 */
const mockFetch = jest.mocked(fetch);

const apiWarnSpy = jest.spyOn(logger.api, 'warn').mockImplementation(() => {});
const apiErrorSpy = jest
  .spyOn(logger.api, 'error')
  .mockImplementation(() => {});
const ffzWarnSpy = jest.spyOn(logger.ffz, 'warn').mockImplementation(() => {});
const ffzErrorSpy = jest
  .spyOn(logger.ffz, 'error')
  .mockImplementation(() => {});

function jsonResponse(body: MockResponseBody, status = 200): FetchResponse {
  const response = {
    ok: status < 400,
    status,
    statusText: status < 400 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
  // SAFETY: Client.ts only reads .ok/.status/.text() off the response, so this plain object stands in for FetchResponse.
  return response as FetchResponse;
}

function firstRequestInit(): MockRequestInit {
  const call = mockFetch.mock.calls[0];
  if (call === undefined) {
    throw new Error('fetch was not called');
  }
  const [, init] = call;
  if (init === undefined) {
    throw new Error('fetch was called without an init');
  }
  // SAFETY: createApiClient always calls fetch with an init shaped exactly like MockRequestInit; FetchRequestInit's wider types cover callers this client never exercises.
  return init as MockRequestInit;
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

    expect(firstRequestInit().headers).toEqual({
      Accept: 'application/json',
    });
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
    // SAFETY: Client.ts never calls .json() on a 204, only .ok/.status/.text().
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: () => Promise.reject(new Error('no body')),
      text: () => Promise.resolve(''),
    } as FetchResponse);
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

    expect(firstRequestInit().headers.Authorization).toBe('Bearer anon-token');
  });

  test('requiresAuth re-arms the gate after removeAuthToken', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const client = createApiClient({
      baseURL: 'https://api.test/helix',
      requiresAuth: true,
    });
    client.setAuthToken('user-token');
    client.removeAuthToken();

    const pending = client.get('/channels/followed');
    await Promise.resolve();
    expect(mockFetch).not.toHaveBeenCalled();

    client.setAuthToken('anon-token');
    await expect(pending).resolves.toEqual({ data: [] });

    expect(firstRequestInit().headers.Authorization).toBe('Bearer anon-token');
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

    expect(firstRequestInit().headers.Authorization).toBe('Bearer explicit');
  });

  test('logs 4xx failures at warn level, not error', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 404));
    const client = createApiClient({ baseURL: 'https://api.test/helix' });

    await expect(client.get('/users')).rejects.toBeInstanceOf(ApiError);

    expect(apiWarnSpy).toHaveBeenCalledTimes(1);
    expect(apiErrorSpy).not.toHaveBeenCalled();
  });

  test('does not log the benign FFZ "No such room" 404', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { status: 404, error: 'Not Found', message: 'No such room' },
        404,
      ),
    );
    const client = createApiClient({
      baseURL: 'https://api.frankerfacez.com/v1',
      logPrefix: 'ffz',
    });

    await expect(client.get('/room/id/999')).rejects.toBeInstanceOf(ApiError);

    expect(ffzWarnSpy).not.toHaveBeenCalled();
    expect(ffzErrorSpy).not.toHaveBeenCalled();
  });

  test('still logs other FFZ 404s that are not "No such room"', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: 'Not Found' }, 404),
    );
    const client = createApiClient({
      baseURL: 'https://api.frankerfacez.com/v1',
      logPrefix: 'ffz',
    });

    await expect(client.get('/set/global')).rejects.toBeInstanceOf(ApiError);

    expect(ffzWarnSpy).toHaveBeenCalledTimes(1);
  });

  test('logs 5xx failures at error level', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 500));
    const client = createApiClient({ baseURL: 'https://api.test/helix' });

    await expect(client.get('/users')).rejects.toBeInstanceOf(ApiError);

    expect(apiErrorSpy).toHaveBeenCalledTimes(1);
    expect(apiWarnSpy).not.toHaveBeenCalled();
  });

  test('replays the request once when onUnauthorized recovers a 401', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ message: 'mismatch' }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: ['ok'] }));
    const onUnauthorized = jest.fn().mockResolvedValue(true);
    const client = createApiClient({
      baseURL: 'https://api.test/helix',
      onUnauthorized,
    });

    const result = await client.get('/users');

    expect(result).toEqual({ data: ['ok'] });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledWith(
      JSON.stringify({ message: 'mismatch' }),
    );
    expect(apiWarnSpy).not.toHaveBeenCalled();
  });

  test('surfaces the 401 when onUnauthorized declines to recover', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 401));
    const onUnauthorized = jest.fn().mockResolvedValue(false);
    const client = createApiClient({
      baseURL: 'https://api.test/helix',
      onUnauthorized,
    });

    await expect(client.get('/users')).rejects.toBeInstanceOf(ApiError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test('replays at most once even if the retry also 401s', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ message: 'mismatch' }, 401))
      .mockResolvedValueOnce(jsonResponse({ message: 'mismatch' }, 401));
    const onUnauthorized = jest.fn().mockResolvedValue(true);
    const client = createApiClient({
      baseURL: 'https://api.test/helix',
      onUnauthorized,
    });

    await expect(client.get('/users')).rejects.toBeInstanceOf(ApiError);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
