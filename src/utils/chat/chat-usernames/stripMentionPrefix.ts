/**
 * Trims a login and removes one leading `@`, but keeps its casing. Use
 * `normaliseChatUsername` when the value is a lookup key.
 */
export function stripMentionPrefix(value?: string | null): string {
  return value?.trim().replace(/^@/, '') ?? '';
}
