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
    logger.auth.info('[AUTHDBG] parseTwitchAuthTokenFromUrl no url');
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    const fromQuery = parseTokenFields(key => parsedUrl.searchParams.get(key));
    if (fromQuery) {
      logger.auth.info('[AUTHDBG] parseTwitchAuthTokenFromUrl query token', {
        url,
        accessTokenPreview: `${fromQuery.accessToken.slice(0, 8)}...`,
        expiresIn: fromQuery.expiresIn,
      });
      return fromQuery;
    }

    const hashParams = getHashParams(parsedUrl);
    const fromHash = parseTokenFields(key => hashParams.get(key));
    logger.auth.info(
      '[AUTHDBG] parseTwitchAuthTokenFromUrl hash parse result',
      {
        url,
        matched: !!fromHash,
        accessTokenPreview: fromHash
          ? `${fromHash.accessToken.slice(0, 8)}...`
          : null,
      },
    );
    return fromHash;
  } catch {
    logger.auth.error('[AUTHDBG] parseTwitchAuthTokenFromUrl failed', { url });
    return null;
  }
}

export function parseTwitchAuthTokenFromResponse(
  response: AuthSessionResult | null,
): ParsedTwitchAuthToken | null {
  if (!response || response.type !== 'success') {
    logger.auth.info('[AUTHDBG] parseTwitchAuthTokenFromResponse ignored', {
      responseType: response?.type ?? null,
    });
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

    logger.auth.info(
      '[AUTHDBG] parseTwitchAuthTokenFromResponse authentication token',
      {
        responseUrl: response.url ?? null,
        accessTokenPreview: `${response.authentication.accessToken.slice(0, 8)}...`,
        expiresIn: getNormalizedExpiresIn(response.authentication.expiresIn),
        hasRefreshToken: !!refreshToken,
      },
    );
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
    logger.auth.info(
      '[AUTHDBG] parseTwitchAuthTokenFromResponse params token',
      {
        responseUrl: response.url ?? null,
        responseParams: response.params,
        accessTokenPreview: `${fromParams.accessToken.slice(0, 8)}...`,
      },
    );
    return fromParams;
  }

  logger.auth.info(
    '[AUTHDBG] parseTwitchAuthTokenFromResponse falling back to url',
    {
      responseUrl: response.url ?? null,
      responseParams: response.params,
    },
  );
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
