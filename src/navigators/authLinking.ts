import { logger } from '@app/utils/logger';
import { TokenResponse } from 'expo-auth-session';
import type { AuthSessionResult, TokenType } from 'expo-auth-session';

const log = (msg: string, data?: object) => {
  logger.auth.info(`[Auth] ${msg}`, data ?? {});
};

export type LoginWithTwitchFn = (
  response: AuthSessionResult | null,
) => Promise<null | undefined>;

const AUTH_CALLBACK_PATTERNS = [
  /^foam:\/\/auth/,
  /^foam:\/\/login\/callback/,
  /^https?:\/\/([^/]+\.)?foam-app\.com\/auth/,
  /^https?:\/\/([^/]+\.)?foam-app\.com\/login\/callback/,
];

const DEFAULT_EXPIRES_IN_SEC = 3600;

export interface ParsedAuthCallback {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

export function isAuthCallbackUrl(url: string | null): boolean {
  if (!url || typeof url !== 'string') {
    log('isAuthCallbackUrl: false (no url)', { url: String(url) });
    return false;
  }
  const trimmed = url.trim();
  const result = AUTH_CALLBACK_PATTERNS.some(pattern => pattern.test(trimmed));
  log('isAuthCallbackUrl', {
    result,
    urlSafe: trimmed.slice(0, 80) + (trimmed.length > 80 ? '…' : ''),
  });
  return result;
}

export function parseAuthCallbackUrl(
  url: string | null,
): ParsedAuthCallback | null {
  log('parseAuthCallbackUrl: in', { urlSafe: url?.slice(0, 80) ?? null });
  if (!url || !isAuthCallbackUrl(url)) {
    log('parseAuthCallbackUrl: out null (no url or not callback)');
    return null;
  }
  try {
    const parsed = new URL(url);
    const hash = parsed.hash?.replace(/^#/, '') || '';
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (!accessToken) {
      log('parseAuthCallbackUrl: out null (no access_token in hash)', {
        hashLength: hash.length,
        hasHash: !!parsed.hash,
      });
      return null;
    }
    const expiresIn = parseInt(params.get('expires_in') ?? '', 10);
    log('parseAuthCallbackUrl: out parsed', {
      accessTokenPreview: `${accessToken.slice(0, 8)}…`,
      expiresIn: Number.isFinite(expiresIn)
        ? expiresIn
        : DEFAULT_EXPIRES_IN_SEC,
      tokenType: params.get('token_type') ?? 'bearer',
    });
    return {
      accessToken,
      expiresIn: Number.isFinite(expiresIn)
        ? expiresIn
        : DEFAULT_EXPIRES_IN_SEC,
      tokenType: params.get('token_type') ?? 'bearer',
    };
  } catch (e) {
    log('parseAuthCallbackUrl: out null (throw)', { err: String(e) });
    return null;
  }
}

export function buildAuthSessionResultFromCallback(
  parsed: ParsedAuthCallback,
  originalUrl: string,
): AuthSessionResult {
  return {
    type: 'success',
    url: originalUrl,
    params: {},
    errorCode: null,
    error: undefined,
    authentication: new TokenResponse({
      accessToken: parsed.accessToken,
      expiresIn: parsed.expiresIn,
      tokenType: parsed.tokenType as TokenType,
      issuedAt: Math.floor(Date.now() / 1000),
    }),
  };
}

export async function completeAuthWithCallbackUrl(
  url: string,
  loginWithTwitch: LoginWithTwitchFn,
): Promise<boolean> {
  log('completeAuthWithCallbackUrl: in', { urlSafe: url.slice(0, 100) });
  const isCallback = isAuthCallbackUrl(url);
  if (!isCallback) {
    log('completeAuthWithCallbackUrl: out false (not callback url)');
    return false;
  }
  const parsed = parseAuthCallbackUrl(url);
  if (!parsed) {
    log('completeAuthWithCallbackUrl: out false (parse failed)');
    return false;
  }
  log('completeAuthWithCallbackUrl: calling loginWithTwitch');
  const result = buildAuthSessionResultFromCallback(parsed, url);
  await loginWithTwitch(result);
  log('completeAuthWithCallbackUrl: out true (loginWithTwitch done)');
  return true;
}

export async function completeAuthWithUrlContainingToken(
  url: string,
  loginWithTwitch: LoginWithTwitchFn,
): Promise<boolean> {
  log('completeAuthWithUrlContainingToken: in', {
    urlSafe: url?.slice(0, 100),
    hasAccessToken: url?.includes('access_token'),
  });
  if (!url || !url.includes('access_token')) {
    log(
      'completeAuthWithUrlContainingToken: out false (no url or no access_token)',
    );
    return false;
  }
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) {
    log('completeAuthWithUrlContainingToken: out false (no #)');
    return false;
  }
  const hash = url.slice(hashIndex);
  if (!hash.includes('access_token=')) {
    log(
      'completeAuthWithUrlContainingToken: out false (no access_token in hash)',
    );
    return false;
  }
  const callbackUrl = `foam://auth${hash}`;
  log('completeAuthWithUrlContainingToken: built callbackUrl, delegating', {
    callbackUrlSafe: `${callbackUrl.slice(0, 80)}…`,
  });
  return completeAuthWithCallbackUrl(callbackUrl, loginWithTwitch);
}
