import { Picker, Section, Text as NativeText, Toggle } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import type { Preferences } from '@app/store/preferenceStore';

import { hostPreview } from './chatPreferenceFormHostPreview';
import { DensityPreview } from './ChatPreferencePreviewWidgets';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import { DENSITY_OPTIONS, FONT_SCALE_OPTIONS } from './chatPreferenceTypes';

export function ChatPreferenceFormLayoutSection({
  preferences,
  previewWidth,
  update,
}: {
  preferences: Preferences;
  previewWidth: number;
  update: (payload: Partial<Preferences>) => void;
}) {
  return (
    <Section title='Layout'>
      <Picker
        label='Message Density'
        systemImage='list.bullet'
        selection={preferences.chatDensity}
        onSelectionChange={value => update({ chatDensity: value })}
      >
        {DENSITY_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </NativeText>
        ))}
      </Picker>
      {hostPreview(
        <DensityPreview density={preferences.chatDensity} />,
        previewWidth,
      )}
      <Picker
        label='Font Size'
        systemImage='textformat.size'
        selection={preferences.chatFontScale}
        onSelectionChange={value => update({ chatFontScale: value })}
      >
        {FONT_SCALE_OPTIONS.map(option => (
          <NativeText key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
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
        label='Alternating Rows'
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
        label='New Message Animation'
        systemImage='arrow.up.message'
        isOn={preferences.animate}
        onIsOnChange={value => update({ animate: value })}
      />
    </Section>
  );
}
