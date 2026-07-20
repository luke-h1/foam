import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Form,
  Host,
  LabeledContent,
  RNHostView,
  Section,
  Text as NativeText,
} from '@expo/ui/swift-ui';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

import { Image } from '@app/components/Image/Image';
import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

const appIconProduction = require('../../../assets/app-icon/app-icon-production.png');

export function AboutScreen() {
  const { t } = useTranslation('about');
  const scrollRef = useRef<ScrollView>(null);
  const otaLabel = Updates.updateId ?? t('embedded');

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section>
            <RNHostView matchContents>
              <View style={styles.identityRow}>
                <Image source={appIconProduction} style={styles.appIcon} />
                <View style={styles.identityText}>
                  <Text type='lg' weight='bold' numberOfLines={1}>
                    {t('appName')}
                  </Text>
                  <Text type='xs' color='gray.textLow' numberOfLines={2}>
                    {t('tagline')}
                  </Text>
                </View>
              </View>
            </RNHostView>
          </Section>

          <Section title={t('builtFor')}>
            <LabeledContent label={t('chat')}>
              <NativeText>{t('chatDescription')}</NativeText>
            </LabeledContent>
            <LabeledContent label={t('discovery')}>
              <NativeText>{t('discoveryDescription')}</NativeText>
            </LabeledContent>
            <LabeledContent label={t('viewing')}>
              <NativeText>{t('viewingDescription')}</NativeText>
            </LabeledContent>
          </Section>

          <Section title={t('resources')}>
            <Button
              label={t('website')}
              systemImage='globe'
              onPress={() => openLinkInBrowser('https://foam-app.com')}
            />
            <Button
              label={t('status')}
              systemImage='checkmark.shield'
              onPress={() => openLinkInBrowser('https://status.foam-app.com')}
            />
          </Section>

          <Section title={t('build')}>
            <LabeledContent label={t('version')}>
              <NativeText>
                {Application.nativeApplicationVersion ?? t('unknown')}
              </NativeText>
            </LabeledContent>
            <LabeledContent label={t('build')}>
              <NativeText>
                {Application.nativeBuildVersion ?? t('unknown')}
              </NativeText>
            </LabeledContent>
            <LabeledContent label={t('ota')}>
              <NativeText>{otaLabel}</NativeText>
            </LabeledContent>
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.main}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection>
          <View style={styles.identityRow}>
            <Image source={appIconProduction} style={styles.appIcon} />
            <View style={styles.identityText}>
              <Text type='lg' weight='bold' numberOfLines={1}>
                {t('appName')}
              </Text>
              <Text type='xs' color='gray.textLow' numberOfLines={2}>
                {t('tagline')}
              </Text>
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title={t('builtFor')}>
          <SettingsLinkRow title={t('chat')} subtitle={t('chatDescription')} />
          <SettingsLinkRow
            title={t('discovery')}
            subtitle={t('discoveryDescription')}
          />
          <SettingsLinkRow
            title={t('viewing')}
            subtitle={t('viewingDescription')}
          />
        </SettingsSection>

        <SettingsSection title={t('resources')}>
          <SettingsLinkRow
            title={t('website')}
            icon={{ icon: 'globe', color: theme.colorViolet }}
            onPress={() => openLinkInBrowser('https://foam-app.com')}
          />
          <SettingsLinkRow
            title={t('status')}
            icon={{ icon: 'checkmark.shield', color: theme.colorOrange }}
            onPress={() => openLinkInBrowser('https://status.foam-app.com')}
          />
        </SettingsSection>

        <SettingsSection title={t('build')}>
          <SettingsLinkRow
            title={t('version')}
            value={Application.nativeApplicationVersion ?? t('unknown')}
          />
          <SettingsLinkRow
            title={t('build')}
            value={Application.nativeBuildVersion ?? t('unknown')}
          />
          <SettingsLinkRow title={t('ota')} value={otaLabel} />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appIcon: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 56,
    width: 56,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    padding: theme.space16,
  },
  identityText: {
    flex: 1,
    gap: theme.space4,
  },
  iosHost: {
    flex: 1,
  },
  main: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
});
