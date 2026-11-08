import { Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';

import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_FOOTERS,
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
} from '../constants';
import { hostPreview } from './ChatPreferenceFormHostPreview';
import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatPreferenceFormMediaSection({
  previewWidth,
}: {
  previewWidth: number;
}) {
  const disableEmoteAnimations = usePreference('disableEmoteAnimations');
  const showChatGifs = usePreference('showChatGifs');

  return (
    <Section
      title={CHAT_PREFERENCE_SECTION_TITLES.media}
      footer={<NativeText>{CHAT_PREFERENCE_FOOTERS.media}</NativeText>}
    >
      <Toggle
        label={ROWS.disableEmoteAnimations.title}
        systemImage={ROWS.disableEmoteAnimations.icon}
        isOn={disableEmoteAnimations}
        onIsOnChange={value =>
          updatePreferences({ disableEmoteAnimations: value })
        }
      />
      {hostPreview(
        <ChatPreferencePreview
          variant='emoteAnimations'
          value={disableEmoteAnimations}
        />,
        previewWidth,
      )}
      <Toggle
        label={ROWS.showChatGifs.title}
        systemImage={ROWS.showChatGifs.icon}
        isOn={showChatGifs}
        onIsOnChange={value => updatePreferences({ showChatGifs: value })}
      />
    </Section>
  );
}
