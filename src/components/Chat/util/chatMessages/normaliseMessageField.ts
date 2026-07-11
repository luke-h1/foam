export function normaliseMessageField(value: string | undefined): string {
  return value?.trim() ?? '';
}
