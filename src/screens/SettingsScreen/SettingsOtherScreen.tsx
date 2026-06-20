import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { Button, Form, Host, Section } from '@expo/ui/swift-ui';
import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export function SettingsOtherScreen() {
  const { t } = useTranslation('settings');
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section title={t('supportAndFeedback')}>
            <Button
              label={t('aboutFoam')}
              systemImage='info.circle'
              onPress={() => router.push('/tabs/settings/about')}
            />
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
        <SettingsSection title={t('supportAndFeedback')}>
          <SettingsLinkRow
            title={t('aboutFoam')}
            subtitle={t('aboutFoamShortDescription')}
            icon={{ icon: 'info.circle', color: theme.colorBlue }}
            onPress={() => router.push('/tabs/settings/about')}
          />
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
