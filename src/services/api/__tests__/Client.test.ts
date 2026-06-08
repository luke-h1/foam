import Client from '@app/services/api/Client';
import Axios, { type AxiosInstance, type CustomParamsSerializer } from 'axios';

const mockRequestUse = jest.fn(() => 1);
const mockRequestEject = jest.fn();
const mockResponseUse = jest.fn(() => 1);
const mockResponseEject = jest.fn();
const mockAxiosRequest = jest.fn() as jest.Mock & {
  defaults: {
    baseURL?: string;
    headers: {
      common: Record<string, unknown>;
    };
  };
  interceptors: {
    request: {
      eject: jest.Mock;
      use: jest.Mock;
    };
    response: {
      eject: jest.Mock;
      use: jest.Mock;
    };
  };
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(options => {
      mockAxiosRequest.defaults = {
        baseURL: options?.baseURL,
        headers: {
          common: {
            ...(options?.headers ?? {}),
          },
        },
      };
      mockAxiosRequest.interceptors = {
        request: {
          eject: mockRequestEject,
          use: mockRequestUse,
        },
        response: {
          eject: mockResponseEject,
          use: mockResponseUse,
        },
      };

      return mockAxiosRequest as unknown as AxiosInstance;
    }),
  },
  isAxiosError: (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    error.isAxiosError === true,
}));

const mockAxiosCreate = jest.mocked(Axios.create);

function getParamsSerializer(): CustomParamsSerializer {
  const serializer = mockAxiosCreate.mock.calls[0]?.[0]?.paramsSerializer;
  if (typeof serializer !== 'function') {
    throw new Error('Expected paramsSerializer to be a function');
  }

  return serializer;
}

describe('Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosRequest.mockReset();
  });

  test('uses axios with base URL, default headers, and serialized params', async () => {
    mockAxiosRequest.mockResolvedValueOnce({
      data: { data: ['stream'] },
      headers: {},
      status: 200,
      statusText: 'OK',
    });
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

    const createConfig = mockAxiosCreate.mock.calls[0]?.[0];
    if (createConfig === undefined) {
      throw new Error('Expected axios instance to be created');
    }

    expect({
      baseURL: createConfig.baseURL,
      headers: createConfig.headers,
      serializedParams: getParamsSerializer()({
        first: 20,
        id: ['one', 'two'],
      }),
    }).toEqual({
      baseURL: 'https://api.test/helix',
      headers: {
        'Client-ID': 'client-id',
      },
      serializedParams: 'first=20&id=one%2Ctwo',
    });
    expect(mockAxiosRequest.mock.calls).toEqual([
      [
        {
          headers: {
            'Client-ID': 'client-id',
          },
          method: 'GET',
          params: {
            first: 20,
            id: ['one', 'two'],
          },
          url: '/streams',
        },
      ],
    ]);
  });

  test('passes JSON bodies through axios and applies the current auth token', async () => {
    mockAxiosRequest.mockResolvedValueOnce({
      data: { ok: true },
      headers: {},
      status: 200,
      statusText: 'OK',
    });
    const client = new Client({ baseURL: 'https://api.test/helix' });
    client.setAuthToken('user-token');

    await expect(
      client.post('/eventsub/subscriptions', { type: 'channel.poll.begin' }),
    ).resolves.toEqual({ ok: true });

    expect(mockAxiosRequest.mock.calls).toEqual([
      [
        {
          data: {
            type: 'channel.poll.begin',
          },
          headers: {
            Authorization: 'Bearer user-token',
          },
          method: 'POST',
          url: '/eventsub/subscriptions',
        },
      ],
    ]);
  });

  test('returns axios error response data for HTTP failures', async () => {
    mockAxiosRequest.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: { message: 'Forbidden' },
        status: 403,
      },
    });
    const client = new Client({ baseURL: 'https://api.test/helix' });

    await expect(
      client.post('/eventsub/subscriptions', {
        type: 'channel.prediction.lock',
      }),
    ).resolves.toEqual({ message: 'Forbidden' });
  });
});
