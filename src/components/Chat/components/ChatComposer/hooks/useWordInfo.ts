import { useEffect, useMemo, useState } from 'react';
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
  const [wordInfo, setWordInfo] = useState<WordInfo>({
    word: '',
    start: 0,
    end: 0,
    type: 'emote',
    searchTerm: '',
  });

  const computedWordInfo = useMemo(() => {
    return getCurrentWordAndType(text ?? '', cursorPosition);
  }, [text, cursorPosition]);

  useEffect(() => {
    setWordInfo(computedWordInfo);
  }, [computedWordInfo]);

  const isUserMention = useMemo(
    () => wordInfo.word.startsWith('@') && wordInfo.word.length > 1,
    [wordInfo.word],
  );

  const isEmoteSearch = useMemo(
    () => !wordInfo.word.startsWith('@') && wordInfo.word.length > 0,
    [wordInfo.word],
  );

  return {
    wordInfo,
    isUserMention,
    isEmoteSearch,
  };
}
