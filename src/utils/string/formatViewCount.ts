export function formatViewCount(count: number): string {
  return new Intl.NumberFormat('en-US').format(count);
}
