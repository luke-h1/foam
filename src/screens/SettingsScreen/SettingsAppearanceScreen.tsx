import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import {
  Form as NativeForm,
  Host,
  LabeledContent,
  Picker,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';
import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const THEME_OPTIONS = ['foam-dark'] as const;

export function SettingsAppearanceScreen() {
  const { t } = useTranslation('settings');
  const themeLabels: Record<(typeof THEME_OPTIONS)[number], string> = {
    'foam-dark': t('foamDark'),
  };
  const selectedTheme = usePreference('theme');
  const hapticFeedback = usePreference('hapticFeedback');
  const shakeToReport = usePreference('shakeToReport');
  const update = useUpdatePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <NativeForm>
          <Section
            title={t('theme')}
            footer={<NativeText>{t('themeFooterIos')}</NativeText>}
          >
            <Picker
              label={t('theme')}
              selection={selectedTheme}
              onSelectionChange={value => update({ theme: value as Theme })}
            >
              {THEME_OPTIONS.map(opt => (
                <NativeText key={opt} modifiers={[tag(opt)]}>
                  {themeLabels[opt]}
                </NativeText>
              ))}
            </Picker>
            <LabeledContent label={t('mode')}>
              <NativeText>{t('dark')}</NativeText>
            </LabeledContent>
          </Section>
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
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SettingsSection title={t('theme')}>
          <SettingsLinkRow
            title={t('theme')}
            subtitle={t('themeDescription')}
            icon={{ icon: 'moon', color: theme.colorAmber }}
            value={
              selectedTheme === 'foam-dark' ? t('foamDark') : selectedTheme
            }
            onPress={() => {
              update({ theme: 'foam-dark' });
            }}
          />
        </SettingsSection>
        <SettingsSection title={t('feedback')}>
          <SettingsToggleRow
            title={t('haptics')}
            subtitle={t('hapticsDescription')}
            icon={{ icon: 'hand.tap', color: theme.colorTeal }}
            value={hapticFeedback}
            onValueChange={value => update({ hapticFeedback: value })}
          />
          <SettingsToggleRow
            title={t('shakeToReport')}
            subtitle={t('shakeToReportDescription')}
            icon={{ icon: 'waveform.path', color: theme.colorAmber }}
            value={shakeToReport}
            onValueChange={value => update({ shakeToReport: value })}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

type Theme = (typeof THEME_OPTIONS)[number];

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
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
});
