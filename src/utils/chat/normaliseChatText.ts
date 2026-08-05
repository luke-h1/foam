/**
 * Case- and whitespace-insensitive form of free chat text: message bodies,
 * search queries, hidden phrases, highlight phrases.
 *
 * Deliberately not `normaliseChatUsername`, which also strips a leading `@`.
 * Doing that to free text turns a search for "@luke" into a search for "luke".
 */
export function normaliseChatText(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}
