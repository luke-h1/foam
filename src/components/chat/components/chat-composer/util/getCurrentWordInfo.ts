export const getCurrentWordInfo = (text: string, cursorPosition: number) => {
  const safeCursorPosition = Math.max(0, Math.min(cursorPosition, text.length));

  let wordStart = safeCursorPosition;
  let wordEnd = safeCursorPosition;

  while (wordStart > 0 && text[wordStart - 1] !== ' ') {
    // eslint-disable-next-line no-plusplus
    wordStart--;
  }

  while (wordEnd < text.length && text[wordEnd] !== ' ') {
    // eslint-disable-next-line no-plusplus
    wordEnd++;
  }

  const currentWord = text.substring(wordStart, wordEnd);

  return {
    word: currentWord,
    start: wordStart,
    end: wordEnd,
  };
};
