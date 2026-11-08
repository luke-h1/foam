import { memo, type Ref, useCallback, useMemo, useRef } from 'react';
import { TextInput, type TextInputInstance, View } from 'react-native';

import { PressableScale } from 'pressto';

import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

import { chatComposerStyles as styles } from './ChatComposer.styles';
import { CommandSuggestionRail } from './CommandSuggestionRail';
import { ComposerOverflowButton } from './components/ComposerOverflowButton';
import { EmoteSuggestionRail } from './EmoteSuggestionRail';
import {
  type ChatComposerHandle,
  useChatComposerController,
} from './hooks/use-chat-composer-controller';
import { UserSuggestionRail } from './UserSuggestionRail';
import { buildComposerOverflowActions } from './util/buildComposerOverflowActions';

/**
 * 40% alpha: the highlight stays translucent under the glyphs while the caret
 * and handles take the solid accent, matching iOS's derived pair.
 */
const SELECTION_HIGHLIGHT_ALPHA = '66';

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
  const inputRef = useRef<TextInputInstance>(null);

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
      setSelection({
        start: cursor,
        end: cursor,
      });
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
    <View style={styles.mainContainer}>
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
            styles.characterCount,
            isOverLimit ? styles.characterCountOverLimit : undefined,
          ]}
        >
          {remainingCharacters}
        </Text>
      ) : null}

      <View style={styles.row}>
        <ComposerOverflowButton
          {...{ actions: overflowActions, busy: isUploadingImage }}
        />

        <View
          style={[styles.pill, isOverLimit ? styles.pillOverLimit : undefined]}
        >
          <TextInput
            ref={inputRef}
            autoCapitalize='none'
            autoComplete='off'
            autoCorrect={false}
            blurOnSubmit
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
            accessibilityLabel='Send a message'
            placeholder={placeholder ?? 'Send a message...'}
            placeholderTextColor={theme.color.textSecondary.dark}
            returnKeyType='send'
            cursorColor={theme.colorPrimary}
            selectionColor={`${theme.colorPrimary}${SELECTION_HIGHLIGHT_ALPHA}`}
            selectionHandleColor={theme.colorPrimary}
            style={[styles.input, styles.inputWrapper]}
            submitBehavior='blurAndSubmit'
            /**
             * Android: without this, landscape drops into the fullscreen IME
             * editor, covering the stream and chat.
             */
            disableFullscreenUI
            underlineColorAndroid='transparent'
          />

          {onPressAdd ? (
            <PressableScale
              accessibilityLabel='Open emote picker'
              accessibilityRole='button'
              style={styles.pillGlyphSlot}
              onPress={onPressAdd}
            >
              <SymbolView
                name='face.smiling'
                size={22}
                tintColor={theme.colorGreyHoverAlpha}
              />
            </PressableScale>
          ) : null}
        </View>

        {onSubmit ? (
          <PressableScale
            style={[
              styles.submitButton,
              {
                backgroundColor: submitEnabled
                  ? theme.colorPrimary
                  : theme.darkActiveContent,
              },
            ]}
            accessibilityLabel='Send message'
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
