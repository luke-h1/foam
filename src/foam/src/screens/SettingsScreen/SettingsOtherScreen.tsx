import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Form,
  Host,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';
import { router } from 'expo-router';

import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

export function SettingsOtherScreen() {
  const { t } = useTranslation('settings');
  const scrollRef = useRef<ScrollView>(null);
  const analyticsEnabled = usePreference('analyticsEnabled');
  const update = useUpdatePreferences();

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section
            title={t('privacy')}
            footer={<NativeText>{t('shareAnalyticsFooter')}</NativeText>}
          >
            <Toggle
              label={t('shareAnalytics')}
              systemImage='chart.bar'
              isOn={analyticsEnabled}
              onIsOnChange={value => update({ analyticsEnabled: value })}
            />
          </Section>
          <Section title={t('supportAndFeedback')}>
            <Button
              label={t('faq')}
              systemImage='questionmark.circle'
              onPress={() => openLinkInBrowser('https://foam-app.com/faq')}
            />
            <Button
              label={t('changelog')}
              systemImage='clock'
              onPress={() => router.push('/tabs/settings/changelog')}
            />
          </Section>
        </Form>
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
        <SettingsSection
          title={t('privacy')}
          footer={
            <Text type='xs' color='gray.textLow'>
              {t('shareAnalyticsFooter')}
            </Text>
          }
        >
          <SettingsToggleRow
            title={t('shareAnalytics')}
            subtitle={t('shareAnalyticsDescription')}
            icon={{ icon: 'chart.bar', color: theme.colorTeal }}
            value={analyticsEnabled}
            onValueChange={value => update({ analyticsEnabled: value })}
          />
        </SettingsSection>

        <SettingsSection title={t('supportAndFeedback')}>
          <SettingsLinkRow
            title={t('faq')}
            subtitle={t('faqShortDescription')}
            icon={{ icon: 'questionmark.circle', color: theme.colorPrimary }}
            onPress={() => openLinkInBrowser('https://foam-app.com/faq')}
          />
          <SettingsLinkRow
            title={t('changelog')}
            subtitle={t('changelogDescription')}
            icon={{ icon: 'clock', color: theme.colorAmber }}
            onPress={() => router.push('/tabs/settings/changelog')}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

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
