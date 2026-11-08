import { Picker, Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { DENSITY_OPTIONS } from '@app/constants/chat-preferences';
import { updatePreferences, usePreference } from '@app/store/preference-store';

import {
  CHAT_PREFERENCE_ROWS as ROWS,
  CHAT_PREFERENCE_SECTION_TITLES,
  FONT_SCALE_OPTIONS,
} from '../constants';
import { hostPreview } from './ChatPreferenceFormHostPreview';
import { DensityPreview } from './ChatPreferencePreviewWidgets';
import { ChatPreferencePreview } from './ChatPreferencesPreview';

export function ChatPreferenceFormLayoutSection({
  previewWidth,
}: {
  previewWidth: number;
}) {
  const chatDensity = usePreference('chatDensity');
  const chatFontScale = usePreference('chatFontScale');
  const showAlternatingChatRows = usePreference('showAlternatingChatRows');
  const animate = usePreference('animate');

  return (
    <Section title={CHAT_PREFERENCE_SECTION_TITLES.layout}>
      <Picker
        label={ROWS.density.title}
        systemImage={ROWS.density.icon}
        selection={chatDensity}
        onSelectionChange={value => updatePreferences({ chatDensity: value })}
      >
        {DENSITY_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
      {hostPreview(<DensityPreview density={chatDensity} />, previewWidth)}
      <Picker
        label={ROWS.fontScale.title}
        systemImage={ROWS.fontScale.icon}
        selection={chatFontScale}
        onSelectionChange={value => updatePreferences({ chatFontScale: value })}
      >
        {FONT_SCALE_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
      {hostPreview(
        <ChatPreferencePreview variant='fontScale' value={chatFontScale} />,
        previewWidth,
      )}
      <Toggle
        label={ROWS.alternatingRows.title}
        systemImage={ROWS.alternatingRows.icon}
        isOn={showAlternatingChatRows}
        onIsOnChange={value =>
          updatePreferences({ showAlternatingChatRows: value })
        }
      />
      {hostPreview(
        <ChatPreferencePreview
          variant='alternatingRows'
          value={showAlternatingChatRows}
        />,
        previewWidth,
      )}
      <Toggle
        label={ROWS.animate.title}
        systemImage={ROWS.animate.icon}
        isOn={animate}
        onIsOnChange={value => updatePreferences({ animate: value })}
      />
    </Section>
  );
}
