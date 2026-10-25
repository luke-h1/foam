export function absoluteSevenTvUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}
