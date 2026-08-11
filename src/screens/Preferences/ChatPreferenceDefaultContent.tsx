import { StyleSheet, View } from 'react-native';

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
import { useChatPreferenceScreenState } from './useChatPreferenceScreenState';

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

  return (
    <>
      <SettingsSection title='Layout'>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'list.bullet',
            androidIcon: 'format_list_bulleted',
            color: theme.colorGrey,
          }}
          onSelectIndex={handleDensityChange}
          selectedIndex={densityIndex}
          subtitle={
            previewDensity === 'compact'
              ? 'Tighter rows for faster scanning'
              : 'Roomier rows with more breathing space'
          }
          title='Message Density'
          values={DENSITY_OPTIONS.map(option => option.label)}
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
          onSelectIndex={handleFontScaleChange}
          selectedIndex={fontScaleIndex}
          subtitle='Scales message text, usernames, and mentions'
          title='Font Size'
          values={FONT_SCALE_OPTIONS.map(option => option.label)}
        />
        <View style={styles.settingsPreviewItem}>
          <ChatPreferencePreview variant='fontScale' value={previewFontScale} />
        </View>
        <SettingsToggleRow
          title='Alternating Rows'
          subtitle='Add subtle striping between chat lines'
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
        <SettingsToggleRow
          title='New Message Animation'
          subtitle='Slide new messages into view as they arrive'
          icon={{
            icon: 'arrow.up.message',
            androidIcon: 'animation',
            color: theme.colorGrey,
          }}
          value={animate}
          onValueChange={value => update({ animate: value })}
        />
      </SettingsSection>

      <SettingsSection title='Emoji Style'>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'face.smiling',
            androidIcon: 'sentiment_satisfied',
            color: theme.colorGrey,
          }}
          onSelectIndex={handleEmojiStyleChange}
          selectedIndex={emojiIndex}
          subtitle='Changes emoji images in existing chat messages'
          title='Emoji Set'
          values={emojiLabels}
        />
        <View style={styles.settingsPreviewItem}>
          <EmojiStylePreview emotes={emojiPreviewEmotes} />
        </View>
      </SettingsSection>

      <SettingsSection title='Context'>
        <SettingsToggleRow
          title='Historical Recent Messages'
          subtitle='Loads historical recent messages in chat through the third-party API service at recent-messages.robotty.de.'
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
            title={row.label}
            subtitle={row.subtitle}
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
          onSelectIndex={handleTimestampFormatChange}
          selectedIndex={timestampFormatIndex}
          subtitle='Applies to newly received messages'
          title='Timestamp Format'
          values={TIMESTAMP_FORMAT_OPTIONS.map(option => option.label)}
        />
        <View style={styles.settingsPreviewItem}>
          <PreviewLabel />
          <View style={styles.previewSpacer}>
            <ChatPreferencePreview variant='context' value={previewContext} />
          </View>
        </View>
      </SettingsSection>

      <SettingsSection
        title='Sync'
        footer={
          <Text color='gray.textLow' type='xs'>
            Delay chat so it lines up with the video. Auto matches the measured
            stream latency.
          </Text>
        }
      >
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'timer',
            androidIcon: 'timer',
            color: theme.colorGrey,
          }}
          onSelectIndex={handleChatDelayChange}
          selectedIndex={chatDelayIndex}
          subtitle='Hold new messages before showing them'
          title='Chat Delay'
          values={CHAT_DELAY_OPTIONS.map(option => option.label)}
        />
      </SettingsSection>

      <SettingsSection
        title='Highlights'
        footer={
          <Text color='gray.textLow' type='xs'>
            Highlighted phrases tint matching messages. Mention feedback also
            buzzes when a highlight matches.
          </Text>
        }
      >
        <SettingsLinkRow
          title='Highlighted Phrases'
          subtitle='Tint messages containing custom phrases'
          icon={{
            icon: 'highlighter',
            androidIcon: 'edit',
            color: theme.colorGrey,
          }}
          onPress={() => router.push('/tabs/settings/chat-highlights')}
        />
        <SettingsToggleRow
          title='Mention Feedback'
          subtitle='Buzz when a message mentions you or matches a highlight'
          icon={{
            icon: 'hand.tap',
            androidIcon: 'touch_app',
            color: theme.colorGrey,
          }}
          value={chatMentionHaptics !== false}
          onValueChange={value => update({ chatMentionHaptics: value })}
        />
      </SettingsSection>

      <SettingsSection title='Moderation'>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'trash.slash',
            androidIcon: 'delete',
            color: theme.colorGrey,
          }}
          onSelectIndex={handleDeletedStyleChange}
          selectedIndex={deletedStyleIndex}
          subtitle='How removed messages appear in chat'
          title='Deleted Messages'
          values={DELETED_STYLE_OPTIONS.map(option => option.label)}
        />
        <SettingsToggleRow
          title='Keep History on Clear'
          subtitle='Ignore moderator chat clears and keep your scrollback'
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
        title='Performance'
        footer={
          <Text color='gray.textLow' type='xs'>
            Longer scrollback keeps more messages in memory; 200 is easier on
            older devices.
          </Text>
        }
      >
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'text.line.last.and.arrowtriangle.forward',
            androidIcon: 'sort',
            color: theme.colorGrey,
          }}
          onSelectIndex={handleScrollbackChange}
          selectedIndex={scrollbackIndex}
          subtitle='Messages kept in chat history'
          title='Scrollback'
          values={SCROLLBACK_LABELS}
        />
      </SettingsSection>

      <ChatProviderPreferenceSections
        previewProviders={previewProviders}
        onProviderToggle={handleProviderToggle}
      />

      <SettingsSection
        title='Media'
        footer={
          <Text color='gray.textLow' type='xs'>
            Animated Twitch, BTTV, FFZ, and 7TV emotes will render as still
            images when this is enabled.
          </Text>
        }
      >
        <SettingsToggleRow
          title='Disable Emote Animations'
          subtitle='Prefer static emote rendering'
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
