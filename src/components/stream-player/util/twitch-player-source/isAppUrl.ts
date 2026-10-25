export function isAppUrl(url: string): boolean {
  return url.startsWith('foam://') || url.startsWith('exp+foam://');
}
