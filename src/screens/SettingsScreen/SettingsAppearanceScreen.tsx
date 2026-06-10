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

const THEME_OPTIONS = ['foam-dark'] as const;
const THEME_LABELS: Record<(typeof THEME_OPTIONS)[number], string> = {
  'foam-dark': 'Foam Dark',
};

export function SettingsAppearanceScreen() {
  const selectedTheme = usePreference('theme');
  const hapticFeedback = usePreference('hapticFeedback');
  const update = useUpdatePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.iosHost}>
        <NativeForm>
          <Section
            title='Theme'
            footer={
              <NativeText>
                Foam currently ships with one canonical visual mode. Additional
                themes will appear here as they become available.
              </NativeText>
            }
          >
            <Picker
              label='Theme'
              selection={selectedTheme}
              onSelectionChange={value => update({ theme: value as Theme })}
            >
              {THEME_OPTIONS.map(opt => (
                <NativeText key={opt} modifiers={[tag(opt)]}>
                  {THEME_LABELS[opt]}
                </NativeText>
              ))}
            </Picker>
            <LabeledContent label='Mode'>
              <NativeText>Dark</NativeText>
            </LabeledContent>
          </Section>
          <Section
            title='Feedback'
            footer={
              <NativeText>
                Subtle vibrations for actions like sending messages and
                refreshing.
              </NativeText>
            }
          >
            <Toggle
              label='Haptics'
              systemImage='hand.tap'
              isOn={hapticFeedback}
              onIsOnChange={value => update({ hapticFeedback: value })}
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
        <SettingsSection title='Theme'>
          <SettingsLinkRow
            title='Theme'
            subtitle='The redesigned app currently ships with one canonical visual mode'
            icon={{ icon: 'moon', color: theme.colorAmber }}
            value={selectedTheme === 'foam-dark' ? 'Foam Dark' : selectedTheme}
            onPress={() => {
              update({ theme: 'foam-dark' });
            }}
          />
        </SettingsSection>
        <SettingsSection title='Feedback'>
          <SettingsToggleRow
            title='Haptics'
            subtitle='Subtle vibrations for actions like sending messages and refreshing'
            icon={{ icon: 'hand.tap', color: theme.colorTeal }}
            value={hapticFeedback}
            onValueChange={value => update({ hapticFeedback: value })}
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
