import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import { Text } from '@app/components/ui/text/Text';
import { updatePreferences, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import {
  CHAT_PREFERENCE_FOOTERS,
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
} from '../constants';
import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatPreferenceMediaSection() {
  const disableEmoteAnimations = usePreference('disableEmoteAnimations');
  const showChatGifs = usePreference('showChatGifs');

  return (
    <SettingsSection
      title={CHAT_PREFERENCE_SECTION_TITLES.media}
      footer={
        <Text color='gray.textLow' type='subhead'>
          {CHAT_PREFERENCE_FOOTERS.media}
        </Text>
      }
    >
      <SettingsToggleRow
        title={ROWS.disableEmoteAnimations.title}
        subtitle={ROWS.disableEmoteAnimations.subtitle}
        icon={ROWS.disableEmoteAnimations}
        value={disableEmoteAnimations}
        onValueChange={value =>
          updatePreferences({ disableEmoteAnimations: value })
        }
      />
      <View style={styles.settingsPreviewItem}>
        <ChatPreferencePreview
          variant='emoteAnimations'
          value={disableEmoteAnimations}
        />
      </View>
      <SettingsToggleRow
        title={ROWS.showChatGifs.title}
        subtitle={ROWS.showChatGifs.subtitle}
        icon={ROWS.showChatGifs}
        value={showChatGifs}
        onValueChange={value => updatePreferences({ showChatGifs: value })}
      />
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  settingsPreviewItem: {
    padding: theme.space16,
  },
});
