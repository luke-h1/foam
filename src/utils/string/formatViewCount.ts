/**
 * Format viewer count for display.
 * Safely handles string/number from API and invalid values.
 */
export function formatViewCount(
  count: number | string | undefined | null,
): string {
  const n = typeof count === 'string' ? parseInt(count, 10) : Number(count);
  if (!Number.isFinite(n) || n < 0) return '0';
  return new Intl.NumberFormat('en-US').format(Math.floor(n));
}
