import { parseJsonOnWorklet } from '@app/lib/offThreadJson/parseJsonOnWorklet';
import { logger } from '@app/utils/logger';

/**
 * Returns the client ID a token was issued for. Helix rejects a mismatched
 * Client-Id header, and proxy tokens may not match
 * EXPO_PUBLIC_TWITCH_CLIENT_ID, so the header re-syncs from this.
 * @see https://dev.twitch.tv/docs/authentication/validate-tokens#validating-tokens
 */
export async function fetchTwitchTokenClientId(
  token: string,
): Promise<string | undefined> {
  try {
    const res = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status !== 200) {
      return undefined;
    }
    const body = await parseJsonOnWorklet<{ client_id?: string } | null>(
      await res.text(),
    ).catch(() => null);
    return body?.client_id;
  } catch (error) {
    logger.auth.warn('failed to fetch twitch token client id', {
      name: 'auth_warn',
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}
