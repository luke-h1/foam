import { useAccentColor } from '@app/context/AccentColorContext';
import { Input, type InputRef } from '@app/components/ui/Input/Input.ios';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { SymbolView } from 'expo-symbols';
import { PressableScale } from 'pressto';
import { memo, useCallback, useRef, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ChatCommandFeedback } from '../util/chatCommands';
import { ChatCommandFeedbackView } from './ChatCommandFeedback';
import { EmoteSuggestionRail } from './EmoteSuggestionRail';
import { UserSuggestionRail } from './UserSuggestionRail';
import { COMPOSER_INPUT_MIN_HEIGHT } from '../constants/composerSizing';
import { chatComposerStyles } from './chatComposerStyles';
import {
  useChatComposerState,
  type ChatComposerHandle,
} from './useChatComposerState';

export type { ChatComposerHandle };

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
  const inputRef = useRef<InputRef>(null);
  const { accentHex } = useAccentColor();

  const focusInput = useCallback(() => {
    void inputRef.current?.focus();
  }, []);

  const blurInput = useCallback(() => {
    void inputRef.current?.blur();
  }, []);

  const {
    text,
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
      void inputRef.current?.setSelection(cursor, cursor);
    },
  });

  return (
    <View style={chatComposerStyles.mainContainer}>
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

      <View style={chatComposerStyles.row}>
        {onPressAdd ? (
          <PressableScale
            style={chatComposerStyles.addButton}
            onPress={onPressAdd}
          >
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
            editable={editable}
            value={text}
            multiline
            onBlur={() => setIsFocused(false)}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onSelectionChange={selection =>
              handleSelectionChange(selection.start)
            }
            onSubmitEditing={handleSubmit}
            placeholder={placeholder}
            placeholderTextColor='rgba(255,255,255,0.46)'
            radius='xl'
            returnKeyType='send'
            style={[
              styles.input,
              commandFeedback?.status === 'error' ? styles.inputError : null,
            ]}
            submitBehavior='blurAndSubmit'
            variant='soft'
          />
        </View>

        {onSubmit ? (
          <PressableScale
            style={[
              chatComposerStyles.submitButton,
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
export type { ChatComposerHandle as InputRef };

const styles = StyleSheet.create({
  inputWrapper: {
    flex: 1,
    minWidth: 0,
  },
  inputError: {
    borderColor: '#FF453A',
    borderWidth: 1,
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
