import { isAuthCallbackUrl } from '@app/context/authLinking';

const TWITCH_HOSTS = new Set(['twitch.tv', 'www.twitch.tv', 'm.twitch.tv']);

const RESERVED_TWITCH_PATHS = new Set([
  'directory',
  'downloads',
  'drops',
  'following',
  'friends',
  'inventory',
  'jobs',
  'moderator',
  'p',
  'popout',
  'search',
  'settings',
  'store',
  'subscriptions',
  'turbo',
  'videos',
  'wallet',
]);

function mapTwitchPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 2 && segments[0] === 'videos') {
    return `/streams/vod/${segments[1]}`;
  }

  const login = segments[0]?.toLowerCase();

  const isChannelPath =
    segments.length === 1 &&
    login !== undefined &&
    /^[a-z0-9_]{3,25}$/.test(login) &&
    !RESERVED_TWITCH_PATHS.has(login);

  if (isChannelPath) {
    return `/streams/live-stream/${login}`;
  }

  return '/';
}

/**
 * Maps the Android twitch.tv intent filters (app.config.ts) onto app routes.
 * Must never throw: a throw here breaks every cold-start deep link.
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

    const url = new URL(path);

    if (!TWITCH_HOSTS.has(url.hostname)) {
      return path;
    }

    return mapTwitchPath(url.pathname);
  } catch {
    return path;
  }
}
