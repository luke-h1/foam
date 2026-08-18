import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import type { Preferences } from '@app/store/preferenceStore';
import type { SanitisedEmote } from '@app/types/emote';
import { EMOJI_STYLE_OPTIONS } from '@app/utils/emoji/emojiEmotes';

import { hostPreview } from './chatPreferenceFormHostPreview';
import { EmojiStylePreview } from './ChatPreferencePreviewWidgets';

export function ChatPreferenceFormEmojiSection({
  emojiPreviewEmotes,
  preferences,
  previewWidth,
  update,
}: {
  emojiPreviewEmotes: SanitisedEmote[];
  preferences: Preferences;
  previewWidth: number;
  update: (payload: Partial<Preferences>) => void;
}) {
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
