/**
 * The live stream screen requests the same media-size poster as the card, so
 * opening a stream from a card is a cache hit.
 */
export const MEDIA_THUMBNAIL_SIZE = { width: 860, height: 484 } as const;

export const COMPACT_THUMBNAIL_SIZE = { width: 320, height: 180 } as const;

export const COMPACT_THUMBNAIL_WIDTH = 144;
