import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { StyleSheet, View } from 'react-native';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import { ChatProviderPreferenceSections } from './ChatProviderPreferenceSections';
import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';
import {
  CONTEXT_TOGGLE_ROWS,
  DENSITY_LABELS,
  HISTORICAL_RECENT_MESSAGES_EXPLAINER,
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
  densityIndex,
  emojiIndex,
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
        <View style={styles.settingsPreviewItem}>
          <PreviewLabel />
          <View style={styles.previewSpacer}>
            <ChatPreferencePreview variant='context' value={previewContext} />
          </View>
        </View>
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
