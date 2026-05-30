import Client from '@app/services/api/Client';
import { fetch } from 'expo/fetch';

const mockFetch = jest.mocked(fetch);

function createJsonResponse({
  body,
  status = 200,
  statusText = 'OK',
}: {
  body: unknown;
  status?: number;
  statusText?: string;
}) {
  return {
    headers: new Headers({ 'Content-Type': 'application/json' }),
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    url: 'https://api.test/response',
  } as unknown as Awaited<ReturnType<typeof fetch>>;
}

describe('Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses expo fetch with base URL, default headers, and serialized params', async () => {
    mockFetch.mockResolvedValueOnce(
      createJsonResponse({ body: { data: ['stream'] } }),
    );
    const client = new Client({
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

    const [url, init] = mockFetch.mock.calls[0] ?? [];
    if (!init) {
      throw new Error('Expected fetch init');
    }
    const headers = init.headers as Headers;

    expect(url).toBe('https://api.test/helix/streams?first=20&id=one%2Ctwo');
    expect(init.method).toBe('GET');
    expect(headers.get('Client-ID')).toBe('client-id');
  });

  test('serializes JSON bodies and applies the current auth token', async () => {
    mockFetch.mockResolvedValueOnce(createJsonResponse({ body: { ok: true } }));
    const client = new Client({ baseURL: 'https://api.test/helix' });
    client.setAuthToken('user-token');

    await expect(
      client.post('/eventsub/subscriptions', { type: 'channel.poll.begin' }),
    ).resolves.toEqual({ ok: true });

    const [, init] = mockFetch.mock.calls[0] ?? [];
    if (!init) {
      throw new Error('Expected fetch init');
    }
    const headers = init.headers as Headers;

    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ type: 'channel.poll.begin' }));
    expect(headers.get('Authorization')).toBe('Bearer user-token');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  test('throws HTTP failures instead of returning error bodies as success data', async () => {
    mockFetch.mockResolvedValueOnce(
      createJsonResponse({
        body: { message: 'Forbidden' },
        status: 403,
        statusText: 'Forbidden',
      }),
    );
    const client = new Client({ baseURL: 'https://api.test/helix' });

    await expect(
      client.post('/eventsub/subscriptions', {
        type: 'channel.prediction.lock',
      }),
    ).rejects.toMatchObject({
      message: '/eventsub/subscriptions_POST request failed',
      name: 'FetchHttpError',
      response: {
        data: { message: 'Forbidden' },
      },
      status: 403,
    });
  });
});
