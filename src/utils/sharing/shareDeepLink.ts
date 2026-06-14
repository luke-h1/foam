import { Share } from 'react-native';
import { logger } from '@app/utils/logger';

/**
 * App URL scheme defined in app.config.ts.
 */
const APP_SCHEME = 'foam';

/**
 * Public https fallback for users who don't have the app installed.
 * Matches the intentFilters/associated domains in app.config.ts.
 */
const PUBLIC_TWITCH_BASE = 'https://www.twitch.tv';

export type ShareableEntity =
  | { kind: 'streamer'; login: string; displayName?: string }
  | { kind: 'liveStream'; login: string; displayName?: string }
  | { kind: 'clip'; id: string; title?: string }
  | { kind: 'category'; id: string; name?: string };

interface BuiltShareLink {
  appUrl: string;
  webUrl: string;
  title: string;
  message: string;
}

/**
 * Build the deep-link payload for a given shareable entity.
 * Returns both an app-scheme URL (foam://) and a public https fallback.
 */
function buildShareLink(entity: ShareableEntity): BuiltShareLink {
  switch (entity.kind) {
    case 'streamer': {
      const login = encodeURIComponent(entity.login);
      const name = entity.displayName ?? entity.login;
      return {
        appUrl: `${APP_SCHEME}://streams/streamer-profile/${login}`,
        webUrl: `${PUBLIC_TWITCH_BASE}/${login}/about`,
        title: `${name} on Foam`,
        message: `Check out ${name} on Foam`,
      };
    }
    case 'liveStream': {
      const login = encodeURIComponent(entity.login);
      const name = entity.displayName ?? entity.login;
      return {
        appUrl: `${APP_SCHEME}://streams/live-stream/${login}`,
        webUrl: `${PUBLIC_TWITCH_BASE}/${login}`,
        title: `${name} is live`,
        message: `Watch ${name} live on Foam`,
      };
    }
    case 'clip': {
      const id = encodeURIComponent(entity.id);
      return {
        appUrl: `${APP_SCHEME}://streams/clip/${id}`,
        webUrl: `https://clips.twitch.tv/${id}`,
        title: entity.title ?? 'Foam clip',
        message: entity.title
          ? `Watch "${entity.title}" on Foam`
          : 'Watch this clip on Foam',
      };
    }
    case 'category': {
      const id = encodeURIComponent(entity.id);
      const name = entity.name ?? 'this category';
      return {
        appUrl: `${APP_SCHEME}://category/${id}`,
        webUrl: `${PUBLIC_TWITCH_BASE}/directory/category/${id}`,
        title: `${name} on Foam`,
        message: `Check out ${name} on Foam`,
      };
    }
  }
}

/**
 * Open the native share sheet for the given entity.
 * Shares the Foam deep link (foam://) so recipients who have the app open the
 * content directly in Foam, with the public Twitch URL appended as a fallback
 * for anyone who doesn't have Foam installed.
 */
export async function shareDeepLink(entity: ShareableEntity): Promise<void> {
  const link = buildShareLink(entity);
  const message = `${link.message}\n${link.appUrl}\n\nNo Foam? ${link.webUrl}`;

  try {
    await Share.share(
      {
        title: link.title,
        message,
        url: link.appUrl,
      },
      {
        subject: link.title,
        dialogTitle: link.title,
      },
    );
  } catch (error) {
    logger.main.error('[shareDeepLink] failed to share', error);
  }
}
