import { Platform, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Picker, Section, Text as NativeText } from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { SettingsSection } from '@app/components/SettingsSection/SettingsSection';
import { ChatPreferenceSegmentedSettingsRow } from '@app/screens/Preferences/components/ChatPreferenceSettingsRows';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferences/selectors';
import { type SevenTvPaintRenderer } from '@app/store/preferences/state';
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
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
        icon={{ icon: 'paintbrush.fill', color: theme.color.plum[scheme] }}
        onSelectIndex={index => {
          const next = PAINT_RENDERER_OPTIONS[index]?.value;
          if (next) {
            update({ sevenTvPaintRenderer: next });
          }
        }}
        selectedIndex={selectedIndex}
        values={PAINT_RENDERER_OPTIONS.map(option => t(option.labelKey))}
      />
    </SettingsSection>
  );
}
