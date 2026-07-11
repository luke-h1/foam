const lowercasedMutedWords = new WeakMap<string[], string[]>();

function getLowercasedMutedWords(mutedWords: string[]): string[] {
  let lowered = lowercasedMutedWords.get(mutedWords);
  if (!lowered) {
    lowered = mutedWords.map(mutedWord => mutedWord.toLowerCase());
    lowercasedMutedWords.set(mutedWords, lowered);
  }
  return lowered;
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
