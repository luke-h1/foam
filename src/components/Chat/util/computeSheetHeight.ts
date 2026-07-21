/**
 * Fixed content-derived detent for the emote/badge preview sheets: the flex:1
 * content has no intrinsic height, so a content detent balloons to full height
 * and clips the title under the notch. Cap at 82% of the screen.
 */
export function computeSheetHeight(
  screenHeight: number,
  rowCount: number,
  actionCount: number,
  base: number,
): number {
  return Math.min(
    Math.round(screenHeight * 0.82),
    Math.max(420, base + rowCount * 56 + actionCount * 58 + 200),
  );
}
