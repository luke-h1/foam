import type { ChatUser } from '@app/store/chatStore/constants';
import type { SanitisedEmote } from '@app/types/emote';
import type {
  InputRef,
  InputSelection,
  ThemedInputProps,
} from '@app/components/ui/Input/Input';
import {
  forwardRef,
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { ChatInput } from './components/ChatInput';
import { EmoteSuggestions } from './components/EmoteSuggestions';
import { UserSuggestions } from './components/UserSuggestions';
import { useEmoteSuggestions } from './hooks/useEmoteSuggestions';
import { useSuggestionAnimations } from './hooks/useSuggestionAnimations';
import { useUserSuggestions } from './hooks/useUserSuggestions';
import { useWordInfo } from './hooks/useWordInfo';

export type SuggestionType = 'emote' | 'user';

interface ChatComposerProps extends ThemedInputProps {
  onEmoteSelect?: (emote: SanitisedEmote) => void;
  maxSuggestions?: number;
  prioritizeChannelEmotes?: boolean;
  placeholder?: string;
}

const ChatComposerComponent = forwardRef<InputRef, ChatComposerProps>(
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
    const [cursorPosition, setCursorPosition] = useState(0);

    const { wordInfo, isUserMention, isEmoteSearch } = useWordInfo({
      text: value,
      cursorPosition,
    });
    const deferredEmoteSearchTerm = useDeferredValue(wordInfo.searchTerm);
    const deferredMentionWord = useDeferredValue(wordInfo.word);

    const { filteredEmotes } = useEmoteSuggestions({
      searchTerm: deferredEmoteSearchTerm,
      maxSuggestions,
      prioritizeChannelEmotes,
    });

    const { filteredUsers } = useUserSuggestions({
      searchTerm: deferredMentionWord,
      enabled: isUserMention,
      maxSuggestions,
    });

    const showEmoteSuggestions =
      isFocused &&
      isEmoteSearch &&
      filteredEmotes.length > 0 &&
      wordInfo.word.length > 0;

    const { opacity, scale, translateY, hide } = useSuggestionAnimations({
      shouldShow: showEmoteSuggestions,
    });

    const shouldShowUserSuggestions =
      isFocused && isUserMention && filteredUsers.length > 0;

    const validUsers = useMemo(
      () =>
        filteredUsers.filter((user): user is typeof user => user !== undefined),
      [filteredUsers],
    );

    const handleTextChange = useCallback(
      (text: string) => {
        onChangeText?.(text);
      },
      [onChangeText],
    );

    const handleSelectionChange = useCallback((selection: InputSelection) => {
      setCursorPosition(selection.start);
    }, []);

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

    const showSuggestionRail =
      showEmoteSuggestions || shouldShowUserSuggestions;

    return (
      <View style={styles.mainContainer}>
        {showSuggestionRail ? (
          <View style={styles.suggestionRail}>
            <EmoteSuggestions
              emotes={filteredEmotes}
              handleEmotePress={handleEmotePress}
              suggestionOpacity={opacity}
              suggestionScale={scale}
              suggestionTranslateY={translateY}
            />
            <UserSuggestions
              users={validUsers}
              showUserSuggestions={shouldShowUserSuggestions}
              handleUserSelect={handleUserSelect}
            />
          </View>
        ) : null}
        <View style={styles.inputWrapper}>
          <ChatInput
            ref={ref}
            value={value}
            placeholder={placeholder}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...textFieldProps}
          />
        </View>
      </View>
    );
  },
);

ChatComposerComponent.displayName = 'ChatComposer';

export const ChatComposer = memo(ChatComposerComponent);

ChatComposer.displayName = 'ChatComposer';

const styles = StyleSheet.create({
  inputWrapper: {
    width: '100%',
    zIndex: 1,
  },
  mainContainer: {
    position: 'relative',
    width: '100%',
  },
  suggestionRail: {
    bottom: '100%',
    left: 0,
    paddingBottom: 6,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
});
