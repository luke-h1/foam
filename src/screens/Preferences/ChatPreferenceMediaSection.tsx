import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatPreferenceMediaSection({
  handleDisableEmoteAnimationsToggle,
  previewDisableEmoteAnimations,
}: {
  handleDisableEmoteAnimationsToggle: (value: boolean) => void;
  previewDisableEmoteAnimations: boolean;
}) {
  return (
    <SettingsSection
      title='Media'
      footer={
        <Text color='gray.textLow' type='xs'>
          Animated Twitch, BTTV, FFZ, and 7TV emotes will render as still images
          when this is enabled.
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
  );
}

const styles = StyleSheet.create({
  settingsPreviewItem: {
    padding: theme.space16,
  },
});
