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
          Chat GIFs load third-party media via Twitch. With animations off,
          animated emotes and chat GIFs show as still frames.
        </NativeText>
      }
    >
      <Toggle
        label='Show Chat GIFs'
        systemImage='photo.on.rectangle.angled'
        isOn={preferences.showChatGifs}
        onIsOnChange={value => update({ showChatGifs: value })}
      />
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
