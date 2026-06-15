import { isAuthCallbackUrl } from '@app/navigators/authLinking';
import {
  parseTwitchUrl,
  twitchLinkToAppPath,
} from '@app/navigators/twitchLinking';
import { logger } from '@app/utils/logger';

/**
 * Expo Router native intent handler.
 *
 * Runs for every incoming deep link — the custom `foam://` scheme and the
 * verified `https://*.twitch.tv` app/universal links declared in
 * app.config.ts — before the router resolves a route. It rewrites public
 * Twitch web URLs to the matching in-app route so a shared `twitch.tv/...`
 * link opens the correct screen.
 *
 * Notes:
 * - This runs outside the React tree, so it has no access to auth state.
 *   Auth callback URLs carry a token and need an async exchange, so they are
 *   passed through untouched and handled in RouterEffects.
 * - Anything we don't recognise is returned unchanged. `foam://` links that
 *   already match a route (e.g. foam://streams/live-stream/xqc) fall through
 *   here and are resolved by the router as normal.
 * - Must never throw: a crash here would break cold-start deep links.
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

    const appPath = twitchLinkToAppPath(parseTwitchUrl(path));
    if (appPath) {
      logger.main.info('[native-intent] routing Twitch link', {
        from: path,
        to: appPath,
      });
      return appPath;
    }

    return path;
  } catch (error) {
    logger.main.warn('[native-intent] failed to redirect path', {
      path,
      error,
    });
    return path;
  }
}
