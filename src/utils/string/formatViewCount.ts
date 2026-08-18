let viewCountFormatter: Intl.NumberFormat | null = null;

/**
 * Built on first format - ICU formatter construction at module scope sat on
 * the boot path via LiveStreamCard.
 */
function getViewCountFormatter() {
  viewCountFormatter ??= new Intl.NumberFormat('en-US');
  return viewCountFormatter;
}

/**
 * Format viewer count for display.
 * Missing and invalid counts render as '0'.
 */
export function formatViewCount(count: number | undefined | null): string {
  if (count == null || !Number.isFinite(count) || count < 0) {
    return '0';
  }
  return getViewCountFormatter().format(Math.floor(count));
}

/**
 * Compact viewer count for tight layouts: 950, 9.5K, 93K, 1.2M.
 * Hand-rolled because Hermes does not support Intl compact notation.
 */
export function formatViewCountCompact(
  count: number | undefined | null,
): string {
  if (count == null || !Number.isFinite(count) || count < 0) {
    return '0';
  }
  if (count >= 1_000_000) {
    const millions = Math.floor((count / 1_000_000) * 10) / 10;
    return `${millions % 1 === 0 || millions >= 10 ? Math.floor(millions) : millions}M`;
  }
  if (count >= 1_000) {
    const thousands = Math.floor((count / 1_000) * 10) / 10;
    return `${thousands % 1 === 0 || thousands >= 10 ? Math.floor(thousands) : thousands}K`;
  }
  return String(Math.floor(count));
}
