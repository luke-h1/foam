import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Picker, Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { usePreferences } from '@app/store/preferences/selectors';
import {
  EMOJI_STYLE_OPTIONS,
  getEmojiEmotes,
} from '@app/utils/emoji/emojiEmotes';

import {
  DENSITY_OPTIONS,
  EMOJI_PREVIEW_SHORTCODES,
  FONT_SCALE_OPTIONS,
} from '../types/chatPreferenceTypes';
import { hostPreview } from './chatFormPreview';
import {
  DensityPreview,
  EmojiStylePreview,
} from './ChatPreferencePreviewWidgets';
import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatFormLayoutSections({
  previewWidth,
}: {
  previewWidth: number;
}) {
  const { t } = useTranslation('preferences');
  const preferences = usePreferences();
  const { update } = preferences;

  const emojiPreviewEmotes = useMemo(() => {
    const emotes = getEmojiEmotes(preferences.emojiStyle);
    const preview = EMOJI_PREVIEW_SHORTCODES.flatMap(shortcode => {
      const emote = emotes.find(item => item.name === shortcode);
      return emote ? [emote] : [];
    });
    return preview.length > 0 ? preview : emotes.slice(0, 3);
  }, [preferences.emojiStyle]);

  return (
    <>
      <Section title={t('layout')}>
        <Picker
          label={t('messageDensity')}
          systemImage='list.bullet'
          selection={preferences.chatDensity}
          onSelectionChange={value => update({ chatDensity: value })}
        >
          {DENSITY_OPTIONS.map(option => (
            <NativeText key={option.value} modifiers={[tag(option.value)]}>
              {t(option.labelKey)}
            </NativeText>
          ))}
        </Picker>
        {hostPreview(
          <DensityPreview density={preferences.chatDensity} />,
          previewWidth,
        )}
        <Picker
          label={t('fontSize')}
          systemImage='textformat.size'
          selection={preferences.chatFontScale}
          onSelectionChange={value => update({ chatFontScale: value })}
        >
          {FONT_SCALE_OPTIONS.map(option => (
            <NativeText key={option.value} modifiers={[tag(option.value)]}>
              {t(option.labelKey)}
            </NativeText>
          ))}
        </Picker>
        {hostPreview(
          <ChatPreferencePreview
            variant='fontScale'
            value={preferences.chatFontScale}
          />,
          previewWidth,
        )}
        <Toggle
          label={t('alternatingRows')}
          systemImage='line.3.horizontal'
          isOn={preferences.showAlternatingChatRows}
          onIsOnChange={value => update({ showAlternatingChatRows: value })}
        />
        {hostPreview(
          <ChatPreferencePreview
            variant='alternatingRows'
            value={preferences.showAlternatingChatRows}
          />,
          previewWidth,
        )}
        <Toggle
          label={t('newMessageAnimation')}
          systemImage='arrow.up.message'
          isOn={preferences.animate}
          onIsOnChange={value => update({ animate: value })}
        />
      </Section>

      <Section title={t('emojiStyle')}>
        <Picker
          label={t('emojiSet')}
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
    </>
  );
}
