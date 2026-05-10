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

export function SettingsDevtoolsScreen() {
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView contentContainerStyle={styles.iosContent}>
          <ScreenHeader
            title="Dev Tools"
            subtitle="Diagnostics and internal tools for inspecting app state and behavior."
            size="medium"
          />
          <Form.Section title="Diagnostics">
            <Form.Link
              systemImage="stethoscope"
              onPress={() => router.push('/tabs/settings/diagnostics')}
            >
              App Diagnostics
            </Form.Link>
            <Form.Link
              systemImage="cloud"
              onPress={() => router.push('/tabs/settings/remote-config')}
            >
              Remote Config
            </Form.Link>
          </Form.Section>
          <Form.Section title="Developer Tools">
            <Form.Link
              systemImage="ladybug"
              onPress={() => router.push('/tabs/settings/debug')}
            >
              Debug
            </Form.Link>
            <Form.Link
              systemImage="photo.stack"
              onPress={() => router.push('/tabs/settings/cached-images')}
            >
              Cached Images
            </Form.Link>
            <Form.Link
              systemImage="book.closed"
              onPress={() => router.push('/tabs/settings/storybook')}
            >
              Storybook
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
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScreenHeader
          title="Dev Tools"
          subtitle="Diagnostics and internal tools for inspecting app state and behavior."
          size="medium"
        />

        <SettingsSection title="Diagnostics">
          <SettingsLinkRow
            title="App Diagnostics"
            subtitle="Version, environment, and runtime details"
            icon={{ icon: 'activity', color: theme.colorBlue }}
            onPress={() => router.push('/tabs/settings/diagnostics')}
          />
          <SettingsLinkRow
            title="Remote Config"
            subtitle="Inspect fetched config and local overrides"
            icon={{ icon: 'cloud', color: theme.colorPlum }}
            onPress={() => router.push('/tabs/settings/remote-config')}
          />
        </SettingsSection>

        <SettingsSection title="Developer Tools">
          <SettingsLinkRow
            title="Debug"
            subtitle="Manual debug helpers and experiments"
            icon={{ icon: 'bug', color: theme.colorOrange }}
            onPress={() => router.push('/tabs/settings/debug')}
          />
          <SettingsLinkRow
            title="Cached Images"
            subtitle="Inspect and manage emote and badge media cache"
            icon={{ icon: 'image', color: theme.colorGreen }}
            onPress={() => router.push('/tabs/settings/cached-images')}
          />
          <SettingsLinkRow
            title="Storybook"
            subtitle="Component previews and design-system inspection"
            icon={{ icon: 'book-open', color: theme.colorTeal }}
            onPress={() => router.push('/tabs/settings/storybook')}
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
