import type { TokenResponse } from 'expo-auth-session';

import { twitchService } from '@app/services/twitch-service';
import { logger } from '@app/utils/logger';

/**
 * Buffer time in seconds before token expiration to consider it expired.
 * This allows proactive refresh before actual expiration.
 */
const TOKEN_EXPIRATION_BUFFER = 60; // 1 minute buffer
const USER_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export interface TwitchToken {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  refreshToken?: string;
  /**
   * Unix timestamp in milliseconds when the token expires.
   */
  expiresAt?: number;
}

/**
 * Check if a token is expired or will expire soon, using the locally-recorded
 * `expiresAt`. Implicit-grant tokens may lack `expiresAt`; callers should treat
 * Twitch's validate endpoint as the source of truth rather than this check.
 */
export const isTokenExpired = (token: TwitchToken): boolean => {
  const { expiresAt } = token;

  if (!expiresAt) {
    logger.auth.warn(
      'Token missing expiresAt timestamp, cannot verify expiration',
    );
    return false;
  }

  const now = Date.now();
  const bufferTime = TOKEN_EXPIRATION_BUFFER * 1000;

  return now >= expiresAt - bufferTime;
};

/**
 * Calculate the expiration timestamp from `expiresIn` and add it to a token.
 */
export const addExpirationTimestamp = (
  token: Omit<TwitchToken, 'expiresAt'>,
): TwitchToken => {
  const now = Date.now();
  return {
    ...token,
    expiresAt: now + token.expiresIn * 1000,
  };
};

const isTwitchToken = (
  token: TokenResponse | TwitchToken,
): token is TwitchToken => 'expiresAt' in token;

export const shouldProactivelyRefreshUserToken = (
  token: TwitchToken,
  now = Date.now(),
): boolean => {
  if (!token.refreshToken || !token.expiresAt) {
    return false;
  }

  return now >= token.expiresAt - USER_TOKEN_REFRESH_BUFFER_MS;
};

export const normaliseTwitchToken = (
  token: TokenResponse | TwitchToken,
): TwitchToken | null => {
  if (isTwitchToken(token)) {
    return token;
  }

  if (token.expiresIn === undefined) {
    logger.auth.warn('Token missing expiresIn, cannot proceed with auth');
    return null;
  }

  const maybeStoredToken = token as Partial<TwitchToken>;
  return addExpirationTimestamp({
    accessToken: token.accessToken,
    expiresIn: token.expiresIn,
    tokenType: token.tokenType,
    refreshToken: maybeStoredToken.refreshToken,
  });
};

export const getFallbackAnonToken = (): TwitchToken => ({
  accessToken: '',
  expiresIn: 3600,
  tokenType: 'bearer',
  expiresAt: Date.now() + 60 * 60 * 1000,
});

/**
 * Exchange a stored refresh token for a fresh user token. Returns null when the
 * token has no refresh token or the exchange fails (network, or Twitch
 * rejection) — callers decide whether to validate, retry, or fall back to anon.
 */
export async function refreshStoredUserToken(
  token: TwitchToken,
  reason: string,
): Promise<TwitchToken | null> {
  if (!token.refreshToken) {
    logger.auth.info('User token cannot be refreshed without refresh token', {
      reason,
    });
    return null;
  }

  try {
    const refreshed = await twitchService.getRefreshToken(token.refreshToken);
    const refreshedToken = addExpirationTimestamp({
      accessToken: refreshed.access_token,
      expiresIn: refreshed.expires_in,
      tokenType: refreshed.token_type,
      refreshToken: refreshed.refresh_token || token.refreshToken,
    });

    logger.auth.info('Refreshed stored user token', {
      reason,
      expiresIn: refreshedToken.expiresIn,
    });

    return refreshedToken;
  } catch (error) {
    logger.auth.warn('Failed to refresh stored user token', {
      reason,
      error,
    });
    return null;
  }
}
