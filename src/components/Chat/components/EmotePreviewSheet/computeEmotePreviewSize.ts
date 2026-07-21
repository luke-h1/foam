const MIN_EMOTE_SIZE = 36;

/**
 * Fits the emote's native dimensions into [MIN_EMOTE_SIZE, maxEmoteSize]
 * preserving aspect ratio.
 */
export function computeEmotePreviewSize(
  originalWidth: number,
  originalHeight: number,
  maxEmoteSize: number,
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (targetWidth > maxEmoteSize || targetHeight > maxEmoteSize) {
    if (aspectRatio > 1) {
      targetWidth = maxEmoteSize;
      targetHeight = maxEmoteSize / aspectRatio;
    } else {
      targetHeight = maxEmoteSize;
      targetWidth = maxEmoteSize * aspectRatio;
    }
  }

  if (targetWidth < MIN_EMOTE_SIZE && targetHeight < MIN_EMOTE_SIZE) {
    if (aspectRatio > 1) {
      targetWidth = MIN_EMOTE_SIZE;
      targetHeight = MIN_EMOTE_SIZE / aspectRatio;
    } else {
      targetHeight = MIN_EMOTE_SIZE;
      targetWidth = MIN_EMOTE_SIZE * aspectRatio;
    }
  }

  return {
    height: Math.round(targetHeight),
    width: Math.round(targetWidth),
  };
}
