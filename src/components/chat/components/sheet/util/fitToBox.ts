/**
 * Twitch sends no size for some emotes; 28 is the size of a 1x emote.
 */
export const UNKNOWN_EMOTE_SIZE = 28;

interface AssetSize {
  height?: number;
  width?: number;
}

export function getAssetAspectRatio({ height, width }: AssetSize): number {
  return (width || UNKNOWN_EMOTE_SIZE) / (height || UNKNOWN_EMOTE_SIZE);
}

export function fitToBox(
  box: number,
  aspectRatio: number,
): { height: number; width: number } {
  return aspectRatio >= 1
    ? { height: Math.round(box / aspectRatio), width: box }
    : { height: box, width: Math.round(box * aspectRatio) };
}
