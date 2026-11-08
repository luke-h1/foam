/**
 * Twitch box art is 3:4. The tile fills its grid column, so only the source
 * size is fixed: about 2x the widest column on a phone.
 */
export const IMAGE_ASPECT_RATIO = 3 / 4;

/**
 * The category screen hero asks for this size too, so opening a category from
 * a tile is a cache hit.
 */
export const BOX_ART_SOURCE_SIZE = { width: 288, height: 384 } as const;

export const TITLE_MAX_LINES = 2;
