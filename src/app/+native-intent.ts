import { isAuthCallbackUrl } from '@app/navigators/authLinking';
import { logger } from '@app/utils/logger';

/**
 * Expo Router native intent handler.
 *
 * Only auth callback URLs need explicit handling here: they carry a token and
 * must reach RouterEffects unchanged for the async exchange. This runs outside
 * the React tree, so it has no access to auth state.
 *
 * All other deep links (`foam://` routes, Twitch universal links, etc.) pass
 * through and are resolved by the router as normal.
 *
 * Must never throw: a crash here would break cold-start deep links.
 *
 * @see https://docs.expo.dev/router/advanced/native-intent/
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    if (isAuthCallbackUrl(path)) {
      return path;
    }
  } catch (error) {
    logger.main.warn('[native-intent] failed to inspect path', {
      path,
      error,
    });
  }

  return path;
}
