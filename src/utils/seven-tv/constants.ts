/**
 * 7TV `EmoteFlagsZeroWidth` (bit 8) on the emote itself: the author marks the
 * emote as an overlay for the emote before it.
 */
export const SEVEN_TV_ZERO_WIDTH_FLAG = 256;

/**
 * 7TV `ActiveEmoteFlagZeroWidth` (bit 0) on an emote set entry: the set turns
 * zero-width on for this emote, whatever the emote itself says.
 */
export const SEVEN_TV_ACTIVE_ZERO_WIDTH_FLAG = 1;

/**
 * The file format order to pick at one scale. A static image prefers the
 * smaller AVIF file. An animated image prefers WebP, which every platform
 * decodes.
 */
export const SEVEN_TV_STATIC_FORMATS = ['avif', 'webp'] as const;

export const SEVEN_TV_ANIMATED_FORMATS = ['webp', 'gif', 'avif'] as const;
