// Both filters run for every incoming PRIVMSG (up to ~100/s in busy chats), so
// the lowercased forms of the preference lists are cached per array identity -
// the lists only get a new identity when the preference actually changes.
const blockedLoginSets = new WeakMap<{ userLogin: string }[], Set<string>>();
const lowercasedMutedWords = new WeakMap<string[], string[]>();

function getBlockedLoginSet(
  blockedUsers: { userLogin: string }[],
): Set<string> {
  let set = blockedLoginSets.get(blockedUsers);
  if (!set) {
    set = new Set(
      blockedUsers.map(blockedUser => blockedUser.userLogin.toLowerCase()),
    );
    blockedLoginSets.set(blockedUsers, set);
  }
  return set;
}

function getLowercasedMutedWords(mutedWords: string[]): string[] {
  let lowered = lowercasedMutedWords.get(mutedWords);
  if (!lowered) {
    lowered = mutedWords.map(mutedWord => mutedWord.toLowerCase());
    lowercasedMutedWords.set(mutedWords, lowered);
  }
  return lowered;
}

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
  return getBlockedLoginSet(blockedUsers).has(username.toLowerCase());
}

/**
 * Whether a message matches the viewer's muted words. With `matchWholeWord`
 * the message is split on spaces and each token is compared; otherwise a
 * muted word matches anywhere in the message as a substring.
 */
export function containsMutedWords(
  message: string,
  mutedWords: string[],
  matchWholeWord: boolean,
): boolean {
  if (mutedWords.length === 0) {
    return false;
  }

  const lowered = getLowercasedMutedWords(mutedWords);
  const messageLower = message.toLowerCase();
  if (!matchWholeWord) {
    return lowered.some(mutedWord => messageLower.includes(mutedWord));
  }

  const words = messageLower.split(' ');
  return lowered.some(mutedWord => words.includes(mutedWord));
}
