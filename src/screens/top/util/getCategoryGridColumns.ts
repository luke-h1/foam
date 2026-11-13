const TARGET_COLUMN_WIDTH = 140;

const MIN_COLUMNS = 3;

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
