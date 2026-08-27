/**
 * Case- and whitespace-insensitive form of free chat text. Deliberately not
 * `normaliseChatUsername` - stripping `@` turns a search for "@luke" into "luke".
 */
export function normaliseChatText(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}
