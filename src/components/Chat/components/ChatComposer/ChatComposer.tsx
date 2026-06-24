import { memo, type Ref, useCallback, useRef } from 'react';
import { TextInput, type TextInput as TextInputType, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PressableScale } from 'pressto';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { useAccentColor } from '@app/context/AccentColorContext';
import { theme } from '@app/styles/themes';

import { chatComposerStyles as styles } from './chatComposerStyles';
import { EmoteSuggestionRail } from './EmoteSuggestionRail';
import {
  type ChatComposerHandle,
  useChatComposerController,
} from './useChatComposerController';
import { UserSuggestionRail } from './UserSuggestionRail';

export type { ChatComposerHandle };
export type { SuggestionType } from './chatComposerTypes';

export interface ChatComposerProps {
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onPressAdd?: () => void;
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
  maxSuggestions = 50,
  prioritizeChannelEmotes = true,
  placeholder,
  editable = true,
  canSend,
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
    wordInfo,
    submitEnabled,
    handleChangeText,
    handleSelectionChange,
    handleSubmit,
    handleEmotePress,
    handleUserSelect,
  } = useChatComposerController({
    onChangeText,
    onSubmit,
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
