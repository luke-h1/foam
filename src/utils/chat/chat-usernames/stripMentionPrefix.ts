export function stripMentionPrefix(value?: string | null): string {
  return value?.trim().replace(/^@/, '') ?? '';
}
