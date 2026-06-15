/**
 * Parse Twitch URLs for deeplink handling.
 * Supports: twitch.tv/:channel, www.twitch.tv/:channel, m.twitch.tv/:channel,
 * /:channel/about, /:channel/video/:videoId, /videos/:videoId, and Twitch clip
 * URLs.
 */
export type TwitchLink =
  | { type: 'channel'; channelLogin: string }
  | { type: 'profile'; channelLogin: string }
  | { type: 'clip'; channelLogin?: string; clipId: string }
  | { type: 'video'; channelLogin: string; videoId: string }
  | { type: 'vod'; videoId: string }
  | null;

const TWITCH_HOSTS = ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv'];
const TWITCH_CLIP_HOSTS = ['clips.twitch.tv', 'www.clips.twitch.tv'];

/**
 * Twitch web paths whose first segment is a reserved route rather than a
 * channel login (e.g. twitch.tv/directory/category/...). We can't resolve the
 * name slug these carry to an in-app screen from the URL alone, so they are
 * not treated as channels.
 */
const RESERVED_FIRST_SEGMENTS = new Set(['directory']);

export function parseTwitchUrl(url: string | null): TwitchLink {
  if (!url || typeof url !== 'string') {
    return null;
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.replace(/^\/+/, '').split('/').filter(Boolean);

    if (
      TWITCH_CLIP_HOSTS.some(h => host === h || host.endsWith(`.${h}`)) &&
      path[0]
    ) {
      return { type: 'clip', clipId: path[0] };
    }

    if (!TWITCH_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) {
      return null;
    }

    if (path.length >= 1) {
      const first = path[0];
      if (first === 'videos' && path[1]) {
        return { type: 'vod', videoId: path[1] };
      }
      if (first === 'video' && path[1]) {
        return { type: 'vod', videoId: path[1] };
      }
      if (first === 'clip' && path[1]) {
        return { type: 'clip', clipId: path[1] };
      }
      if (RESERVED_FIRST_SEGMENTS.has(first as string)) {
        return null;
      }
      const channelLogin = first;
      if (path[1] === 'clip' && path[2]) {
        return {
          type: 'clip',
          channelLogin: channelLogin as string,
          clipId: path[2],
        };
      }
      if (path[1] === 'video' && path[2]) {
        return {
          type: 'video',
          channelLogin: channelLogin as string,
          videoId: path[2],
        };
      }
      if (path[1] === 'about') {
        return { type: 'profile', channelLogin: channelLogin as string };
      }
      return { type: 'channel', channelLogin: channelLogin as string };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Map a parsed Twitch link to the in-app route that should display it.
 * Returns null when the link can't be resolved to a screen (e.g. a bare VOD,
 * which has no dedicated player route).
 */
export function twitchLinkToAppPath(link: TwitchLink): string | null {
  if (!link) {
    return null;
  }
  switch (link.type) {
    case 'channel':
    case 'video':
      return `/streams/live-stream/${link.channelLogin}`;
    case 'profile':
      return `/streams/streamer-profile/${link.channelLogin}`;
    case 'clip':
      return `/streams/clip/${link.clipId}`;
    case 'vod':
      return null;
  }
}
