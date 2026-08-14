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

import { Image } from '@app/components/Image/Image';
import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { SWIFTUI_ROW_CONTENT_INSET } from '@app/styles/nativeForm';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

const appIconProduction = require('../../../assets/app-icon/app-icon-production.png');

export function AboutScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const otaLabel = Updates.updateId ?? 'Embedded';

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
                  <Text type='lg' weight='bold' numberOfLines={1}>
                    Foam
                  </Text>
                  <Text type='xs' color='gray.textLow' numberOfLines={2}>
                    Streams, discovery, and chat controls in one mobile-first
                    shell.
                  </Text>
                </View>
              </View>
            </RNHostView>
          </Section>

          <Section title='Built For'>
            <LabeledContent label='Chat'>
              <NativeText>
                Native feeling chat with 7TV, BTTV and FFZ support. Inspired by
                projects such as Chatterino and the 7TV Chrome extension
              </NativeText>
            </LabeledContent>
            <LabeledContent label='Discovery'>
              <NativeText>
                Find and discover new streamers without the clutter
              </NativeText>
            </LabeledContent>
            <LabeledContent label='Viewing'>
              <NativeText>A viewing experience to rival desktop</NativeText>
            </LabeledContent>
          </Section>

          <Section title='Resources'>
            <Button
              label='Website'
              systemImage='globe'
              onPress={() => openLinkInBrowser('https://foam-app.com')}
            />
            <Button
              label='Status'
              systemImage='checkmark.shield'
              onPress={() => openLinkInBrowser('https://status.foam-app.com')}
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
              <Text type='lg' weight='bold' numberOfLines={1}>
                Foam
              </Text>
              <Text type='xs' color='gray.textLow' numberOfLines={2}>
                Streams, discovery, and chat controls in one mobile-first shell.
              </Text>
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title='Built For'>
          <SettingsLinkRow
            title='Chat'
            subtitle='Native feeling chat with 7TV, BTTV and FFZ support. Inspired by projects such as Chatterino and the 7TV Chrome extension'
          />
          <SettingsLinkRow
            title='Discovery'
            subtitle='Find and discover new streamers without the clutter'
          />
          <SettingsLinkRow
            title='Viewing'
            subtitle='A viewing experience to rival desktop'
          />
        </SettingsSection>

        <SettingsSection title='Resources'>
          <SettingsLinkRow
            title='Website'
            icon={{ icon: 'globe', color: theme.colorViolet }}
            onPress={() => openLinkInBrowser('https://foam-app.com')}
          />
          <SettingsLinkRow
            title='Status'
            icon={{ icon: 'checkmark.shield', color: theme.colorOrange }}
            onPress={() => openLinkInBrowser('https://status.foam-app.com')}
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
    borderRadius: theme.borderRadius16,
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
