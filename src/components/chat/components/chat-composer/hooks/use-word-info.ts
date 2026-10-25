import { getCurrentWordAndType } from '../util/getCurrentWordAndType';

interface UseWordInfoProps {
  text: string;
  cursorPosition: number;
}

export function useWordInfo({ text, cursorPosition }: UseWordInfoProps) {
  const wordInfo = getCurrentWordAndType(text, cursorPosition);
  const isUserMention = wordInfo.type === 'user' && wordInfo.word.length > 1;
  const isEmoteSearch = wordInfo.type === 'emote' && wordInfo.word.length > 0;
  const isCommandSearch = wordInfo.type === 'command';

  return {
    wordInfo,
    isUserMention,
    isEmoteSearch,
    isCommandSearch,
  };
}
