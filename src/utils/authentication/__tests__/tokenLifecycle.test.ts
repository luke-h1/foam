import { TokenResponse } from 'expo-auth-session';

import { twitchService } from '@app/services/twitch-service';

import {
  addExpirationTimestamp,
  isTokenExpired,
  normaliseTwitchToken,
  refreshStoredUserToken,
  shouldProactivelyRefreshUserToken,
  type TwitchToken,
} from '../tokenLifecycle';

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    getRefreshToken: jest.fn(),
  },
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    auth: {
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

const getRefreshToken = jest.mocked(twitchService.getRefreshToken);
const NOW = 1_000_000;

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  getRefreshToken.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
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
  it('treats a token without expiresAt as not expired', () => {
    expect(isTokenExpired(token({ expiresAt: undefined }))).toBe(false);
  });

  it('is expired once inside the 60s buffer', () => {
    expect(isTokenExpired(token({ expiresAt: NOW + 30_000 }))).toBe(true);
  });

  it('is not expired well before the buffer', () => {
    expect(isTokenExpired(token({ expiresAt: NOW + 120_000 }))).toBe(false);
  });
});

describe('addExpirationTimestamp', () => {
  it('derives expiresAt from expiresIn seconds', () => {
    expect(addExpirationTimestamp(token({ expiresIn: 3600 }))).toEqual(
      token({ expiresIn: 3600, expiresAt: NOW + 3600 * 1000 }),
    );
  });
});

describe('shouldProactivelyRefreshUserToken', () => {
  it('returns false without a refresh token', () => {
    expect(
      shouldProactivelyRefreshUserToken(
        token({ expiresAt: NOW + 1000, refreshToken: undefined }),
      ),
    ).toBe(false);
  });

  it('returns false without expiresAt', () => {
    expect(
      shouldProactivelyRefreshUserToken(
        token({ refreshToken: 'r', expiresAt: undefined }),
      ),
    ).toBe(false);
  });

  it('returns true within the 5 minute refresh window', () => {
    expect(
      shouldProactivelyRefreshUserToken(
        token({ refreshToken: 'r', expiresAt: NOW + 60_000 }),
      ),
    ).toBe(true);
  });

  it('returns false outside the refresh window', () => {
    expect(
      shouldProactivelyRefreshUserToken(
        token({ refreshToken: 'r', expiresAt: NOW + 10 * 60_000 }),
      ),
    ).toBe(false);
  });
});

describe('normaliseTwitchToken', () => {
  it('returns an already-normalised token unchanged', () => {
    const existing = token({ expiresAt: NOW + 1000 });
    expect(normaliseTwitchToken(existing)).toBe(existing);
  });

  it('adds expiresAt to a raw token response', () => {
    const raw = new TokenResponse({
      accessToken: 'access',
      expiresIn: 3600,
      tokenType: 'bearer',
      refreshToken: 'refresh',
    });

    expect(normaliseTwitchToken(raw)).toEqual({
      accessToken: 'access',
      expiresIn: 3600,
      tokenType: 'bearer',
      refreshToken: 'refresh',
      expiresAt: NOW + 3600 * 1000,
    });
  });

  it('returns null when expiresIn is missing', () => {
    const raw = new TokenResponse({
      accessToken: 'access',
      tokenType: 'bearer',
    });

    expect(normaliseTwitchToken(raw)).toBeNull();
  });
});

describe('refreshStoredUserToken', () => {
  it('returns null without a refresh token', async () => {
    expect(
      await refreshStoredUserToken(token({ refreshToken: undefined }), 'test'),
    ).toBeNull();
    expect(getRefreshToken).not.toHaveBeenCalled();
  });

  it('returns a refreshed token, keeping the prior refresh token when none is returned', async () => {
    getRefreshToken.mockResolvedValue({
      access_token: 'new-access',
      expires_in: 7200,
      token_type: 'bearer',
      refresh_token: '',
      scope: '',
    });

    expect(
      await refreshStoredUserToken(token({ refreshToken: 'old-refresh' }), 'x'),
    ).toEqual({
      accessToken: 'new-access',
      expiresIn: 7200,
      tokenType: 'bearer',
      refreshToken: 'old-refresh',
      expiresAt: NOW + 7200 * 1000,
    });
  });

  it('returns null when the refresh exchange throws', async () => {
    getRefreshToken.mockRejectedValue(new Error('boom'));

    expect(
      await refreshStoredUserToken(token({ refreshToken: 'r' }), 'x'),
    ).toBeNull();
  });
});
