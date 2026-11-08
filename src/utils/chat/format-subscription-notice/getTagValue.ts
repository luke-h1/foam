export function getTagValue(
  tags: Record<string, string | undefined>,
  key: string,
): string {
  return tags[key] ?? '';
}
