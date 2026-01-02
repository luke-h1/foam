export const getCurrentWordInfo = (text: string, cursorPosition: number) => {
  // Guard against null/undefined text
  const safeText = text ?? '';
  const safeCursorPosition = Math.max(
    0,
    Math.min(cursorPosition, safeText.length),
  );

  /**
   * Find word boundaries (space, start, or end of string)
   */
  let wordStart = safeCursorPosition;
  let wordEnd = safeCursorPosition;

  /**
   * Find start of current word
   */
  while (wordStart > 0 && safeText[wordStart - 1] !== ' ') {
    // eslint-disable-next-line no-plusplus
    wordStart--;
  }

  /**
   * Find end of current word
   */
  while (wordEnd < safeText.length && safeText[wordEnd] !== ' ') {
    // eslint-disable-next-line no-plusplus
    wordEnd++;
  }

  const currentWord = safeText.substring(wordStart, wordEnd);

  return {
    word: currentWord,
    start: wordStart,
    end: wordEnd,
  };
};
