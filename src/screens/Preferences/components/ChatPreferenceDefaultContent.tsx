import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { useChatPreferenceScreenState } from '../hooks/useChatPreferenceScreenState';
import {
  CHAT_DELAY_OPTIONS,
  CONTEXT_TOGGLE_ROWS,
  DELETED_STYLE_OPTIONS,
  DENSITY_OPTIONS,
  FONT_SCALE_OPTIONS,
  SCROLLBACK_LABELS,
  TIMESTAMP_FORMAT_OPTIONS,
} from '../types/chatPreferenceTypes';
import {
  DensityPreview,
  EmojiStylePreview,
  PreviewLabel,
} from './ChatPreferencePreviewWidgets';
import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import { ChatProviderPreferenceSections } from './ChatProviderPreferenceSections';

export function ChatPreferenceDefaultContent() {
  const {
    animate,
    chatDelayIndex,
    chatMentionHaptics,
    deletedStyleIndex,
    densityIndex,
    emojiIndex,
    fontScaleIndex,
    previewFontScale,
    handleChatDelayChange,
    handleDeletedStyleChange,
    handleFontScaleChange,
    handleScrollbackChange,
    handleTimestampFormatChange,
    ignoreClearChat,
    scrollbackIndex,
    timestampFormatIndex,
    emojiLabels,
    emojiPreviewEmotes,
    handleAlternatingRowsToggle,
    handleContextToggle,
    handleDensityChange,
    handleDisableEmoteAnimationsToggle,
    handleEmojiStyleChange,
    handleProviderToggle,
    previewAlternatingRows,
    previewContext,
    previewDensity,
    previewDisableEmoteAnimations,
    previewProviders,
    showRecentMessages,
    update,
  } = useChatPreferenceScreenState();
  const { t } = useTranslation('preferences');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <>
      <SettingsSection title={t('layout')}>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'list.bullet',
            androidIcon: 'format_list_bulleted',
            color: theme.color.textSecondary[scheme],
          }}
          onSelectIndex={handleDensityChange}
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
            color: theme.color.textSecondary[scheme],
          }}
          onSelectIndex={handleFontScaleChange}
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
            color: theme.color.textSecondary[scheme],
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
        <SettingsToggleRow
          title={t('newMessageAnimation')}
          subtitle={t('newMessageAnimationDescription')}
          icon={{
            icon: 'arrow.up.message',
            androidIcon: 'animation',
            color: theme.color.textSecondary[scheme],
          }}
          value={animate}
          onValueChange={value => update({ animate: value })}
        />
      </SettingsSection>

      <SettingsSection title={t('emojiStyle')}>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'face.smiling',
            androidIcon: 'sentiment_satisfied',
            color: theme.color.textSecondary[scheme],
          }}
          onSelectIndex={handleEmojiStyleChange}
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
            color: theme.color.textSecondary[scheme],
          }}
          value={showRecentMessages !== false}
          onValueChange={value => update({ showRecentMessages: value })}
        />
        {CONTEXT_TOGGLE_ROWS.map(row => (
          <SettingsToggleRow
            key={row.key}
            title={t(row.labelKey)}
            subtitle={t(row.subtitleKey)}
            icon={{ ...row.icon, color: theme.color.textSecondary[scheme] }}
            value={previewContext[row.key]}
            onValueChange={value => handleContextToggle(row.key, value)}
          />
        ))}
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'clock.badge',
            androidIcon: 'schedule',
            color: theme.color.textSecondary[scheme],
          }}
          onSelectIndex={handleTimestampFormatChange}
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
            color: theme.color.textSecondary[scheme],
          }}
          onSelectIndex={handleChatDelayChange}
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
            color: theme.color.textSecondary[scheme],
          }}
          onPress={() => router.push('/tabs/settings/chat-highlights')}
        />
        <SettingsToggleRow
          title={t('mentionFeedback')}
          subtitle={t('mentionFeedbackDescription')}
          icon={{
            icon: 'hand.tap',
            androidIcon: 'touch_app',
            color: theme.color.textSecondary[scheme],
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
            color: theme.color.textSecondary[scheme],
          }}
          onSelectIndex={handleDeletedStyleChange}
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
            color: theme.color.textSecondary[scheme],
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
            color: theme.color.textSecondary[scheme],
          }}
          onSelectIndex={handleScrollbackChange}
          selectedIndex={scrollbackIndex}
          subtitle={t('scrollbackDescription')}
          title={t('scrollback')}
          values={SCROLLBACK_LABELS}
        />
      </SettingsSection>

      <ChatProviderPreferenceSections
        previewProviders={previewProviders}
        onProviderToggle={handleProviderToggle}
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
            color: theme.color.textSecondary[scheme],
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
