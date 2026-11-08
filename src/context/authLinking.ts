import { Platform } from 'react-native';

import type {
  AuthContextState,
  LoginWithTwitchResult,
} from '@app/context/auth-context-value';
import { authProxyBaseUrl } from '@app/services/api/env';
import {
  buildAuthSessionResultFromToken,
  parseTwitchAuthTokenFromUrl,
} from '@app/utils/authentication/twitchAuth';
import { logger, type LogMetadata } from '@app/utils/logger';

const log = (msg: string, data?: LogMetadata) => {
  logger.auth.info(`[Auth] ${msg}`, data ?? {});
};

function getWebAuthCallbackUrl(): string {
  const origin = globalThis.location?.origin;

  if (origin) {
    return `${origin}/auth`;
  }

  return 'https://foam-app.com/auth';
}

export const AUTH_REDIRECT_URI =
  Platform.OS === 'web'
    ? getWebAuthCallbackUrl()
    : new URL(`${authProxyBaseUrl}/proxy`).toString();

export const AUTH_APP_RETURN_URL =
  Platform.OS === 'web' ? getWebAuthCallbackUrl() : 'foam://auth';

const AUTH_CALLBACK_PATTERNS = [
  /^foam(-[a-z0-9]+)?:\/\//,
  /^https?:\/\/([^/]+\.)?foam-app\.com\/auth/,
  /^https?:\/\/([^/]+\.)?foam-app\.com\/proxy/,
  ...(Platform.OS === 'web' ? [/^https?:\/\/[^/]+\/auth(?:[?#/]|$)/] : []),
];

function parseAuthCallbackUrl(url: string | null) {
  const trimmed = url?.trim();

  if (!trimmed) {
    log('parseAuthCallbackUrl: null (no url)');
    return null;
  }

  const urlSafe = trimmed.slice(0, 80) + (trimmed.length > 80 ? '…' : '');

  const looksLikeCallback = AUTH_CALLBACK_PATTERNS.some(pattern =>
    pattern.test(trimmed),
  );

  const parsed = looksLikeCallback
    ? parseTwitchAuthTokenFromUrl(trimmed)
    : null;

  log('parseAuthCallbackUrl', {
    looksLikeCallback,
    hasToken: !!parsed,
    urlSafe,
  });

  return parsed;
}

export function isAuthCallbackUrl(url: string | null): boolean {
  return parseAuthCallbackUrl(url) !== null;
}

const NOT_A_CALLBACK: LoginWithTwitchResult = { ok: false, reason: 'error' };

export async function completeAuthWithCallbackUrl(
  url: string,
  loginWithTwitch: AuthContextState['loginWithTwitch'],
): Promise<LoginWithTwitchResult> {
  const parsed = parseAuthCallbackUrl(url);

  if (!parsed) {
    return NOT_A_CALLBACK;
  }

  const result = await loginWithTwitch(
    buildAuthSessionResultFromToken(parsed, url),
  );

  log('completeAuthWithCallbackUrl: done', { ok: result.ok });
  return result;
}
