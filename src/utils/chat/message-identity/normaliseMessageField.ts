/**
 * IRC tags arrive padded; every identity comparison in chat trims before
 * comparing so a stray space cannot fork one message into two keys.
 */
export function normaliseMessageField(value: string | undefined): string {
  return value?.trim() ?? '';
}
