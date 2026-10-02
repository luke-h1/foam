import { memo, type Ref, useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { COMPOSER_GLYPH_SIZE } from '@app/components/chat/util/composer-sizing';
import { Input, type InputRef } from '@app/components/ui/input/input.ios';
import { Text } from '@app/components/ui/text/text';
import { useAccentColor } from '@app/context/accent-color-context';
import { theme } from '@app/styles/themes';

import { ComposerIconButton } from '../composer-icon-button';
import { ComposerOverflowButton } from '../composer-overflow-button';
import { chatComposerStyles } from './chat-composer.styles';
import { CommandSuggestionRail } from './command-suggestion-rail';
import { EmoteSuggestionRail } from './emote-suggestion-rail';
import {
  type ChatComposerHandle,
  useChatComposerController,
} from './hooks/use-chat-composer-controller';
import { UserSuggestionRail } from './user-suggestion-rail';
import { buildComposerOverflowActions } from './util/build-composer-overflow-actions';

export type { ChatComposerHandle };

export interface ChatComposerProps {
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onPressAdd?: () => void;
  onAttachImage?: () => void;
  onOpenSettings?: () => void;
  isUploadingImage?: boolean;
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
  onAttachImage,
  onOpenSettings,
  isUploadingImage,
  maxSuggestions = 50,
  prioritizeChannelEmotes = true,
  placeholder,
  editable = true,
  canSend,
  reservedCharacters,
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
  } = useChatComposerController({
    onChangeText,
    onSubmit,
    canSend,
    reservedCharacters,
    ref,
    focusInput,
    blurInput,
    applyCursor: cursor => {
      void inputRef.current?.setSelection(cursor, cursor);
    },
  });

  const overflowActions = useMemo(
    () =>
      buildComposerOverflowActions({
        canRecallLastMessage,
        isUploadingImage,
        onAttachImage,
        onOpenSettings,
        onRecallLastMessage: recallLastMessage,
      }),
    [
      canRecallLastMessage,
      isUploadingImage,
      onAttachImage,
      onOpenSettings,
      recallLastMessage,
    ],
  );

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
      {showCommandRail ? (
        <CommandSuggestionRail
          handleCommandSelect={handleCommandSelect}
          maxSuggestions={maxSuggestions}
          searchTerm={wordInfo.searchTerm}
        />
      ) : null}

      {showCharacterCount ? (
        <Text
          family='brand'
          type='caption'
          weight='semibold'
          style={[
            chatComposerStyles.characterCount,
            isOverLimit
              ? chatComposerStyles.characterCountOverLimit
              : undefined,
          ]}
        >
          {remainingCharacters}
        </Text>
      ) : null}

      <View style={chatComposerStyles.row}>
        <ComposerOverflowButton
          actions={overflowActions}
          busy={isUploadingImage}
        />

        <View
          style={[
            chatComposerStyles.pill,
            isOverLimit ? chatComposerStyles.pillOverLimit : undefined,
          ]}
        >
          <View style={chatComposerStyles.inputWrapper}>
            <Input
              ref={inputRef}
              autoCapitalize='none'
              autoComplete='off'
              autoCorrect={false}
              blurOnSubmit
              editable={editable}
              value={text}
              multiline
              numberOfLines={4}
              onBlur={() => setIsFocused(false)}
              onChangeText={handleChangeText}
              onFocus={() => setIsFocused(true)}
              onSelectionChange={selection =>
                handleSelectionChange(selection.start)
              }
              onSubmitEditing={handleSubmit}
              accessibilityLabel='Send a message'
              placeholder={placeholder ?? 'Send a message...'}
              placeholderTextColor={theme.color.textSecondary.dark}
              radius='lg'
              returnKeyType='send'
              /**
               * Drives the SwiftUI `.tint` so caret and selection follow the
               * accent; without it the caret falls back near-white.
               */
              selectionColor={accentHex}
              style={chatComposerStyles.input}
              submitBehavior='blurAndSubmit'
              variant='soft'
            />
          </View>

          {onPressAdd ? (
            <View style={chatComposerStyles.pillGlyphSlot}>
              <ComposerIconButton
                icon='face.smiling'
                iconSize={20}
                label='Open emote picker'
                onPress={onPressAdd}
                quiet
                size={COMPOSER_GLYPH_SIZE}
              />
            </View>
          ) : null}
        </View>

        {onSubmit ? (
          <ComposerIconButton
            disabled={!submitEnabled}
            icon='arrow.up'
            iconSize={16}
            label='Send message'
            onPress={handleSubmit}
            prominent
            prominentColor={accentHex ?? theme.colorViolet}
          />
        ) : null}
      </View>
    </View>
  );
}

export const ChatComposer = memo(ChatComposerComponent);
export type { ChatComposerHandle as InputRef };
