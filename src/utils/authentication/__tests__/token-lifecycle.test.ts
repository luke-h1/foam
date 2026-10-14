import type { FetchResponse } from 'expo/build/winter/fetch/FetchResponse';
import { fetch } from 'expo/fetch';
import { TokenResponse } from 'expo-auth-session';

import {
  addExpirationTimestamp,
  isTokenExpired,
  normaliseTwitchToken,
  refreshStoredUserToken,
  shouldProactivelyRefreshUserToken,
  type TwitchToken,
} from '../token-lifecycle';

const mockFetch = jest.mocked(fetch);

function proxyResponse<TData>(data: TData | null, error?: string) {
  const response = {
    ok: data !== null,
    status: data === null ? 400 : 200,
    text: () => Promise.resolve(JSON.stringify({ data, error })),
  };

  // SAFETY: getRefreshToken only reads text() off the auth proxy response.
  return response as FetchResponse;
}

const NOW = 1_000_000;

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
  mockFetch.mockReset();
});

function token(overrides: Partial<TwitchToken> = {}): TwitchToken {
  return {
    accessToken: 'access',
    expiresIn: 3600,
    tokenType: 'bearer',
    ...overrides,
  };
}

describe('isTokenExpired', () => {
  test('treats a token without expiresAt as not expired', () => {
    expect(isTokenExpired(token({ expiresAt: undefined }))).toBe(false);
  });

  test('is expired once inside the 60s buffer', () => {
    expect(isTokenExpired(token({ expiresAt: NOW + 30_000 }))).toBe(true);
  });

  test('is not expired well before the buffer', () => {
    expect(isTokenExpired(token({ expiresAt: NOW + 120_000 }))).toBe(false);
  });
});

describe('addExpirationTimestamp', () => {
  test('derives expiresAt from expiresIn seconds', () => {
    expect(addExpirationTimestamp(token({ expiresIn: 3600 }))).toEqual(
      token({ expiresIn: 3600, expiresAt: NOW + 3600 * 1000 }),
    );
  });
});

describe('shouldProactivelyRefreshUserToken', () => {
  test('returns false without a refresh token', () => {
    expect(
      shouldProactivelyRefreshUserToken(
        token({ expiresAt: NOW + 1000, refreshToken: undefined }),
      ),
    ).toBe(false);
  });

  test('returns false without expiresAt', () => {
    expect(
      shouldProactivelyRefreshUserToken(
        token({ refreshToken: 'r', expiresAt: undefined }),
      ),
    ).toBe(false);
  });

  test('returns true within the 5 minute refresh window', () => {
    expect(
      shouldProactivelyRefreshUserToken(
        token({ refreshToken: 'r', expiresAt: NOW + 60_000 }),
      ),
    ).toBe(true);
  });

  test('returns false outside the refresh window', () => {
    expect(
      shouldProactivelyRefreshUserToken(
        token({ refreshToken: 'r', expiresAt: NOW + 10 * 60_000 }),
      ),
    ).toBe(false);
  });
});

describe('normaliseTwitchToken', () => {
  test('returns an already-normalised token unchanged', () => {
    const existing = token({ expiresAt: NOW + 1000 });
    expect(normaliseTwitchToken(existing)).toBe(existing);
  });

  test('adds expiresAt to a raw token response', () => {
    const raw = new TokenResponse({
      accessToken: 'access',
      expiresIn: 3600,
      tokenType: 'bearer',
      refreshToken: 'refresh',
    });

    expect(normaliseTwitchToken(raw)).toEqual<TwitchToken>({
      accessToken: 'access',
      expiresIn: 3600,
      tokenType: 'bearer',
      refreshToken: 'refresh',
      expiresAt: NOW + 3600 * 1000,
    });
  });

  test('returns null when expiresIn is missing', () => {
    const raw = new TokenResponse({
      accessToken: 'access',
      tokenType: 'bearer',
    });

    expect(normaliseTwitchToken(raw)).toBeNull();
  });
});

describe('refreshStoredUserToken', () => {
  test('returns null without a refresh token', async () => {
    expect(
      await refreshStoredUserToken(token({ refreshToken: undefined }), 'test'),
    ).toBeNull();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('returns a refreshed token, keeping the prior refresh token when none is returned', async () => {
    mockFetch.mockResolvedValue(
      proxyResponse({
        access_token: 'new-access',
        expires_in: 7200,
        token_type: 'bearer',
        refresh_token: '',
        scope: '',
      }),
    );

    expect(
      await refreshStoredUserToken(token({ refreshToken: 'old-refresh' }), 'x'),
    ).toEqual<TwitchToken>({
      accessToken: 'new-access',
      expiresIn: 7200,
      tokenType: 'bearer',
      refreshToken: 'old-refresh',
      expiresAt: NOW + 7200 * 1000,
    });

    expect(mockFetch.mock.calls.map(([url]) => String(url))).toEqual([
      'https://auth-proxy.test/refresh-token?token=old-refresh&app=foam-app',
    ]);
  });

  test('returns null when the auth proxy rejects the refresh token', async () => {
    mockFetch.mockResolvedValue(proxyResponse(null, 'invalid refresh token'));

    expect(
      await refreshStoredUserToken(token({ refreshToken: 'r' }), 'x'),
    ).toBeNull();
  });

  test('returns null when the refresh request fails', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    expect(
      await refreshStoredUserToken(token({ refreshToken: 'r' }), 'x'),
    ).toBeNull();
  });
});
