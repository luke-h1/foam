import { useAccentColor } from '@app/context/AccentColorContext';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { SymbolView } from 'expo-symbols';
import { PressableScale } from 'pressto';
import { memo, useCallback, useRef, type Ref } from 'react';
import { TextInput, type TextInput as TextInputType, View } from 'react-native';
import type { ChatCommandFeedback } from '../util/chatCommands';
import { ChatCommandFeedbackView } from './ChatCommandFeedback';
import { EmoteSuggestionRail } from './EmoteSuggestionRail';
import { UserSuggestionRail } from './UserSuggestionRail';
import { chatComposerStyles as styles } from './chatComposerStyles';
import {
  useChatComposerState,
  type ChatComposerHandle,
} from './useChatComposerState';

export type { ChatComposerHandle };
export type SuggestionType = 'emote' | 'user';

export interface ChatComposerProps {
  commandFeedback?: ChatCommandFeedback | null;
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
  commandFeedback,
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
  const { accentHex } = useAccentColor();

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const blurInput = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  const {
    text,
    selection,
    setSelection,
    setIsFocused,
    showUserRail,
    showEmoteRail,
    wordInfo,
    submitEnabled,
    handleChangeText,
    handleSelectionChange,
    handleSubmit,
    handleEmotePress,
    handleUserSelect,
  } = useChatComposerState({
    onChangeText,
    onSubmit,
    onEmoteSelect,
    canSend,
    ref,
    focusInput,
    blurInput,
    applyCursor: cursor => {
      setSelection({ start: cursor, end: cursor });
    },
  });

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
          onSelectionChange={event =>
            handleSelectionChange(event.nativeEvent.selection.start)
          }
          onSubmitEditing={handleSubmit}
          selection={selection}
          value={text}
          placeholder={placeholder}
          placeholderTextColor='#8E8E93'
          returnKeyType='send'
          selectionColor={theme.color.text.dark}
          style={[
            styles.input,
            commandFeedback?.status === 'error' ? styles.inputError : null,
          ]}
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
      <ChatCommandFeedbackView feedback={commandFeedback ?? null} />
    </View>
  );
}

export const ChatComposer = memo(ChatComposerComponent);
