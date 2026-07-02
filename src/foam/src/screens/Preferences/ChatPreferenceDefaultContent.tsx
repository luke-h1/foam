import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import {
  DensityPreview,
  EmojiStylePreview,
  PreviewLabel,
  ProviderPreviewItem,
} from './ChatPreferencePreviewWidgets';
import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import {
  CHAT_DELAY_OPTIONS,
  CONTEXT_TOGGLE_ROWS,
  DELETED_STYLE_OPTIONS,
  DENSITY_OPTIONS,
  FONT_SCALE_OPTIONS,
  SCROLLBACK_LABELS,
  TIMESTAMP_FORMAT_OPTIONS,
} from './chatPreferenceTypes';
import { ChatProviderPreferenceSections } from './ChatProviderPreferenceSections';
import type { useChatPreferenceScreenState } from './useChatPreferenceScreenState';

type ChatPreferenceScreenState = ReturnType<
  typeof useChatPreferenceScreenState
>;

type ChatPreferenceDefaultContentProps = ChatPreferenceScreenState;

export function ChatPreferenceDefaultContent({
  chatDelayIndex,
  chatMentionHaptics,
  deletedStyleIndex,
  densityIndex,
  emojiIndex,
  fontScaleIndex,
  previewFontScale,
  handleChatDelayChange,
  handleChatDelayValueChange,
  handleDeletedStyleChange,
  handleDeletedStyleValueChange,
  handleFontScaleChange,
  handleFontScaleValueChange,
  handleScrollbackChange,
  handleScrollbackValueChange,
  handleTimestampFormatChange,
  handleTimestampFormatValueChange,
  ignoreClearChat,
  scrollbackIndex,
  timestampFormatIndex,
  emojiLabels,
  emojiPreviewEmotes,
  handleAlternatingRowsToggle,
  handleContextToggle,
  handleDensityChange,
  handleDensityValueChange,
  handleDisableEmoteAnimationsToggle,
  handleEmojiStyleChange,
  handleEmojiStyleChangeByIndex,
  handleProviderToggle,
  previewAlternatingRows,
  previewContext,
  previewDensity,
  previewDisableEmoteAnimations,
  previewProviders,
  showRecentMessages,
  update,
}: ChatPreferenceDefaultContentProps) {
  const { t } = useTranslation('preferences');

  return (
    <>
      <SettingsSection title={t('layout')}>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'list.bullet',
            androidIcon: 'format_list_bulleted',
            color: theme.colorGrey,
          }}
          onChange={handleDensityChange}
          onValueChange={handleDensityValueChange}
          selectedIndex={densityIndex}
          subtitle={
            previewDensity === 'compact'
              ? t('densityCompactDescription')
              : t('densityComfortableDescription')
          }
          title={t('messageDensity')}
          values={DENSITY_OPTIONS.map(option => t(option.labelKey))}
        />
        <View style={styles.settingsPreviewItem}>
          <DensityPreview density={previewDensity} />
        </View>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'textformat.size',
            androidIcon: 'format_size',
            color: theme.colorGrey,
          }}
          onChange={handleFontScaleChange}
          onValueChange={handleFontScaleValueChange}
          selectedIndex={fontScaleIndex}
          subtitle={t('fontSizeDescription')}
          title={t('fontSize')}
          values={FONT_SCALE_OPTIONS.map(option => t(option.labelKey))}
        />
        <View style={styles.settingsPreviewItem}>
          <ChatPreferencePreview variant='fontScale' value={previewFontScale} />
        </View>
        <SettingsToggleRow
          title={t('alternatingRows')}
          subtitle={t('alternatingRowsDescription')}
          icon={{
            icon: 'line.3.horizontal',
            androidIcon: 'menu',
            color: theme.colorGrey,
          }}
          value={previewAlternatingRows}
          onValueChange={handleAlternatingRowsToggle}
        />
        <View style={styles.settingsPreviewItem}>
          <ChatPreferencePreview
            variant='alternatingRows'
            value={previewAlternatingRows}
          />
        </View>
      </SettingsSection>

      <SettingsSection title={t('emojiStyle')}>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'face.smiling',
            androidIcon: 'sentiment_satisfied',
            color: theme.colorGrey,
          }}
          onChange={handleEmojiStyleChangeByIndex}
          onValueChange={handleEmojiStyleChange}
          selectedIndex={emojiIndex}
          subtitle={t('emojiSetDescription')}
          title={t('emojiSet')}
          values={emojiLabels}
        />
        <View style={styles.settingsPreviewItem}>
          <EmojiStylePreview emotes={emojiPreviewEmotes} />
        </View>
      </SettingsSection>

      <SettingsSection title={t('context')}>
        <SettingsToggleRow
          title={t('historicalRecentMessages')}
          subtitle={t('historicalRecentMessagesDescription')}
          icon={{
            icon: 'clock.arrow.circlepath',
            androidIcon: 'history',
            color: theme.colorGrey,
          }}
          value={showRecentMessages !== false}
          onValueChange={value => update({ showRecentMessages: value })}
        />
        {CONTEXT_TOGGLE_ROWS.map(row => (
          <SettingsToggleRow
            key={row.key}
            title={t(row.labelKey)}
            subtitle={t(row.subtitleKey)}
            icon={row.icon}
            value={previewContext[row.key]}
            onValueChange={value => handleContextToggle(row.key, value)}
          />
        ))}
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'clock.badge',
            androidIcon: 'schedule',
            color: theme.colorGrey,
          }}
          onChange={handleTimestampFormatChange}
          onValueChange={handleTimestampFormatValueChange}
          selectedIndex={timestampFormatIndex}
          subtitle={t('timestampFormatDescription')}
          title={t('timestampFormat')}
          values={TIMESTAMP_FORMAT_OPTIONS.map(option => t(option.labelKey))}
        />
        <View style={styles.settingsPreviewItem}>
          <PreviewLabel />
          <View style={styles.previewSpacer}>
            <ChatPreferencePreview variant='context' value={previewContext} />
          </View>
        </View>
      </SettingsSection>

      <SettingsSection
        title={t('sync')}
        footer={
          <Text color='gray.textLow' type='xs'>
            {t('syncFooter')}
          </Text>
        }
      >
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'timer',
            androidIcon: 'timer',
            color: theme.colorGrey,
          }}
          onChange={handleChatDelayChange}
          onValueChange={handleChatDelayValueChange}
          selectedIndex={chatDelayIndex}
          subtitle={t('chatDelayDescription')}
          title={t('chatDelay')}
          values={CHAT_DELAY_OPTIONS.map(option => t(option.labelKey))}
        />
      </SettingsSection>

      <SettingsSection
        title={t('highlights')}
        footer={
          <Text color='gray.textLow' type='xs'>
            {t('highlightsFooter')}
          </Text>
        }
      >
        <SettingsLinkRow
          title={t('highlightedPhrases')}
          subtitle={t('highlightedPhrasesDescription')}
          icon={{
            icon: 'highlighter',
            androidIcon: 'edit',
            color: theme.colorGrey,
          }}
          onPress={() => router.push('/tabs/settings/chat-highlights')}
        />
        <SettingsToggleRow
          title={t('mentionFeedback')}
          subtitle={t('mentionFeedbackDescription')}
          icon={{
            icon: 'hand.tap',
            androidIcon: 'touch_app',
            color: theme.colorGrey,
          }}
          value={chatMentionHaptics !== false}
          onValueChange={value => update({ chatMentionHaptics: value })}
        />
      </SettingsSection>

      <SettingsSection title={t('moderation')}>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'trash.slash',
            androidIcon: 'delete',
            color: theme.colorGrey,
          }}
          onChange={handleDeletedStyleChange}
          onValueChange={handleDeletedStyleValueChange}
          selectedIndex={deletedStyleIndex}
          subtitle={t('deletedMessagesDescription')}
          title={t('deletedMessages')}
          values={DELETED_STYLE_OPTIONS.map(option => t(option.labelKey))}
        />
        <SettingsToggleRow
          title={t('keepHistoryOnClear')}
          subtitle={t('keepHistoryOnClearDescription')}
          icon={{
            icon: 'clock.arrow.circlepath',
            androidIcon: 'history',
            color: theme.colorGrey,
          }}
          value={ignoreClearChat === true}
          onValueChange={value => update({ ignoreClearChat: value })}
        />
      </SettingsSection>

      <SettingsSection
        title={t('performance')}
        footer={
          <Text color='gray.textLow' type='xs'>
            {t('performanceFooter')}
          </Text>
        }
      >
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'text.line.last.and.arrowtriangle.forward',
            androidIcon: 'sort',
            color: theme.colorGrey,
          }}
          onChange={handleScrollbackChange}
          onValueChange={handleScrollbackValueChange}
          selectedIndex={scrollbackIndex}
          subtitle={t('scrollbackDescription')}
          title={t('scrollback')}
          values={SCROLLBACK_LABELS}
        />
      </SettingsSection>

      <ChatProviderPreferenceSections
        previewProviders={previewProviders}
        onProviderToggle={handleProviderToggle}
        ProviderPreviewItem={ProviderPreviewItem}
      />

      <SettingsSection
        title={t('media')}
        footer={
          <Text color='gray.textLow' type='xs'>
            {t('mediaFooter')}
          </Text>
        }
      >
        <SettingsToggleRow
          title={t('disableEmoteAnimations')}
          subtitle={t('disableEmoteAnimationsDescription')}
          icon={{
            icon: 'slash.circle',
            androidIcon: 'block',
            color: theme.colorGrey,
          }}
          value={previewDisableEmoteAnimations}
          onValueChange={handleDisableEmoteAnimationsToggle}
        />
        <View style={styles.settingsPreviewItem}>
          <ChatPreferencePreview
            variant='emoteAnimations'
            value={previewDisableEmoteAnimations}
          />
        </View>
      </SettingsSection>
    </>
  );
}

const styles = StyleSheet.create({
  previewSpacer: {
    marginTop: theme.space8,
  },
  settingsPreviewItem: {
    padding: theme.space16,
  },
});
