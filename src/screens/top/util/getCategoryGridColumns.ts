/**
 * Box art reads best near a phone column's width. Wider windows (iPhone Duo
 * inner display, future iPad) add columns at about this width instead of
 * stretching the art. 140 keeps every current phone at the 3-column baseline.
 */
const TARGET_COLUMN_WIDTH = 140;

const MIN_COLUMNS = 3;

/**
 * Columns for the top-categories grid, from the window width that remains
 * after the horizontal safe-area insets.
 */
export function getCategoryGridColumns({
  horizontalInsets,
  windowWidth,
}: {
  horizontalInsets: number;
  windowWidth: number;
}): number {
  return Math.max(
    MIN_COLUMNS,
    Math.floor((windowWidth - horizontalInsets) / TARGET_COLUMN_WIDTH),
  );
}
