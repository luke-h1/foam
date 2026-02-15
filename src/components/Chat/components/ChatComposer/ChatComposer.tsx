import { ChatUser } from '@app/store/chatStore';
import type { SanitisedEmote } from '@app/types/emote';
import { useCallback, useEffect, useState, forwardRef, useMemo } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  LayoutChangeEvent,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ChatInput } from './components/ChatInput';
import { EmoteSuggestions } from './components/EmoteSuggestions';
import { UserSuggestions } from './components/UserSuggestions';
import { useEmoteSuggestions } from './hooks/useEmoteSuggestions';
import { useSuggestionAnimations } from './hooks/useSuggestionAnimations';
import { useUserSuggestions } from './hooks/useUserSuggestions';
import { useWordInfo } from './hooks/useWordInfo';

export type SuggestionType = 'emote' | 'user';

interface ChatComposerProps extends TextInputProps {
  onEmoteSelect?: (emote: SanitisedEmote) => void;
  maxSuggestions?: number;
  prioritizeChannelEmotes?: boolean;
  placeholder?: string;
}

export const ChatComposer = forwardRef<TextInput, ChatComposerProps>(
  (
    {
      onEmoteSelect,
      onChangeText,
      maxSuggestions = 50,
      prioritizeChannelEmotes = true,
      value = '',
      placeholder = 'Search emotes...',
      ...textFieldProps
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [inputLayout, setInputLayout] = useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    const { wordInfo, isUserMention, isEmoteSearch } = useWordInfo({
      text: value,
      cursorPosition,
    });

    const { filteredEmotes } = useEmoteSuggestions({
      searchTerm: wordInfo.searchTerm,
      maxSuggestions,
      prioritizeChannelEmotes,
    });

    const { filteredUsers } = useUserSuggestions({
      searchTerm: wordInfo.word,
      enabled: isUserMention,
    });

    const handleHideComplete = useCallback(() => {
      setShowSuggestions(false);
    }, []);

    const { opacity, scale, translateY, hide } = useSuggestionAnimations({
      shouldShow: showSuggestions,
      onHideComplete: handleHideComplete,
    });

    const shouldShowEmoteSuggestions =
      isFocused &&
      isEmoteSearch &&
      filteredEmotes.length > 0 &&
      wordInfo.word.length > 0;

    const shouldShowUserSuggestions =
      isFocused && isUserMention && filteredUsers.length > 0;

    const validUsers = useMemo(
      () =>
        filteredUsers.filter((user): user is typeof user => user !== undefined),
      [filteredUsers],
    );

    useEffect(() => {
      if (shouldShowEmoteSuggestions) {
        setShowSuggestions(true);
      } else if (!shouldShowEmoteSuggestions && !shouldShowUserSuggestions) {
        setShowSuggestions(false);
      }
    }, [shouldShowEmoteSuggestions, shouldShowUserSuggestions]);

    const handleInputLayout = useCallback((event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setInputLayout({ x, y, width, height });
    }, []);

    const handleTextChange = useCallback(
      (text: string) => {
        onChangeText?.(text);
      },
      [onChangeText],
    );

    const handleSelectionChange = useCallback(
      (event: {
        nativeEvent: { selection: { start: number; end: number } };
      }) => {
        setCursorPosition(event.nativeEvent.selection.start);
      },
      [],
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    const handleEmotePress = useCallback(
      (emote: SanitisedEmote) => {
        const beforeWord = value.substring(0, wordInfo.start);
        const afterWord = value.substring(wordInfo.end);
        const newText = `${beforeWord}${emote.name}${afterWord}`;
        const newCursorPosition = wordInfo.start + emote.name.length;

        onEmoteSelect?.(emote);
        onChangeText?.(newText);

        setShowSuggestions(false);
        hide();

        setTimeout(() => {
          setCursorPosition(newCursorPosition);
        }, 10);
      },
      [value, wordInfo, onEmoteSelect, onChangeText, hide],
    );

    const handleUserSelect = useCallback(
      (user: ChatUser) => {
        const beforeWord = value.substring(0, wordInfo.start);
        const afterWord = value.substring(wordInfo.end);
        const newText = `${beforeWord}${user.name} ${afterWord}`;
        const newCursorPosition = wordInfo.start + user.name.length + 1;

        onChangeText?.(newText);

        setTimeout(() => {
          setCursorPosition(newCursorPosition);
        }, 10);
      },
      [value, wordInfo, onChangeText],
    );
    return (
      <View style={styles.mainContainer}>
        <EmoteSuggestions
          emotes={filteredEmotes}
          handleEmotePress={handleEmotePress}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          inputLayout={inputLayout}
          suggestionOpacity={opacity}
          suggestionScale={scale}
          suggestionTranslateY={translateY}
        />
        <UserSuggestions
          users={validUsers}
          showUserSuggestions={shouldShowUserSuggestions}
          handleUserSelect={handleUserSelect}
        />
        <View style={styles.inputWrapper}>
          <ChatInput
            ref={ref}
            value={value}
            placeholder={placeholder}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            onLayout={handleInputLayout}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...textFieldProps}
          />
        </View>
      </View>
    );
  },
);

ChatComposer.displayName = 'ChatComposer';

const styles = StyleSheet.create(() => ({
  inputWrapper: {
    width: '100%',
  },
  mainContainer: {
    width: '100%',
  },
}));
