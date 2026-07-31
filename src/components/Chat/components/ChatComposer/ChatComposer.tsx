import { memo, type Ref, useCallback, useRef } from 'react';
import { TextInput, type TextInput as TextInputType, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PressableScale } from 'pressto';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useAccentColor } from '@app/context/AccentColorContext';
import { theme } from '@app/styles/themes';

import { chatComposerStyles as styles } from './chatComposerStyles';
import { CommandSuggestionRail } from './CommandSuggestionRail';
import { EmoteSuggestionRail } from './EmoteSuggestionRail';
import {
  type ChatComposerHandle,
  useChatComposerController,
} from './useChatComposerController';
import { UserSuggestionRail } from './UserSuggestionRail';

export type { ChatComposerHandle };
export type { SuggestionType } from './chatComposerTypes';

/**
 * 40% alpha. The highlight sits under the glyphs, so it stays translucent while
 * the caret and handles take the solid accent - iOS derives the same pair from
 * a single tint, and Android is pinned to that palette.
 */
const SELECTION_HIGHLIGHT_ALPHA = '66';

export interface ChatComposerProps {
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onPressAdd?: () => void;
  maxSuggestions?: number;
  prioritizeChannelEmotes?: boolean;
  placeholder?: string;
  editable?: boolean;
  canSend?: boolean;
  reservedCharacters?: number;
  ref?: Ref<ChatComposerHandle>;
}

function ChatComposerComponent({
  onChangeText,
  onSubmit,
  onPressAdd,
  maxSuggestions = 50,
  prioritizeChannelEmotes = true,
  placeholder,
  editable = true,
  canSend,
  reservedCharacters,
  ref,
}: ChatComposerProps) {
  const { t } = useTranslation('chat');
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
    showCommandRail,
    wordInfo,
    submitEnabled,
    isOverLimit,
    remainingCharacters,
    showCharacterCount,
    canRecallLastMessage,
    hasLastMessage,
    recallLastMessage,
    handleChangeText,
    handleSelectionChange,
    handleSubmit,
    handleEmotePress,
    handleUserSelect,
    handleCommandSelect,
  } = useChatComposerController({
    onChangeText,
    onSubmit,
    canSend,
    reservedCharacters,
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
      {showCommandRail ? (
        <CommandSuggestionRail
          handleCommandSelect={handleCommandSelect}
          maxSuggestions={maxSuggestions}
          searchTerm={wordInfo.searchTerm}
        />
      ) : null}

      {showCharacterCount ? (
        <Text
          type='xxs'
          weight='semibold'
          style={[
            styles.characterCount,
            isOverLimit ? { color: theme.colorRed } : undefined,
          ]}
        >
          {remainingCharacters}
        </Text>
      ) : null}

      <View style={styles.row}>
        {/**
         * Reserved from the first send onward so the row stops resizing every
         * time the input empties.
         */}
        {hasLastMessage ? (
          <View style={styles.recallSlot}>
            {canRecallLastMessage ? (
              <PressableScale
                accessibilityLabel={t('composer.recallLastMessage')}
                accessibilityRole='button'
                style={styles.addButton}
                onPress={recallLastMessage}
              >
                <SymbolView
                  name='clock.arrow.circlepath'
                  size={22}
                  tintColor={theme.colorGreyHoverAlpha}
                />
              </PressableScale>
            ) : null}
          </View>
        ) : null}

        {onPressAdd ? (
          <PressableScale
            accessibilityLabel={t('composer.openEmotePicker')}
            accessibilityRole='button'
            style={styles.addButton}
            onPress={onPressAdd}
          >
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
          placeholder={placeholder ?? t('composer.sendAMessage')}
          placeholderTextColor={theme.color.textSecondary.dark}
          returnKeyType='send'
          cursorColor={accentHex}
          selectionColor={`${accentHex}${SELECTION_HIGHLIGHT_ALPHA}`}
          selectionHandleColor={accentHex}
          style={styles.input}
          submitBehavior='blurAndSubmit'
          /**
           * Android: without this, landscape drops into the fullscreen IME
           * editor, covering the stream and chat.
           */
          disableFullscreenUI
          underlineColorAndroid='transparent'
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
            accessibilityLabel={t('composer.sendMessage')}
            accessibilityRole='button'
            accessibilityState={{ disabled: !submitEnabled }}
            onPress={handleSubmit}
          >
            <SymbolView
              name='arrow.up'
              size={20}
              tintColor={
                submitEnabled ? theme.colorWhite : theme.colorGreyHoverAlpha
              }
            />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

export const ChatComposer = memo(ChatComposerComponent);
