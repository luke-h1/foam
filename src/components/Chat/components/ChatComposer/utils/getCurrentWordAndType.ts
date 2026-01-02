import { SuggestionType } from '../ChatComposer';
import { getCurrentWordInfo } from './getCurrentWordInfo';

export const getCurrentWordAndType = (text: string, cursorPosition: number) => {
  const wordInfo = getCurrentWordInfo(text, cursorPosition);
  const safeWord = wordInfo.word ?? '';
  const isUserMention = safeWord.startsWith('@');

  return {
    ...wordInfo,
    word: safeWord,
    type: isUserMention ? 'user' : ('emote' as SuggestionType),
    searchTerm: isUserMention ? safeWord.slice(1) : safeWord,
  };
};
