import { StyleSheet, View } from 'react-native';

import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/settings-section';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

import { ChatPreferencePreview } from './chat-preferences-preview';

interface ChatPreferenceMediaSectionProps {
  handleDisableEmoteAnimationsToggle: (value: boolean) => void;
  handleShowChatGifsToggle: (value: boolean) => void;
  previewDisableEmoteAnimations: boolean;
  previewShowChatGifs: boolean;
}

export function ChatPreferenceMediaSection({
  handleDisableEmoteAnimationsToggle,
  previewDisableEmoteAnimations,
  handleShowChatGifsToggle,
  previewShowChatGifs,
}: ChatPreferenceMediaSectionProps) {
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
      <SettingsToggleRow
        title='Show Chat GIFs'
        subtitle='Loads third-party GIF media'
        icon={{
          icon: 'photo.on.rectangle.angled',
          androidIcon: 'gif_box',
        }}
        value={previewShowChatGifs}
        onValueChange={handleShowChatGifsToggle}
      />
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  settingsPreviewItem: {
    padding: theme.space16,
  },
});
