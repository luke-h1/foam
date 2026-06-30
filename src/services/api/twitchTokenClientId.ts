import { parseJsonOnWorklet } from '@app/lib/offThreadJson';
import { logger } from '@app/utils/logger';

/**
 * Validates a Twitch OAuth token and returns the client ID it was issued for.
 *
 * Helix rejects requests whose Client-Id header does not match the client the
 * token was issued for. Anonymous tokens from the auth proxy may be issued
 * under a different client ID than EXPO_PUBLIC_TWITCH_CLIENT_ID, so we read the
 * token's own client ID from the validate endpoint to re-sync the header.
 *
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
