import { useRef } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Form as NativeForm,
  Host,
  Picker,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  useLightModeEnabled,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferences/selectors';
import { theme, type ThemeMode } from '@app/styles/themes';

const THEME_MODE_OPTIONS = ['system', 'light', 'dark'] as const;

export function SettingsAppearanceScreen() {
  const { t } = useTranslation('settings');
  const themeModeLabels: Record<ThemeMode, string> = {
    system: t('system'),
    light: t('light'),
    dark: t('dark'),
  };
  const selectedTheme = usePreference('theme');
  const lightModeEnabled = useLightModeEnabled();
  const hapticFeedback = usePreference('hapticFeedback');
  const shakeToReport = usePreference('shakeToReport');
  const update = useUpdatePreferences();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <NativeForm>
          {lightModeEnabled ? (
            <Section
              title={t('theme')}
              footer={<NativeText>{t('themeFooterIos')}</NativeText>}
            >
              <Picker
                label={t('mode')}
                selection={selectedTheme}
                onSelectionChange={value =>
                  update({ theme: value as ThemeMode })
                }
              >
                {THEME_MODE_OPTIONS.map(opt => (
                  <NativeText key={opt} modifiers={[tag(opt)]}>
                    {themeModeLabels[opt]}
                  </NativeText>
                ))}
              </Picker>
            </Section>
          ) : null}
          <Section
            title={t('feedback')}
            footer={<NativeText>{t('hapticsDescription')}</NativeText>}
          >
            <Toggle
              label={t('haptics')}
              systemImage='hand.tap'
              isOn={hapticFeedback}
              onIsOnChange={value => update({ hapticFeedback: value })}
            />
            <Toggle
              label={t('shakeToReportIos')}
              systemImage='iphone.gen3.radiowaves.left.and.right'
              isOn={shakeToReport}
              onIsOnChange={value => update({ shakeToReport: value })}
            />
          </Section>
        </NativeForm>
      </Host>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {lightModeEnabled ? (
          <SettingsSection title={t('theme')}>
            <View style={styles.modePicker}>
              <SegmentedControl
                currentIndex={Math.max(
                  THEME_MODE_OPTIONS.indexOf(selectedTheme),
                  0,
                )}
                items={THEME_MODE_OPTIONS.map(opt => ({
                  label: themeModeLabels[opt],
                }))}
                onChange={index => {
                  const next = THEME_MODE_OPTIONS[index];
                  if (next) {
                    update({ theme: next });
                  }
                }}
              />
            </View>
          </SettingsSection>
        ) : null}
        <SettingsSection title={t('feedback')}>
          <SettingsToggleRow
            title={t('haptics')}
            subtitle={t('hapticsDescription')}
            icon={{ icon: 'hand.tap', color: theme.color.teal[scheme] }}
            value={hapticFeedback}
            onValueChange={value => update({ hapticFeedback: value })}
          />
          <SettingsToggleRow
            title={t('shakeToReport')}
            subtitle={t('shakeToReportDescription')}
            icon={{ icon: 'waveform.path', color: theme.color.amber[scheme] }}
            value={shakeToReport}
            onValueChange={value => update({ shakeToReport: value })}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  iosHost: {
    flex: 1,
  },
  modePicker: {
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});
