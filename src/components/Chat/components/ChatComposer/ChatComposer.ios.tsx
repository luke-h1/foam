import { memo, type Ref, useCallback, useRef } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Input, type InputRef } from '@app/components/ui/Input/Input.ios';
import { useAccentColor } from '@app/context/AccentColorContext';
import { theme } from '@app/styles/themes';

import { ComposerIconButton } from '../ComposerIconButton';
import {
  COMPOSER_CONTROL_RADIUS,
  COMPOSER_INPUT_MIN_HEIGHT,
} from '../composerSizing';
import { chatComposerStyles } from './chatComposerStyles';
import { CommandSuggestionRail } from './CommandSuggestionRail';
import { EmoteSuggestionRail } from './EmoteSuggestionRail';
import {
  type ChatComposerHandle,
  useChatComposerController,
} from './useChatComposerController';
import { UserSuggestionRail } from './UserSuggestionRail';

export type { ChatComposerHandle };

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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const composerStyles = chatComposerStyles[scheme];
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
    ref,
    focusInput,
    blurInput,
    applyCursor: cursor => {
      void inputRef.current?.setSelection(cursor, cursor);
    },
  });

  return (
    <View style={composerStyles.mainContainer}>
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

      <View style={composerStyles.row}>
        {onPressAdd ? (
          <ComposerIconButton
            icon='face.smiling'
            iconSize={20}
            label={t('composer.openEmotePicker')}
            onPress={onPressAdd}
          />
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
            numberOfLines={4}
            onBlur={() => setIsFocused(false)}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onSelectionChange={selection =>
              handleSelectionChange(selection.start)
            }
            onSubmitEditing={handleSubmit}
            placeholder={placeholder ?? t('composer.sendAMessage')}
            placeholderTextColor={theme.color.textSecondary[scheme]}
            radius='xl'
            returnKeyType='send'
            style={[
              styles.input,
              { backgroundColor: theme.color.pressedOverlay[scheme] },
            ]}
            submitBehavior='blurAndSubmit'
            variant='soft'
          />
        </View>

        {onSubmit ? (
          <ComposerIconButton
            disabled={!submitEnabled}
            icon='arrow.up'
            iconSize={16}
            label={t('composer.sendMessage')}
            onPress={handleSubmit}
            prominent
            prominentColor={accentHex ?? theme.color.violet[scheme]}
          />
        ) : null}
      </View>
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
  input: {
    borderRadius: COMPOSER_CONTROL_RADIUS,
    borderWidth: 0,
    maxHeight: 120,
    minHeight: COMPOSER_INPUT_MIN_HEIGHT,
    paddingBottom: 12,
    paddingHorizontal: 10,
    paddingTop: 12,
  },
});
