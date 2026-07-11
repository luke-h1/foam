export function addUrl(urls: Set<string>, url?: string | null): void {
  if (url) {
    urls.add(url);
  }
}
