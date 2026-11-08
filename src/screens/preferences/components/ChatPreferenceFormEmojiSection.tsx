import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { updatePreferences, usePreference } from '@app/store/preference-store';
import { EMOJI_STYLE_OPTIONS } from '@app/utils/emoji/emojiEmotes';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
} from '../constants';
import { getEmojiPreviewEmotes } from '../util/chatPreferenceOptions';
import { hostPreview } from './ChatPreferenceFormHostPreview';
import { EmojiStylePreview } from './ChatPreferencePreviewWidgets';

export function ChatPreferenceFormEmojiSection({
  previewWidth,
}: {
  previewWidth: number;
}) {
  const emojiStyle = usePreference('emojiStyle');

  return (
    <Section title={CHAT_PREFERENCE_SECTION_TITLES.emoji}>
      <Picker
        label={ROWS.emojiSet.title}
        systemImage={ROWS.emojiSet.icon}
        selection={emojiStyle}
        onSelectionChange={value => updatePreferences({ emojiStyle: value })}
      >
        {EMOJI_STYLE_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
      {hostPreview(
        <EmojiStylePreview emotes={getEmojiPreviewEmotes(emojiStyle)} />,
        previewWidth,
      )}
    </Section>
  );
}
