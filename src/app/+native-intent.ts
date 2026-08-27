import { isAuthCallbackUrl } from '@app/navigators/authLinking';
import { logger } from '@app/utils/logger';

/**
 * Expo Router native intent handler. Auth callback URLs must reach RouterEffects unchanged for the token exchange; every other deep link resolves as normal. Must never throw - that breaks cold-start deep links.
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
