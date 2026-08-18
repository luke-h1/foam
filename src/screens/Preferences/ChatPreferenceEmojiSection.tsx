import { StyleSheet, View } from 'react-native';

import { SettingsSection } from '@app/components/SettingsSection/SettingsSection';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';

import { EmojiStylePreview } from './ChatPreferencePreviewWidgets';
import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';

export function ChatPreferenceEmojiSection({
  emojiIndex,
  emojiLabels,
  emojiPreviewEmotes,
  handleEmojiStyleChange,
}: {
  emojiIndex: number;
  emojiLabels: string[];
  emojiPreviewEmotes: SanitisedEmote[];
  handleEmojiStyleChange: (index: number) => void;
}) {
  return (
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
  );
}

const styles = StyleSheet.create({
  settingsPreviewItem: {
    padding: theme.space16,
  },
});
