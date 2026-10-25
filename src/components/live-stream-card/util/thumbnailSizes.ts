/**
 * Twitch preview URLs are `{width}x{height}` templates; the live stream screen
 * requests the same media-size poster so navigating from a card is a cache hit.
 */
export const MEDIA_THUMBNAIL_SIZE = { width: '860', height: '484' } as const;

export const COMPACT_THUMBNAIL_SIZE = {
  width: '320',
  height: '180',
} as const;
