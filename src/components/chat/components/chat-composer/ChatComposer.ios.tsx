import { memo, type Ref, useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { Input, type InputRef } from '@app/components/ui/input/Input';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

import { chatComposerStyles } from './ChatComposer.styles';
import { CommandSuggestionRail } from './CommandSuggestionRail';
import { ComposerIconButton } from './components/ComposerIconButton.ios';
import { ComposerOverflowButton } from './components/ComposerOverflowButton';
import { EmoteSuggestionRail } from './EmoteSuggestionRail';
import {
  type ChatComposerHandle,
  useChatComposerController,
} from './hooks/use-chat-composer-controller';
import { UserSuggestionRail } from './UserSuggestionRail';
import { buildComposerOverflowActions } from './util/buildComposerOverflowActions';
import { COMPOSER_GLYPH_SIZE } from './util/composerSizing';

export interface ChatComposerProps {
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onPressAdd?: () => void;
  onAttachImage?: () => void;
  onOpenSettings?: () => void;
  isUploadingImage?: boolean;
  placeholder?: string;
  canSend: boolean;
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
  placeholder,
  canSend,
  reservedCharacters,
  ref,
}: ChatComposerProps) {
  const inputRef = useRef<InputRef>(null);

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
          onSelect={handleEmotePress}
          searchTerm={wordInfo.searchTerm}
        />
      ) : null}
      {showUserRail ? (
        <UserSuggestionRail
          onSelect={handleUserSelect}
          searchTerm={wordInfo.searchTerm}
        />
      ) : null}
      {showCommandRail ? (
        <CommandSuggestionRail
          onSelect={handleCommandSelect}
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
          {...{ actions: overflowActions, busy: isUploadingImage }}
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
              selectionColor={theme.colorPrimary}
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
            prominentColor={theme.colorPrimary}
          />
        ) : null}
      </View>
    </View>
  );
}

export const ChatComposer = memo(ChatComposerComponent);
