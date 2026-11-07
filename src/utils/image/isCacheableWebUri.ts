export function isCacheableWebUri(uri: string | undefined): uri is string {
  return uri !== undefined && /^https?:\/\//i.test(uri);
}
