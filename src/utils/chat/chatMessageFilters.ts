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

export function isUserBlocked(
  username: string | undefined,
  blockedUsers: { userLogin: string }[],
): boolean {
  if (!username || blockedUsers.length === 0) {
    return false;
  }
  return getBlockedLoginSet(blockedUsers).has(username.toLowerCase());
}

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

  const words = new Set(messageLower.split(' '));
  return lowered.some(mutedWord => words.has(mutedWord));
}
