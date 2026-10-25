export function getTagValue(
  tags: Record<string, string | boolean | undefined>,
  key: string,
): string {
  const value = tags[key];
  return value === undefined || value === true || value === false ? '' : value;
}
