import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  { labelKey: 'paintRendererOff', value: 'off' },
  { labelKey: 'paintRendererNative', value: 'native' },
  { labelKey: 'paintRendererSkia', value: 'skia' },
  { labelKey: 'paintRendererWebview', value: 'webview' },
] as const satisfies readonly {
  labelKey: string;
  value: SevenTvPaintRenderer;
}[];

function isPaintRenderer(value: string): value is SevenTvPaintRenderer {
  return PAINT_RENDERER_OPTIONS.some(option => option.value === value);
}

export function PaintRendererSection() {
  const { t } = useTranslation('devTools');
  const sevenTvPaintRenderer = usePreference('sevenTvPaintRenderer');
  const update = useUpdatePreferences();

  if (!isDevToolsEnabled) {
    return null;
  }

  if (Platform.OS === 'ios') {
    return (
      <Section
        title={t('paintRenderer')}
        footer={<NativeText>{t('paintRendererDescription')}</NativeText>}
      >
        <Picker
          label={t('paintRenderer')}
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
              {t(option.labelKey)}
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
    <SettingsSection title={t('paintRenderer')}>
      <ChatPreferenceSegmentedSettingsRow
        title={t('paintRenderer')}
        subtitle={t('paintRendererDescription')}
        icon={{ icon: 'paintbrush.fill', color: theme.colorPlum }}
        onChange={event => {
          const next =
            PAINT_RENDERER_OPTIONS[event.nativeEvent.selectedSegmentIndex]
              ?.value;
          if (next) {
            update({ sevenTvPaintRenderer: next });
          }
        }}
        onValueChange={value => {
          const selected = PAINT_RENDERER_OPTIONS.find(
            option => t(option.labelKey) === value,
          );
          if (selected) {
            update({ sevenTvPaintRenderer: selected.value });
          }
        }}
        selectedIndex={selectedIndex}
        values={PAINT_RENDERER_OPTIONS.map(option => t(option.labelKey))}
      />
    </SettingsSection>
  );
}
