export function normaliseChatUsername(value?: string | null): string {
  return value?.trim().replace(/^@/, '').toLowerCase() ?? '';
}

/**
 * Raw-text mention check for live messages whose emote parse is deferred to
 * commit time, where there are no mention parts to scan yet.
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
