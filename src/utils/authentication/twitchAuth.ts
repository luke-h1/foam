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
  };
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

    const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
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
    logger.auth.info(
      '[AUTHDBG] parseTwitchAuthTokenFromResponse authentication token',
      {
        responseUrl: response.url ?? null,
        accessTokenPreview: `${response.authentication.accessToken.slice(0, 8)}...`,
        expiresIn: getNormalizedExpiresIn(response.authentication.expiresIn),
      },
    );
    return {
      accessToken: response.authentication.accessToken,
      expiresIn: getNormalizedExpiresIn(response.authentication.expiresIn),
      tokenType: response.authentication.tokenType,
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
    params: {},
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
