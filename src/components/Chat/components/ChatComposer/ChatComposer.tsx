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
  useMemo,
  useState,
  useDeferredValue,
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

interface EmoteSuggestionRailProps {
  handleEmotePress: (emote: SanitisedEmote) => void;
  maxSuggestions: number;
  prioritizeChannelEmotes: boolean;
  searchTerm: string;
}

const EmoteSuggestionRail = memo(function EmoteSuggestionRail({
  handleEmotePress,
  maxSuggestions,
  prioritizeChannelEmotes,
  searchTerm,
}: EmoteSuggestionRailProps) {
  const deferredEmoteSearchTerm = useDeferredValue(searchTerm);
  const { filteredEmotes } = useEmoteSuggestions({
    searchTerm: deferredEmoteSearchTerm,
    maxSuggestions,
    prioritizeChannelEmotes,
  });

  const { opacity, scale, translateY } = useSuggestionAnimations({
    shouldShow: filteredEmotes.length > 0,
  });

  if (filteredEmotes.length === 0) {
    return null;
  }

  return (
    <View style={styles.suggestionRail}>
      <EmoteSuggestions
        emotes={filteredEmotes}
        handleEmotePress={handleEmotePress}
        suggestionOpacity={opacity}
        suggestionScale={scale}
        suggestionTranslateY={translateY}
      />
    </View>
  );
});

interface UserSuggestionRailProps {
  handleUserSelect: (user: ChatUser) => void;
  maxSuggestions: number;
  searchTerm: string;
}

const UserSuggestionRail = memo(function UserSuggestionRail({
  handleUserSelect,
  maxSuggestions,
  searchTerm,
}: UserSuggestionRailProps) {
  const deferredMentionWord = useDeferredValue(searchTerm);
  const { filteredUsers } = useUserSuggestions({
    searchTerm: deferredMentionWord,
    enabled: true,
    maxSuggestions,
  });

  const validUsers = useMemo(
    () =>
      filteredUsers.filter((user): user is typeof user => user !== undefined),
    [filteredUsers],
  );

  if (validUsers.length === 0) {
    return null;
  }

  return (
    <View style={styles.suggestionRail}>
      <UserSuggestions
        users={validUsers}
        showUserSuggestions
        handleUserSelect={handleUserSelect}
      />
    </View>
  );
});

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

    const shouldShowUserSuggestions =
      isFocused && isUserMention && wordInfo.word.length > 1;
    const shouldSearchEmoteSuggestions =
      isFocused && isEmoteSearch && wordInfo.word.length > 0;

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

        setTimeout(() => {
          setCursorPosition(newCursorPosition);
        }, 10);
      },
      [value, wordInfo, onEmoteSelect, onChangeText],
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
        {shouldSearchEmoteSuggestions ? (
          <EmoteSuggestionRail
            handleEmotePress={handleEmotePress}
            maxSuggestions={maxSuggestions}
            prioritizeChannelEmotes={prioritizeChannelEmotes}
            searchTerm={wordInfo.searchTerm}
          />
        ) : null}
        {shouldShowUserSuggestions ? (
          <UserSuggestionRail
            handleUserSelect={handleUserSelect}
            maxSuggestions={maxSuggestions}
            searchTerm={wordInfo.word}
          />
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
