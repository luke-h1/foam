// Twitch's player embed expects a VOD start offset as `XhYmZs`, not seconds.
function formatTwitchTimeParam(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${hours}h${minutes}m${seconds}s`;
}

export function buildRawTwitchPlayerUrl(options: {
  autoplay: boolean;
  channel: string;
  muted: boolean;
  parent: string;
  /**
   * VOD resume offset in seconds; only applied when `video` is set.
   */
  timeSeconds?: number;
  video?: string;
}): string {
  const params = new URLSearchParams();

  if (options.video) {
    params.set('video', options.video);
    // Resume a VOD at its last known position so a WebView reload (memory
    // pressure / process termination) doesn't restart it from 0:00.
    if (options.timeSeconds && options.timeSeconds > 0) {
      params.set('time', formatTwitchTimeParam(options.timeSeconds));
    }
  } else {
    params.set('channel', options.channel);
  }

  if (!options.autoplay) {
    params.set('autoplay', 'false');
  }
  params.set('muted', options.muted ? 'true' : 'false');
  params.set('parent', options.parent);

  return `https://player.twitch.tv/?${params.toString()}`;
}
