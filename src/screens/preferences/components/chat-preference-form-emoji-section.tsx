import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import type { Preferences } from '@app/store/preference-store';
import type { SanitisedEmote } from '@app/types/emote';
import { EMOJI_STYLE_OPTIONS } from '@app/utils/emoji/emoji-emotes';

import { hostPreview } from './chat-preference-form-host-preview';
import { EmojiStylePreview } from './chat-preference-preview-widgets';

interface ChatPreferenceFormEmojiSectionProps {
  emojiPreviewEmotes: SanitisedEmote[];
  preferences: Preferences;
  previewWidth: number;
  update: (payload: Partial<Preferences>) => void;
}

export function ChatPreferenceFormEmojiSection({
  emojiPreviewEmotes,
  preferences,
  previewWidth,
  update,
}: ChatPreferenceFormEmojiSectionProps) {
  return (
    <Section title='Emoji Style'>
      <Picker
        label='Emoji Set'
        systemImage='face.smiling'
        selection={preferences.emojiStyle}
        onSelectionChange={value => update({ emojiStyle: value })}
      >
        {EMOJI_STYLE_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
      {hostPreview(
        <EmojiStylePreview emotes={emojiPreviewEmotes} />,
        previewWidth,
      )}
    </Section>
  );
}
