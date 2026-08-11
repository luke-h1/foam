import { Platform } from 'react-native';

import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { SettingsSection } from '@app/components/SettingsSection/SettingsSection';
import { ChatPreferenceSegmentedSettingsRow } from '@app/screens/Preferences/ChatPreferenceSettingsRows';
import {
  type SevenTvPaintRenderer,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { isDevToolsEnabled } from '@app/utils/devTools/isDevToolsEnabled';

const PAINT_RENDERER_OPTIONS = [
  { label: 'Off', value: 'off' },
  { label: 'Native', value: 'native' },
  { label: 'Skia', value: 'skia' },
  { label: 'WebView', value: 'webview' },
] as const satisfies readonly {
  label: string;
  value: SevenTvPaintRenderer;
}[];

function isPaintRenderer(value: string): value is SevenTvPaintRenderer {
  return PAINT_RENDERER_OPTIONS.some(option => option.value === value);
}

export function PaintRendererSection() {
  const sevenTvPaintRenderer = usePreference('sevenTvPaintRenderer');
  const update = useUpdatePreferences();

  if (!isDevToolsEnabled) {
    return null;
  }

  if (Platform.OS === 'ios') {
    return (
      <Section
        title='7TV Paint Renderer'
        footer={
          <NativeText>
            Choose the username paint renderer. Off renders default name
            colours; WebView is a dev-only reference.
          </NativeText>
        }
      >
        <Picker
          label='7TV Paint Renderer'
          systemImage='paintbrush.fill'
          selection={sevenTvPaintRenderer}
          onSelectionChange={value => {
            if (isPaintRenderer(value)) {
              update({ sevenTvPaintRenderer: value });
            }
          }}
        >
          {PAINT_RENDERER_OPTIONS.map(option => (
            <NativeText key={option.value} modifiers={[tag(option.value)]}>
              {option.label}
            </NativeText>
          ))}
        </Picker>
      </Section>
    );
  }

  const selectedIndex = PAINT_RENDERER_OPTIONS.findIndex(
    option => option.value === sevenTvPaintRenderer,
  );

  return (
    <SettingsSection title='7TV Paint Renderer'>
      <ChatPreferenceSegmentedSettingsRow
        title='7TV Paint Renderer'
        subtitle='Choose the username paint renderer. Off renders default name colours; WebView is a dev-only reference.'
        icon={{ icon: 'paintbrush.fill', color: theme.colorPlum }}
        onSelectIndex={index => {
          const next = PAINT_RENDERER_OPTIONS[index]?.value;
          if (next) {
            update({ sevenTvPaintRenderer: next });
          }
        }}
        selectedIndex={selectedIndex}
        values={PAINT_RENDERER_OPTIONS.map(option => option.label)}
      />
    </SettingsSection>
  );
}
