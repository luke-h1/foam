/**
 * Twitch preview URLs are `{width}x{height}` templates. The compact row
 * renders at 132x88, so a 320x180 variant covers high-density screens; the
 * media layout spans the screen width, where 860x484 covers 2x. The live
 * stream screen requests the same media-size poster so navigating from a
 * media card is a cache hit.
 */
export const MEDIA_THUMBNAIL_SIZE = { width: '860', height: '484' } as const;

export const COMPACT_THUMBNAIL_SIZE = {
  width: '320',
  height: '180',
} as const;
