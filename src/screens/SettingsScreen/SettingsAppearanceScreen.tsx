import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  SettingsLinkRow,
  SettingsSection,
} from '@app/components/SettingsSection/SettingsSection';
import { Preferences, usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';

export function SettingsAppearanceScreen() {
  const { theme: selectedTheme, update } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView contentContainerStyle={styles.iosContent}>
          <ScreenHeader
            title="Appearance"
            subtitle="Visual mode."
            size="medium"
          />
          <Form.Section title="Theme">
            <Form.Link
              systemImage="moon"
              hint="Foam Dark"
              onPress={() =>
                update({ theme: 'foam-dark' as Preferences['theme'] })
              }
            >
              Theme
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
          title="Appearance"
          subtitle="Visual mode."
          size="medium"
        />

        <SettingsSection title="Theme">
          <SettingsLinkRow
            title="Theme"
            subtitle="The redesigned app currently ships with one canonical visual mode"
            icon={{ icon: 'moon', color: theme.colorAmber }}
            value={selectedTheme === 'foam-dark' ? 'Foam Dark' : selectedTheme}
            onPress={() => {
              update({ theme: 'foam-dark' as Preferences['theme'] });
            }}
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
