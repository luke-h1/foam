export function normaliseUsername(value?: string): string {
  return value?.trim().replace(/^@/, '').toLowerCase() ?? '';
}
