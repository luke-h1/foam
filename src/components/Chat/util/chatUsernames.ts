export function normaliseChatUsername(value?: string | null): string {
  return value?.trim().replace(/^@/, '').toLowerCase() ?? '';
}

/**
 * Raw-text twin of the parsed-part mention check: true when any
 * whitespace-delimited @token normalises to `normalisedUser`. Used for mention
 * haptics on live messages whose emote parse is deferred to commit, where the
 * body is still a single text part with no mention parts to scan.
 */
export function textMentionsUser(
  text: string,
  normalisedUser: string,
): boolean {
  if (!normalisedUser) {
    return false;
  }
  return text.split(/\s+/).some(token => {
    const username = token.match(/^@([A-Za-z0-9_]+)/)?.[1];
    return normaliseChatUsername(username) === normalisedUser;
  });
}
