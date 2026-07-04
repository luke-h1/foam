import type { SuggestionType } from '../chatComposerTypes';
import { getCurrentWordInfo } from './getCurrentWordInfo';

export const getCurrentWordAndType = (text: string, cursorPosition: number) => {
  const wordInfo = getCurrentWordInfo(text, cursorPosition);
  const isUserMention = wordInfo.word.startsWith('@');

  return {
    ...wordInfo,
    type: isUserMention ? 'user' : ('emote' as SuggestionType),
    searchTerm: isUserMention ? wordInfo.word.slice(1) : wordInfo.word,
  };
};
