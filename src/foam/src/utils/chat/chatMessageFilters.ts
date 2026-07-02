/**
 * Whether an incoming chat message's author is on the viewer's block list.
 * Case-insensitive on login.
 */
export function isUserBlocked(
  username: string | undefined,
  blockedUsers: { userLogin: string }[],
): boolean {
  if (!username || blockedUsers.length === 0) {
    return false;
  }
  return blockedUsers.some(
    blockedUser =>
      blockedUser.userLogin.toLowerCase() === username.toLowerCase(),
  );
}

/**
 * Whether a message matches the viewer's muted words. With `matchWholeWord` the
 * message is split on spaces and each token is compared; otherwise the whole
 * message is compared as a single token.
 */
export function containsMutedWords(
  message: string,
  mutedWords: string[],
  matchWholeWord: boolean,
): boolean {
  if (mutedWords.length === 0) {
    return false;
  }

  const messageLower = message.toLowerCase();
  const words = matchWholeWord ? messageLower.split(' ') : [messageLower];

  return mutedWords.some(mutedWord => {
    const mutedWordLower = mutedWord.toLowerCase();
    return words.some(word => word === mutedWordLower);
  });
}
