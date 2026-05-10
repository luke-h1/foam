import { useMemo } from 'react';
import { SuggestionType } from '../ChatComposer';
import { getCurrentWordAndType } from '../utils/getCurrentWordAndType';

interface WordInfo {
  word: string;
  start: number;
  end: number;
  type: SuggestionType;
  searchTerm: string;
}

interface UseWordInfoProps {
  text: string;
  cursorPosition: number;
}

export function useWordInfo({ text, cursorPosition }: UseWordInfoProps) {
  const wordInfo = useMemo<WordInfo>(
    () => getCurrentWordAndType(text ?? '', cursorPosition),
    [text, cursorPosition],
  );
  const isUserMention =
    wordInfo.word.startsWith('@') && wordInfo.word.length > 1;
  const isEmoteSearch =
    !wordInfo.word.startsWith('@') && wordInfo.word.length > 0;

  return {
    wordInfo,
    isUserMention,
    isEmoteSearch,
  };
}
