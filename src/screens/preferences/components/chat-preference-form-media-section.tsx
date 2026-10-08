import { Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';

import type { Preferences } from '@app/store/preference-store';

import { hostPreview } from './chat-preference-form-host-preview';
import { ChatPreferencePreview } from './chat-preferences-preview';

export function ChatPreferenceFormMediaSection({
  preferences,
  previewWidth,
  update,
}: {
  preferences: Preferences;
  previewWidth: number;
  update: (payload: Partial<Preferences>) => void;
}) {
  return (
    <Section
      title='Media'
      footer={
        <NativeText>
          When on, animated Twitch, BTTV, FFZ, and 7TV emotes show as still
          images.
        </NativeText>
      }
    >
      <Toggle
        label='Disable Emote Animations'
        systemImage='slash.circle'
        isOn={preferences.disableEmoteAnimations}
        onIsOnChange={value => update({ disableEmoteAnimations: value })}
      />
      {hostPreview(
        <ChatPreferencePreview
          variant='emoteAnimations'
          value={preferences.disableEmoteAnimations}
        />,
        previewWidth,
      )}
    </Section>
  );
}
