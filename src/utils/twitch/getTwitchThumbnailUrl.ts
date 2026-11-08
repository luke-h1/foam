interface TwitchThumbnailSize {
  width: number;
  height: number;
}

/**
 * Fills a Twitch image template. Live previews and box art use `{width}`;
 * VOD thumbnails use `%{width}`.
 */
export function getTwitchThumbnailUrl(
  template: string,
  { width, height }: TwitchThumbnailSize,
): string {
  return template
    .replace(/%?\{width\}/, String(width))
    .replace(/%?\{height\}/, String(height));
}
