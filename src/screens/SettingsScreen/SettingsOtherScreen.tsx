import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';

export function SettingsOtherScreen() {
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView
          contentInsetAdjustmentBehavior='automatic'
          contentContainerStyle={styles.iosContent}
        >
          <Form.Section title='Support & Feedback'>
            <Form.Link
              systemImage='info.circle'
              onPress={() => router.push('/tabs/settings/about')}
            >
              About Foam
            </Form.Link>
            <Form.Link
              systemImage='questionmark.circle'
              onPress={() => router.push('/tabs/settings/faq')}
            >
              FAQ
            </Form.Link>
            <Form.Link
              systemImage='clock'
              onPress={() => router.push('/tabs/settings/changelog')}
            >
              Changelog
            </Form.Link>
          </Form.Section>
          <Form.Section title='Legal'>
            <Form.Link
              systemImage='doc.text'
              onPress={() => router.push('/tabs/settings/licenses')}
            >
              OSS Licenses
            </Form.Link>
          </Form.Section>
        </BodyScrollView>
      </View>
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
        <ScreenHeader
          title='Other'
          subtitle='Support, release notes, and legal information for Foam.'
          size='medium'
        />

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
            icon={{ icon: 'questionmark.circle', color: theme.colorGreen }}
            onPress={() => router.push('/tabs/settings/faq')}
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
  iosContent: {
    paddingBottom: theme.space56,
  },
});
