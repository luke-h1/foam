const TWITCH_CLIP_REGEX =
  /https?:\/\/(?:www\.)?clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/i;

const TWITCH_CHANNEL_CLIP_REGEX =
  /https?:\/\/(?:www\.)?twitch\.tv\/(?:[a-zA-Z0-9_]+\/)?clip\/([a-zA-Z0-9_-]+)/i;

export function getTwitchClipIdFromUrl(url: string): string | null {
  const twitchClipMatch = url.match(TWITCH_CLIP_REGEX);
  const twitchChannelClipMatch = url.match(TWITCH_CHANNEL_CLIP_REGEX);

  return twitchClipMatch?.[1] ?? twitchChannelClipMatch?.[1] ?? null;
}
