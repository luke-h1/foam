import { logger } from '@app/utils/logger';
import type { AuthSessionResult } from 'expo-auth-session';
import {
  buildAuthSessionResultFromToken,
  parseTwitchAuthTokenFromUrl,
} from '@app/utils/authentication/twitchAuth';

const log = (msg: string, data?: object) => {
  logger.auth.info(`[Auth] ${msg}`, data ?? {});
};

export type LoginWithTwitchFn = (
  response: AuthSessionResult | null,
) => Promise<null | undefined>;

const AUTH_CALLBACK_PATTERNS = [
  /^foam:\/\//,
  /^https?:\/\/[^/]+\/auth(?:[?#/]|$)/,
  /^https?:\/\/([^/]+\.)?foam-app\.com\/auth/,
  /^https?:\/\/([^/]+\.)?foam-app\.com\/proxy/,
];

export function isAuthCallbackUrl(url: string | null): boolean {
  if (!url || typeof url !== 'string') {
    log('isAuthCallbackUrl: false (no url)', { url: String(url) });
    return false;
  }
  const trimmed = url.trim();
  const looksLikeCallback = AUTH_CALLBACK_PATTERNS.some(pattern =>
    pattern.test(trimmed),
  );
  const hasToken = !!parseTwitchAuthTokenFromUrl(trimmed);
  const result = looksLikeCallback && hasToken;
  log('isAuthCallbackUrl', {
    result,
    hasToken,
    urlSafe: trimmed.slice(0, 80) + (trimmed.length > 80 ? '…' : ''),
  });
  return result;
}

export function parseAuthCallbackUrl(url: string | null) {
  log('parseAuthCallbackUrl: in', { urlSafe: url?.slice(0, 80) ?? null });
  if (!url || !isAuthCallbackUrl(url)) {
    log('parseAuthCallbackUrl: out null (no url or not callback)');
    return null;
  }
  const parsed = parseTwitchAuthTokenFromUrl(url);
  if (!parsed) {
    log('parseAuthCallbackUrl: out null (no access token)');
    return null;
  }
  log('parseAuthCallbackUrl: out parsed', {
    accessTokenPreview: `${parsed.accessToken.slice(0, 8)}…`,
    expiresIn: parsed.expiresIn,
    tokenType: parsed.tokenType,
  });
  return parsed;
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
  const result = buildAuthSessionResultFromToken(parsed, url);
  await loginWithTwitch(result);
  log('completeAuthWithCallbackUrl: out true (loginWithTwitch done)');
  return true;
}
