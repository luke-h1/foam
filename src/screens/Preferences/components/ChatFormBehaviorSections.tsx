import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Picker,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';

import { usePreferences } from '@app/store/preferences/selectors';
import { theme } from '@app/styles/themes';

import {
  CHAT_DELAY_OPTIONS,
  DELETED_STYLE_OPTIONS,
  SCROLLBACK_OPTIONS,
  TIMESTAMP_FORMAT_OPTIONS,
} from '../types/chatPreferenceTypes';
import { hostPreview } from './chatFormPreview';
import { PreviewLabel } from './ChatPreferencePreviewWidgets';
import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatFormBehaviorSections({
  previewWidth,
}: {
  previewWidth: number;
}) {
  const { t } = useTranslation('preferences');
  const preferences = usePreferences();
  const { update } = preferences;

  const contextPreview = {
    chatTimestamps: preferences.chatTimestamps,
    highlightOwnMentions: preferences.highlightOwnMentions,
    showInlineReplyContext: preferences.showInlineReplyContext,
    showUnreadJumpPill: preferences.showUnreadJumpPill,
  };

  return (
    <>
      <Section title={t('context')}>
        <Toggle
          label={t('historicalRecentMessages')}
          systemImage='clock.arrow.circlepath'
          isOn={preferences.showRecentMessages !== false}
          onIsOnChange={value => update({ showRecentMessages: value })}
        />
        <Toggle
          label={t('showTimestamps')}
          systemImage='clock'
          isOn={preferences.chatTimestamps}
          onIsOnChange={value => update({ chatTimestamps: value })}
        />
        <Toggle
          label={t('highlightOwnMentions')}
          systemImage='at'
          isOn={preferences.highlightOwnMentions}
          onIsOnChange={value => update({ highlightOwnMentions: value })}
        />
        <Toggle
          label={t('inlineReplyContext')}
          systemImage='arrowshape.turn.up.left'
          isOn={preferences.showInlineReplyContext}
          onIsOnChange={value => update({ showInlineReplyContext: value })}
        />
        <Toggle
          label={t('showJumpPill')}
          systemImage='arrow.down.circle'
          isOn={preferences.showUnreadJumpPill}
          onIsOnChange={value => update({ showUnreadJumpPill: value })}
        />
        <Picker
          label={t('timestampFormat')}
          systemImage='clock.badge'
          selection={preferences.chatTimestampFormat}
          onSelectionChange={value => update({ chatTimestampFormat: value })}
        >
          {TIMESTAMP_FORMAT_OPTIONS.map(option => (
            <NativeText key={option.value} modifiers={[tag(option.value)]}>
              {t(option.labelKey)}
            </NativeText>
          ))}
        </Picker>
        {hostPreview(
          <View>
            <PreviewLabel />
            <View style={styles.previewSpacer}>
              <ChatPreferencePreview variant='context' value={contextPreview} />
            </View>
          </View>,
          previewWidth,
        )}
      </Section>

      <Section
        title={t('sync')}
        footer={<NativeText>{t('syncFooter')}</NativeText>}
      >
        <Picker
          label={t('chatDelay')}
          systemImage='timer'
          selection={String(preferences.chatDelay)}
          onSelectionChange={value => {
            const option = CHAT_DELAY_OPTIONS.find(
              item => String(item.value) === value,
            );
            if (option) {
              update({ chatDelay: option.value });
            }
          }}
        >
          {CHAT_DELAY_OPTIONS.map(option => (
            // SwiftUI tag matching needs one type; the values mix 'auto'/'off' and numbers.
            <NativeText
              key={option.value}
              modifiers={[tag(String(option.value))]}
            >
              {t(option.labelKey)}
            </NativeText>
          ))}
        </Picker>
      </Section>

      <Section
        title={t('highlights')}
        footer={<NativeText>{t('highlightsFooter')}</NativeText>}
      >
        <Button
          label={t('highlightedPhrases')}
          systemImage='highlighter'
          onPress={() => router.push('/tabs/settings/chat-highlights')}
        />
        <Toggle
          label={t('mentionFeedback')}
          systemImage='hand.tap'
          isOn={preferences.chatMentionHaptics !== false}
          onIsOnChange={value => update({ chatMentionHaptics: value })}
        />
      </Section>

      <Section title={t('moderation')}>
        <Picker
          label={t('deletedMessages')}
          systemImage='trash.slash'
          selection={preferences.deletedMessageStyle}
          onSelectionChange={value => update({ deletedMessageStyle: value })}
        >
          {DELETED_STYLE_OPTIONS.map(option => (
            <NativeText key={option.value} modifiers={[tag(option.value)]}>
              {t(option.labelKey)}
            </NativeText>
          ))}
        </Picker>
        <Toggle
          label={t('keepHistoryOnClear')}
          systemImage='clock.arrow.circlepath'
          isOn={preferences.ignoreClearChat === true}
          onIsOnChange={value => update({ ignoreClearChat: value })}
        />
      </Section>

      <Section
        title={t('performance')}
        footer={<NativeText>{t('performanceFooter')}</NativeText>}
      >
        <Picker
          label={t('scrollback')}
          systemImage='text.line.last.and.arrowtriangle.forward'
          selection={preferences.chatScrollback}
          onSelectionChange={value => update({ chatScrollback: value })}
        >
          {SCROLLBACK_OPTIONS.map(option => (
            <NativeText key={option.value} modifiers={[tag(option.value)]}>
              {option.label}
            </NativeText>
          ))}
        </Picker>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  previewSpacer: {
    marginTop: theme.space8,
  },
});
