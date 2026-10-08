import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/settings-section';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

import { ChatPreferencePreview } from './chat-preferences-preview';

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
        <Text color='gray.textLow' type='subhead'>
          When on, animated Twitch, BTTV, FFZ, and 7TV emotes show as still
          images.
        </Text>
      }
    >
      <SettingsToggleRow
        title='Disable Emote Animations'
        subtitle='Show emotes as still images'
        icon={{
          icon: 'slash.circle',
          androidIcon: 'block',
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
