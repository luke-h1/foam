import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

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

import { Image } from '@app/components/image/image';
import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/settings-section/settings-section';
import { Text } from '@app/components/ui/text/text';
import { useRemoteConfig } from '@app/hooks/firebase/use-remote-config';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { openLicenseList } from '@app/lib/legal';
import { SWIFTUI_ROW_CONTENT_INSET } from '@app/styles/native-form';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/open-link-in-browser';

const appIconProduction = require('../../../assets/app-icon/app-icon-production.png');

export function AboutScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const otaLabel = Updates.updateId ?? 'Embedded';
  const { config } = useRemoteConfig();
  const websiteUrl = config.websiteUrl.value;
  const statusPageUrl = config.statusPageUrl.value;

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section>
            <RNHostView matchContents>
              <View style={[styles.identityRow, styles.hostedRowInset]}>
                <Image source={appIconProduction} style={styles.appIcon} />
                <View style={styles.identityText}>
                  <Text type='title3' weight='bold' numberOfLines={1}>
                    Foam
                  </Text>
                  <Text type='subhead' color='gray.textLow' numberOfLines={2}>
                    A Twitch client built for your phone.
                  </Text>
                </View>
              </View>
            </RNHostView>
          </Section>

          <Section title='Resources'>
            <Button
              label='Website'
              systemImage='globe'
              onPress={() => openLinkInBrowser(websiteUrl)}
            />
            <Button
              label='Status'
              systemImage='checkmark.shield'
              onPress={() => openLinkInBrowser(statusPageUrl)}
            />
            <Button
              label='Licenses'
              systemImage='doc.text'
              onPress={() => openLicenseList('Licenses')}
            />
          </Section>

          <Section title='Build'>
            <LabeledContent label='Version'>
              <NativeText>
                {Application.nativeApplicationVersion ?? 'Unknown'}
              </NativeText>
            </LabeledContent>
            <LabeledContent label='Build'>
              <NativeText>
                {Application.nativeBuildVersion ?? 'Unknown'}
              </NativeText>
            </LabeledContent>
            <LabeledContent label='OTA'>
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
              <Text type='title3' weight='bold' numberOfLines={1}>
                Foam
              </Text>
              <Text type='subhead' color='gray.textLow' numberOfLines={2}>
                A Twitch client built for your phone.
              </Text>
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title='Resources'>
          <SettingsLinkRow
            title='Website'
            icon={{ icon: 'globe' }}
            onPress={() => openLinkInBrowser(websiteUrl)}
          />
          <SettingsLinkRow
            title='Status'
            icon={{ icon: 'checkmark.shield' }}
            onPress={() => openLinkInBrowser(statusPageUrl)}
          />
          <SettingsLinkRow
            title='Licenses'
            icon={{ icon: 'doc.text' }}
            onPress={() => openLicenseList('Licenses')}
          />
        </SettingsSection>

        <SettingsSection title='Build'>
          <SettingsLinkRow
            title='Version'
            value={Application.nativeApplicationVersion ?? 'Unknown'}
          />
          <SettingsLinkRow
            title='Build'
            value={Application.nativeBuildVersion ?? 'Unknown'}
          />
          <SettingsLinkRow title='OTA' value={otaLabel} />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appIcon: {
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    height: 56,
    width: 56,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  hostedRowInset: {
    paddingHorizontal: SWIFTUI_ROW_CONTENT_INSET,
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
