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
import { StyleSheet, View } from 'react-native';
import { Input, type InputRef } from '@app/components/ui/Input/Input.ios';
import {
  COMPOSER_CONTROL_RADIUS,
  COMPOSER_CONTROL_SIZE,
  COMPOSER_INPUT_MIN_HEIGHT,
  COMPOSER_ROW_GAP,
} from '../composerSizing';
import { EmoteSuggestionRail } from './EmoteSuggestionRail';
import { UserSuggestionRail } from './UserSuggestionRail';
import { useWordInfo } from './hooks/useWordInfo';

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
  const inputRef = useRef<InputRef>(null);
  const [text, setTextState] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
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
      setTextState(next);
      const cursor = nextCursor ?? next.length;
      setCursorPosition(cursor);
      if (nextCursor !== undefined) {
        void inputRef.current?.setSelection(nextCursor, nextCursor);
      }
      onChangeText?.(next);
    },
    [onChangeText],
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        void inputRef.current?.focus();
      },
      blur: () => {
        void inputRef.current?.blur();
      },
      setText: (next: string) => {
        writeText(next);
      },
    }),
    [writeText],
  );

  const handleChangeText = useCallback(
    (next: string) => {
      setTextState(next);
      onChangeText?.(next);
    },
    [onChangeText],
  );

  const handleSubmit = useCallback(() => {
    if (!submitEnabled) {
      return;
    }
    onSubmit?.();
    void inputRef.current?.blur();
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

        <View style={styles.inputWrapper}>
          <Input
            ref={inputRef}
            autoCapitalize='none'
            autoComplete='off'
            autoCorrect={false}
            blurOnSubmit
            color='white'
            editable={editable}
            value={text}
            multiline
            onBlur={() => setIsFocused(false)}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onSelectionChange={selection => setCursorPosition(selection.start)}
            onSubmitEditing={handleSubmit}
            placeholder={placeholder}
            placeholderTextColor='rgba(255,255,255,0.46)'
            radius='xl'
            returnKeyType='send'
            style={styles.input}
            submitBehavior='blurAndSubmit'
            variant='soft'
          />
        </View>

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
export type { ChatComposerHandle as InputRef };

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
  inputWrapper: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    backgroundColor: theme.darkActiveContent,
    borderRadius: 20,
    borderWidth: 0,
    maxHeight: 120,
    minHeight: COMPOSER_INPUT_MIN_HEIGHT,
    paddingBottom: 12,
    paddingHorizontal: 10,
    paddingTop: 12,
  },
});
