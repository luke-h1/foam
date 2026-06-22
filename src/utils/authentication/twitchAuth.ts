import {
  type AuthSessionResult,
  TokenResponse,
  type TokenType,
} from 'expo-auth-session';
import { logger } from '../logger';

const DEFAULT_EXPIRES_IN_SEC = 3600;

export interface ParsedTwitchAuthToken {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  refreshToken?: string;
}

function getNormalizedExpiresIn(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_EXPIRES_IN_SEC;
}

function parseTokenFields(
  getValue: (key: string) => string | null | undefined,
): ParsedTwitchAuthToken | null {
  const accessToken = getValue('access_token') ?? getValue('accessToken');

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    expiresIn: getNormalizedExpiresIn(
      getValue('expires_in') ?? getValue('expiresIn'),
    ),
    tokenType: getValue('token_type') ?? getValue('tokenType') ?? 'bearer',
    refreshToken:
      getValue('refresh_token') ?? getValue('refreshToken') ?? undefined,
  };
}

function getHashParams(parsedUrl: URL): URLSearchParams {
  return new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
}

function getFirstParamValue(
  params: URLSearchParams,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = params.get(key);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function parseRefreshTokenFromUrl(url: string | null | undefined) {
  if (!url) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(url);
    return (
      getFirstParamValue(
        parsedUrl.searchParams,
        'refresh_token',
        'refreshToken',
      ) ??
      getFirstParamValue(
        getHashParams(parsedUrl),
        'refresh_token',
        'refreshToken',
      )
    );
  } catch {
    return undefined;
  }
}

export function parseTwitchAuthTokenFromUrl(
  url: string | null | undefined,
): ParsedTwitchAuthToken | null {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    const fromQuery = parseTokenFields(key => parsedUrl.searchParams.get(key));
    if (fromQuery) {
      return fromQuery;
    }

    const hashParams = getHashParams(parsedUrl);
    return parseTokenFields(key => hashParams.get(key));
  } catch {
    logger.auth.warn('Failed to parse Twitch auth token from URL');
    return null;
  }
}

export function parseTwitchAuthTokenFromResponse(
  response: AuthSessionResult | null,
): ParsedTwitchAuthToken | null {
  if (!response || response.type !== 'success') {
    return null;
  }

  if (response.authentication?.accessToken) {
    const refreshToken =
      (typeof response.params.refresh_token === 'string'
        ? response.params.refresh_token
        : undefined) ??
      (typeof response.params.refreshToken === 'string'
        ? response.params.refreshToken
        : undefined) ??
      parseRefreshTokenFromUrl(response.url);

    return {
      accessToken: response.authentication.accessToken,
      expiresIn: getNormalizedExpiresIn(response.authentication.expiresIn),
      tokenType: response.authentication.tokenType,
      refreshToken,
    };
  }

  const fromParams = parseTokenFields(key => {
    const value = response.params[key];
    return typeof value === 'string' ? value : null;
  });

  if (fromParams) {
    return fromParams;
  }

  return parseTwitchAuthTokenFromUrl(response.url);
}

export function buildAuthSessionResultFromToken(
  token: ParsedTwitchAuthToken,
  url: string,
): AuthSessionResult {
  return {
    type: 'success',
    url,
    params: token.refreshToken ? { refresh_token: token.refreshToken } : {},
    errorCode: null,
    error: undefined,
    authentication: new TokenResponse({
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
      tokenType: token.tokenType as TokenType,
      issuedAt: Math.floor(Date.now() / 1000),
    }),
  };
}
