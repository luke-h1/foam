const viewCountFormatter = new Intl.NumberFormat('en-US');

/**
 * Format viewer count for display.
 * Safely handles string/number from API and invalid values.
 */
export function formatViewCount(
  count: number | string | undefined | null,
): string {
  const n = typeof count === 'string' ? parseInt(count, 10) : Number(count);
  if (!Number.isFinite(n) || n < 0) {
    return '0';
  }
  return viewCountFormatter.format(Math.floor(n));
}

/**
 * Compact viewer count for tight layouts: 950, 9.5K, 93K, 1.2M.
 * Hand-rolled because Hermes does not support Intl compact notation.
 */
export function formatViewCountCompact(
  count: number | string | undefined | null,
): string {
  const n = typeof count === 'string' ? parseInt(count, 10) : Number(count);
  if (!Number.isFinite(n) || n < 0) {
    return '0';
  }
  if (n >= 1_000_000) {
    const millions = Math.floor((n / 1_000_000) * 10) / 10;
    return `${millions % 1 === 0 || millions >= 10 ? Math.floor(millions) : millions}M`;
  }
  if (n >= 1_000) {
    const thousands = Math.floor((n / 1_000) * 10) / 10;
    return `${thousands % 1 === 0 || thousands >= 10 ? Math.floor(thousands) : thousands}K`;
  }
  return String(Math.floor(n));
}
