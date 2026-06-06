import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { FOAM_FAQ_URL } from '@app/constants/links';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { Button, Form, Host, Section } from '@expo/ui/swift-ui';
import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';

export function SettingsOtherScreen() {
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <Form>
          <Section title='Support & Feedback'>
            <Button
              label='About Foam'
              systemImage='info.circle'
              onPress={() => router.push('/tabs/settings/about')}
            />
            <Button
              label='FAQ'
              systemImage='questionmark.circle'
              onPress={() => openLinkInBrowser(FOAM_FAQ_URL)}
            />
            <Button
              label='Changelog'
              systemImage='clock'
              onPress={() => router.push('/tabs/settings/changelog')}
            />
          </Section>
          <Section title='Legal'>
            <Button
              label='OSS Licenses'
              systemImage='doc.text'
              onPress={() => router.push('/tabs/settings/licenses')}
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
        <SettingsSection title='Support & Feedback'>
          <SettingsLinkRow
            title='About Foam'
            subtitle='What the app is built for'
            icon={{ icon: 'info.circle', color: theme.colorBlue }}
            onPress={() => router.push('/tabs/settings/about')}
          />
          <SettingsLinkRow
            title='FAQ'
            subtitle='Common questions and product guidance'
            icon={{ icon: 'questionmark.circle', color: theme.colorPrimary }}
            onPress={() => openLinkInBrowser(FOAM_FAQ_URL)}
          />
          <SettingsLinkRow
            title='Changelog'
            subtitle='Recent release notes and product updates'
            icon={{ icon: 'clock', color: theme.colorAmber }}
            onPress={() => router.push('/tabs/settings/changelog')}
          />
        </SettingsSection>

        <SettingsSection title='Legal'>
          <SettingsLinkRow
            title='OSS Licenses'
            subtitle='Open-source software used by the app'
            icon={{ icon: 'doc.text', color: theme.colorViolet }}
            onPress={() => router.push('/tabs/settings/licenses')}
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
