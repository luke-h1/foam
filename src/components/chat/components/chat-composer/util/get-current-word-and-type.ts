import type { SuggestionType } from './chat-composer-types';
import { getCurrentWordInfo } from './get-current-word-info';

export const getCurrentWordAndType = (text: string, cursorPosition: number) => {
  const wordInfo = getCurrentWordInfo(text, cursorPosition);
  const isUserMention = wordInfo.word.startsWith('@');
  const isCommand = wordInfo.word.startsWith('/') && wordInfo.start === 0;

  const type: SuggestionType = isUserMention
    ? 'user'
    : isCommand
      ? 'command'
      : 'emote';

  return {
    ...wordInfo,
    type,
    searchTerm:
      isUserMention || isCommand ? wordInfo.word.slice(1) : wordInfo.word,
  };
};
