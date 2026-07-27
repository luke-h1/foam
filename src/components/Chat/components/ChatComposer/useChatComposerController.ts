import { type Ref, useCallback, useImperativeHandle, useState } from 'react';

import type { SlashCommandDefinition } from '@app/components/Chat/util/slashCommandDefinitions/types';
import { impact } from '@app/lib/haptics';
import type { ChatUser } from '@app/store/chat/types/constants';
import type { SanitisedEmote } from '@app/types/emote';

import { useWordInfo } from './hooks/useWordInfo';

export interface ChatComposerHandle {
  focus: () => void;
  blur: () => void;
  setText: (text: string) => void;
}

// Twitch drops anything longer on send, silently.
export const MAX_MESSAGE_LENGTH = 500;

// A permanent counter is noise.
const CHARACTER_COUNT_VISIBLE_FROM = MAX_MESSAGE_LENGTH - 50;

interface UseChatComposerControllerOptions {
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  canSend?: boolean;
  ref?: Ref<ChatComposerHandle>;
  focusInput: () => void;
  blurInput: () => void;
  applyCursor?: (cursor: number) => void;
}

export function useChatComposerController({
  onChangeText,
  onSubmit,
  canSend,
  ref,
  focusInput,
  blurInput,
  applyCursor,
}: UseChatComposerControllerOptions) {
  const [text, setText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selection, setSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const [isFocused, setIsFocused] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState('');

  const hasText = text.length > 0;
  const isOverLimit = text.length > MAX_MESSAGE_LENGTH;
  const submitEnabled = (canSend ?? hasText) && !isOverLimit;
  const remainingCharacters = MAX_MESSAGE_LENGTH - text.length;
  const showCharacterCount = text.length >= CHARACTER_COUNT_VISIBLE_FROM;
  const canRecallLastMessage = !hasText && lastSentMessage.length > 0;

  const { wordInfo, isUserMention, isEmoteSearch, isCommandSearch } =
    useWordInfo({
      text,
      cursorPosition,
    });

  const showUserRail = isFocused && isUserMention && wordInfo.word.length > 1;
  const showEmoteRail = isFocused && isEmoteSearch && wordInfo.word.length > 0;
  const showCommandRail = isFocused && isCommandSearch;

  const writeText = useCallback(
    (next: string, nextCursor?: number) => {
      setText(next);
      const cursor = nextCursor ?? next.length;
      setCursorPosition(cursor);
      applyCursor?.(cursor);
      onChangeText?.(next);
    },
    [applyCursor, onChangeText],
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: focusInput,
      blur: blurInput,
      setText: (next: string) => {
        writeText(next);
      },
    }),
    [blurInput, focusInput, writeText],
  );

  const handleChangeText = useCallback(
    (next: string) => {
      setText(next);
      setSelection(undefined);
      onChangeText?.(next);
    },
    [onChangeText],
  );

  const handleSelectionChange = useCallback((start: number) => {
    setCursorPosition(start);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!submitEnabled) {
      return;
    }
    // Captured before the parent clears the input, so it can be recalled.
    const sent = text.trim();
    if (sent) {
      setLastSentMessage(sent);
    }
    void impact('light');
    onSubmit?.();
    blurInput();
  }, [blurInput, onSubmit, submitEnabled, text]);

  const recallLastMessage = useCallback(() => {
    if (!lastSentMessage) {
      return;
    }
    writeText(lastSentMessage);
    focusInput();
  }, [focusInput, lastSentMessage, writeText]);

  const handleEmotePress = useCallback(
    (emote: SanitisedEmote) => {
      const beforeWord = text.substring(0, wordInfo.start);
      const afterWord = text.substring(wordInfo.end);
      const newText = `${beforeWord}${emote.name}${afterWord}`;
      const newCursor = wordInfo.start + emote.name.length;
      writeText(newText, newCursor);
    },
    [text, wordInfo.end, wordInfo.start, writeText],
  );

  const handleUserSelect = useCallback(
    (user: ChatUser) => {
      const beforeWord = text.substring(0, wordInfo.start);
      const afterWord = text.substring(wordInfo.end);
      const newText = `${beforeWord}${user.name} ${afterWord}`;
      const newCursor = wordInfo.start + user.name.length + 1;
      writeText(newText, newCursor);
    },
    [text, wordInfo.end, wordInfo.start, writeText],
  );

  const handleCommandSelect = useCallback(
    (command: SlashCommandDefinition) => {
      const beforeWord = text.substring(0, wordInfo.start);
      const afterWord = text.substring(wordInfo.end);
      const newText = `${beforeWord}/${command.name} ${afterWord}`;
      const newCursor = wordInfo.start + command.name.length + 2;
      writeText(newText, newCursor);
    },
    [text, wordInfo.end, wordInfo.start, writeText],
  );

  return {
    text,
    selection,
    setSelection,
    setIsFocused,
    showUserRail,
    showEmoteRail,
    showCommandRail,
    wordInfo,
    submitEnabled,
    isOverLimit,
    remainingCharacters,
    showCharacterCount,
    canRecallLastMessage,
    recallLastMessage,
    handleChangeText,
    handleSelectionChange,
    handleSubmit,
    handleEmotePress,
    handleUserSelect,
    handleCommandSelect,
  };
}
