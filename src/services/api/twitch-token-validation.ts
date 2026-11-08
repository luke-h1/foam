import { fetch } from 'expo/fetch';

import { parseJsonOnWorklet } from '@app/lib/off-thread-json/parseJsonOnWorklet';

import { isE2EMode } from './env';

export interface TwitchTokenValidation {
  /**
   * The client the token was issued for. Helix rejects a Client-Id header
   * that does not match it, and proxy tokens may not match
   * EXPO_PUBLIC_TWITCH_CLIENT_ID.
   */
  clientId?: string;
  expiresInSeconds?: unknown;
}

/**
 * The one call to Twitch's validate endpoint. Returns null for a token
 * Twitch rejects, and throws on a network failure. E2E runs have no real
 * Twitch token, so every token is valid there.
 * @see https://dev.twitch.tv/docs/authentication/validate-tokens#validating-tokens
 */
export async function validateTwitchToken(
  token: string,
): Promise<TwitchTokenValidation | null> {
  if (isE2EMode) {
    return {};
  }

  const res = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status !== 200) {
    return null;
  }

  const body = await parseJsonOnWorklet<{
    client_id?: string;
    expires_in?: unknown;
  } | null>(await res.text()).catch(() => null);

  return { clientId: body?.client_id, expiresInSeconds: body?.expires_in };
}
