import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsSegmentedRow,
} from '@app/components/settings-section/SettingsSection';
import { updatePreferences, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import { EMOJI_STYLE_OPTIONS } from '@app/utils/emoji/emojiEmotes';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
} from '../constants';
import { getEmojiPreviewEmotes } from '../util/chatPreferenceOptions';
import { EmojiStylePreview } from './ChatPreferencePreviewWidgets';

export function ChatPreferenceEmojiSection() {
  const emojiStyle = usePreference('emojiStyle');

  return (
    <SettingsSection title={CHAT_PREFERENCE_SECTION_TITLES.emoji}>
      <SettingsSegmentedRow
        title={ROWS.emojiSet.title}
        subtitle={ROWS.emojiSet.subtitle}
        icon={ROWS.emojiSet}
        options={EMOJI_STYLE_OPTIONS}
        value={emojiStyle}
        onValueChange={value => updatePreferences({ emojiStyle: value })}
      />
      <View style={styles.settingsPreviewItem}>
        <EmojiStylePreview emotes={getEmojiPreviewEmotes(emojiStyle)} />
      </View>
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  settingsPreviewItem: {
    padding: theme.space16,
  },
});
