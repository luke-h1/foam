export function buildTwitchClipPlayerUrl(options: {
  autoplay: boolean;
  clip: string;
  muted: boolean;
  parent: string;
  preload?: 'auto' | 'metadata' | 'none';
}): string {
  const params = new URLSearchParams({
    clip: options.clip,
    parent: options.parent,
    autoplay: options.autoplay ? 'true' : 'false',
    muted: options.muted ? 'true' : 'false',
    preload: options.preload ?? 'metadata',
  });

  return `https://clips.twitch.tv/embed?${params.toString()}`;
}
