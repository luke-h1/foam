/**
 * Parse Twitch URLs for deeplink handling.
 * Supports: twitch.tv/:channel, www.twitch.tv/:channel, m.twitch.tv/:channel,
 * and /:channel/video/:videoId or /videos/:videoId.
 */
export type TwitchLink =
  | { type: 'channel'; channelLogin: string }
  | { type: 'video'; channelLogin: string; videoId: string }
  | { type: 'vod'; videoId: string }
  | null;

const TWITCH_HOSTS = ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv'];

export function parseTwitchUrl(url: string | null): TwitchLink {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (!TWITCH_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) {
      return null;
    }
    const path = parsed.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (path.length >= 1) {
      const first = path[0];
      if (first === 'videos' && path[1]) {
        return { type: 'vod', videoId: path[1] };
      }
      if (first === 'video' && path[1]) {
        return { type: 'vod', videoId: path[1] };
      }
      const channelLogin = first;
      if (path[1] === 'video' && path[2]) {
        return {
          type: 'video',
          channelLogin: channelLogin as string,
          videoId: path[2],
        };
      }
      return { type: 'channel', channelLogin: channelLogin as string };
    }
  } catch {
    // ignore
  }
  return null;
}
