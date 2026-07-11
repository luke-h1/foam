export function getTagValue(
  tags: Record<string, string | boolean | undefined>,
  key: string,
): string {
  const value = tags[key];
  return typeof value === 'string' ? value : '';
}
