import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import { ChatProviderPreferenceSections } from './ChatProviderPreferenceSections';
import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';
import {
  CONTEXT_TOGGLE_ROWS,
  DELETED_STYLE_LABELS,
  DENSITY_LABELS,
  FONT_SCALE_LABELS,
  HISTORICAL_RECENT_MESSAGES_EXPLAINER,
  SCROLLBACK_LABELS,
  TIMESTAMP_FORMAT_LABELS,
} from './chatPreferenceTypes';
import {
  DensityPreview,
  EmojiStylePreview,
  PreviewLabel,
  ProviderPreviewItem,
} from './ChatPreferencePreviewWidgets';
import type { useChatPreferenceScreenState } from './useChatPreferenceScreenState';

type ChatPreferenceScreenState = ReturnType<
  typeof useChatPreferenceScreenState
>;

type ChatPreferenceDefaultContentProps = ChatPreferenceScreenState;

export function ChatPreferenceDefaultContent({
  chatMentionHaptics,
  deletedStyleIndex,
  densityIndex,
  emojiIndex,
  fontScaleIndex,
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
  return (
    <>
      <SettingsSection title='Layout'>
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
              ? 'Tighter rows for faster scanning'
              : 'Roomier rows with more breathing space'
          }
          title='Message Density'
          values={DENSITY_LABELS}
        />
        <View style={styles.settingsPreviewItem}>
          <DensityPreview density={previewDensity} />
        </View>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'textformat.size',
            androidIcon: 'format_size',
            color: theme.colorAmber,
          }}
          onChange={handleFontScaleChange}
          onValueChange={handleFontScaleValueChange}
          selectedIndex={fontScaleIndex}
          subtitle='Scales message text, usernames, and mentions'
          title='Font Size'
          values={FONT_SCALE_LABELS}
        />
        <SettingsToggleRow
          title='Alternating Rows'
          subtitle='Add subtle striping between chat lines'
          icon={{
            icon: 'line.3.horizontal',
            androidIcon: 'menu',
            color: theme.colorBlue,
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

      <SettingsSection title='Emoji Style'>
        <ChatPreferenceSegmentedSettingsRow
          icon={{
            icon: 'face.smiling',
            androidIcon: 'sentiment_satisfied',
            color: theme.colorAmber,
          }}
          onChange={handleEmojiStyleChangeByIndex}
          onValueChange={handleEmojiStyleChange}
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
          subtitle={HISTORICAL_RECENT_MESSAGES_EXPLAINER}
          icon={{
            icon: 'clock.arrow.circlepath',
            androidIcon: 'history',
            color: theme.colorPrimary,
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
            color: theme.colorBlue,
          }}
          onChange={handleTimestampFormatChange}
          onValueChange={handleTimestampFormatValueChange}
          selectedIndex={timestampFormatIndex}
          subtitle='Applies to newly received messages'
          title='Timestamp Format'
          values={TIMESTAMP_FORMAT_LABELS}
        />
        <View style={styles.settingsPreviewItem}>
          <PreviewLabel />
          <View style={styles.previewSpacer}>
            <ChatPreferencePreview variant='context' value={previewContext} />
          </View>
        </View>
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
            color: theme.colorAmber,
          }}
          onPress={() => router.push('/tabs/settings/chat-highlights')}
        />
        <SettingsToggleRow
          title='Mention Feedback'
          subtitle='Buzz when a message mentions you or matches a highlight'
          icon={{
            icon: 'hand.tap',
            androidIcon: 'touch_app',
            color: theme.colorPrimary,
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
            color: theme.colorRed,
          }}
          onChange={handleDeletedStyleChange}
          onValueChange={handleDeletedStyleValueChange}
          selectedIndex={deletedStyleIndex}
          subtitle='How removed messages appear in chat'
          title='Deleted Messages'
          values={DELETED_STYLE_LABELS}
        />
        <SettingsToggleRow
          title='Keep History on Clear'
          subtitle='Ignore moderator chat clears and keep your scrollback'
          icon={{
            icon: 'clock.arrow.circlepath',
            androidIcon: 'history',
            color: theme.colorViolet,
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
          onChange={handleScrollbackChange}
          onValueChange={handleScrollbackValueChange}
          selectedIndex={scrollbackIndex}
          subtitle='Messages kept in chat history'
          title='Scrollback'
          values={SCROLLBACK_LABELS}
        />
      </SettingsSection>

      <ChatProviderPreferenceSections
        previewProviders={previewProviders}
        onProviderToggle={handleProviderToggle}
        ProviderPreviewItem={ProviderPreviewItem}
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
            color: theme.colorRed,
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
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: theme.space16,
  },
});
