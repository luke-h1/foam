import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { SettingsSection } from '@app/components/SettingsSection/SettingsSection';
import { ChatPreferenceSegmentedSettingsRow } from '@app/screens/Preferences/ChatPreferenceSettingsRows';
import {
  type SevenTvPaintRenderer,
  usePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';

const PAINT_RENDERER_OPTIONS = [
  { labelKey: 'paintRendererAuto', value: 'auto' },
  { labelKey: 'paintRendererNative', value: 'native' },
  { labelKey: 'paintRendererSkia', value: 'skia' },
  { labelKey: 'paintRendererWebview', value: 'webview' },
] as const satisfies readonly {
  labelKey: string;
  value: SevenTvPaintRenderer;
}[];

/**
 * Dev-only override for the 7TV paint renderer, surfaced in the debug menu.
 * 'auto' defers to the `paintedUsernameRenderer` rollout experiment; the other
 * values force a renderer for QA (webview is a reference, not shippable).
 */
export function PaintRendererSection() {
  const { t } = useTranslation('devTools');
  const { sevenTvPaintRenderer, update } = usePreferences();

  const selectedIndex = PAINT_RENDERER_OPTIONS.findIndex(
    option => option.value === sevenTvPaintRenderer,
  );

  const handleChange = (event: {
    nativeEvent: { selectedSegmentIndex: number };
  }) => {
    const next =
      PAINT_RENDERER_OPTIONS[event.nativeEvent.selectedSegmentIndex]?.value;
    if (next) {
      update({ sevenTvPaintRenderer: next });
    }
  };

  const handleValueChange = (value: string) => {
    const selected = PAINT_RENDERER_OPTIONS.find(
      option => t(option.labelKey) === value,
    );
    if (selected) {
      update({ sevenTvPaintRenderer: selected.value });
    }
  };

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
          onSelectionChange={value => update({ sevenTvPaintRenderer: value })}
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

  return (
    <SettingsSection title={t('paintRenderer')}>
      <ChatPreferenceSegmentedSettingsRow
        title={t('paintRenderer')}
        subtitle={t('paintRendererDescription')}
        icon={{ icon: 'paintbrush.fill', color: theme.colorPlum }}
        onChange={handleChange}
        onValueChange={handleValueChange}
        selectedIndex={selectedIndex}
        values={PAINT_RENDERER_OPTIONS.map(option => t(option.labelKey))}
      />
    </SettingsSection>
  );
}
