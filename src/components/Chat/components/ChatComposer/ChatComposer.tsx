import { useAccentColor } from '@app/context/AccentColorContext';
import type { ChatUser } from '@app/store/chatStore/constants';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { SymbolView } from 'expo-symbols';
import { PressableScale } from 'pressto';
import {
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import {
  StyleSheet,
  TextInput,
  type TextInput as TextInputType,
  View,
} from 'react-native';
import {
  COMPOSER_CONTROL_RADIUS,
  COMPOSER_CONTROL_SIZE,
  COMPOSER_INPUT_MIN_HEIGHT,
  COMPOSER_ROW_GAP,
} from '../composerSizing';
import { EmoteSuggestionRail } from './EmoteSuggestionRail';
import { UserSuggestionRail } from './UserSuggestionRail';
import { useWordInfo } from './hooks/useWordInfo';

export type SuggestionType = 'emote' | 'user';

export interface ChatComposerHandle {
  focus: () => void;
  blur: () => void;
  setText: (text: string) => void;
}

export interface ChatComposerProps {
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onPressAdd?: () => void;
  onEmoteSelect?: (emote: SanitisedEmote) => void;
  maxSuggestions?: number;
  prioritizeChannelEmotes?: boolean;
  placeholder?: string;
  editable?: boolean;
  canSend?: boolean;
  ref?: Ref<ChatComposerHandle>;
}

function ChatComposerComponent({
  onChangeText,
  onSubmit,
  onPressAdd,
  onEmoteSelect,
  maxSuggestions = 50,
  prioritizeChannelEmotes = true,
  placeholder = 'Send a message...',
  editable = true,
  canSend,
  ref,
}: ChatComposerProps) {
  const inputRef = useRef<TextInputType>(null);
  const [text, setText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selection, setSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const [isFocused, setIsFocused] = useState(false);
  const { accentHex } = useAccentColor();

  const hasText = text.length > 0;
  const submitEnabled = canSend ?? hasText;

  const { wordInfo, isUserMention, isEmoteSearch } = useWordInfo({
    text,
    cursorPosition,
  });

  const showUserRail = isFocused && isUserMention && wordInfo.word.length > 1;
  const showEmoteRail = isFocused && isEmoteSearch && wordInfo.word.length > 0;

  const writeText = useCallback(
    (next: string, nextCursor?: number) => {
      setText(next);
      const cursor = nextCursor ?? next.length;
      setCursorPosition(cursor);
      if (nextCursor !== undefined) {
        setSelection({ start: nextCursor, end: nextCursor });
      }
      onChangeText?.(next);
    },
    [onChangeText],
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      setText: (next: string) => {
        writeText(next);
      },
    }),
    [writeText],
  );

  const handleChangeText = useCallback(
    (next: string) => {
      setText(next);
      setSelection(undefined);
      onChangeText?.(next);
    },
    [onChangeText],
  );

  const handleSelectionChange = useCallback(
    (event: { nativeEvent: { selection: { start: number; end: number } } }) => {
      setCursorPosition(event.nativeEvent.selection.start);
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!submitEnabled) {
      return;
    }
    onSubmit?.();
    inputRef.current?.blur();
  }, [onSubmit, submitEnabled]);

  const handleEmotePress = useCallback(
    (emote: SanitisedEmote) => {
      const beforeWord = text.substring(0, wordInfo.start);
      const afterWord = text.substring(wordInfo.end);
      const newText = `${beforeWord}${emote.name}${afterWord}`;
      const newCursor = wordInfo.start + emote.name.length;
      onEmoteSelect?.(emote);
      writeText(newText, newCursor);
    },
    [onEmoteSelect, text, wordInfo.end, wordInfo.start, writeText],
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

  return (
    <View style={styles.mainContainer}>
      {showEmoteRail ? (
        <EmoteSuggestionRail
          handleEmotePress={handleEmotePress}
          maxSuggestions={maxSuggestions}
          prioritizeChannelEmotes={prioritizeChannelEmotes}
          searchTerm={wordInfo.searchTerm}
        />
      ) : null}
      {showUserRail ? (
        <UserSuggestionRail
          handleUserSelect={handleUserSelect}
          maxSuggestions={maxSuggestions}
          searchTerm={wordInfo.word}
        />
      ) : null}

      <View style={styles.row}>
        {onPressAdd ? (
          <PressableScale style={styles.addButton} onPress={onPressAdd}>
            <SymbolView
              name='face.smiling'
              size={22}
              tintColor={theme.colorGreyHoverAlpha}
            />
          </PressableScale>
        ) : null}

        <TextInput
          ref={inputRef}
          autoCapitalize='none'
          autoComplete='off'
          autoCorrect={false}
          blurOnSubmit
          editable={editable}
          multiline
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSelectionChange={handleSelectionChange}
          onSubmitEditing={handleSubmit}
          selection={selection}
          value={text}
          placeholder={placeholder}
          placeholderTextColor='#8E8E93'
          returnKeyType='send'
          selectionColor={theme.color.text.dark}
          style={styles.input}
          submitBehavior='blurAndSubmit'
        />

        {onSubmit ? (
          <PressableScale
            style={[
              styles.submitButton,
              {
                backgroundColor: submitEnabled
                  ? accentHex
                  : theme.darkActiveContent,
              },
            ]}
            onPress={handleSubmit}
          >
            <SymbolView
              name='arrow.up'
              size={20}
              tintColor={submitEnabled ? '#fff' : theme.colorGreyHoverAlpha}
            />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

export const ChatComposer = memo(ChatComposerComponent);

const styles = StyleSheet.create({
  mainContainer: {
    position: 'relative',
    width: '100%',
  },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: COMPOSER_ROW_GAP,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderRadius: COMPOSER_CONTROL_RADIUS,
    height: COMPOSER_CONTROL_SIZE,
    justifyContent: 'center',
    width: COMPOSER_CONTROL_SIZE,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: COMPOSER_CONTROL_RADIUS,
    height: COMPOSER_CONTROL_SIZE,
    justifyContent: 'center',
    width: COMPOSER_CONTROL_SIZE,
  },
  input: {
    backgroundColor: theme.darkActiveContent,
    borderRadius: 20,
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    minHeight: COMPOSER_INPUT_MIN_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
