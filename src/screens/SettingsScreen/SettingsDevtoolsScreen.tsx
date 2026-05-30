import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Switch } from '@app/components/Switch/Switch';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';

function IosToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.iosToggleRow}>
      <View style={styles.iosToggleCopy}>
        <Text color="gray" style={styles.iosToggleLabel} weight="semibold">
          {label}
        </Text>
        {subtitle ? (
          <Text color="gray.textLow" style={styles.iosToggleSubtitle} type="xs">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

export function SettingsDevtoolsScreen() {
  const { disableChat, disableStream, update } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.iosContent}
        >
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
          <Form.Section title="Stream Diagnostics">
            <Form.FormItem style={styles.iosToggleItem}>
              <IosToggleRow
                label="Disable Stream"
                subtitle="Remove the Twitch WebView to isolate chat performance"
                value={disableStream}
                onValueChange={value => update({ disableStream: value })}
              />
            </Form.FormItem>
            <Form.FormItem style={styles.iosToggleItem}>
              <IosToggleRow
                label="Disable Chat"
                subtitle="Remove chat rendering to isolate the player"
                value={disableChat}
                onValueChange={value => update({ disableChat: value })}
              />
            </Form.FormItem>
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
              systemImage="list.bullet.rectangle"
              onPress={() => router.push('/dev-tools/changelog')}
            >
              Changelog Demo
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
            icon={{ icon: 'stethoscope', color: theme.colorBlue }}
            onPress={() => router.push('/tabs/settings/diagnostics')}
          />
          <SettingsLinkRow
            title="Remote Config"
            subtitle="Inspect fetched config and local overrides"
            icon={{ icon: 'cloud', color: theme.colorPlum }}
            onPress={() => router.push('/tabs/settings/remote-config')}
          />
        </SettingsSection>

        <SettingsSection title="Stream Diagnostics">
          <SettingsToggleRow
            title="Disable Stream"
            subtitle="Remove the Twitch WebView to isolate chat performance"
            icon={{ icon: 'video.slash', color: theme.colorOrange }}
            value={disableStream}
            onValueChange={value => update({ disableStream: value })}
          />
          <SettingsToggleRow
            title="Disable Chat"
            subtitle="Remove chat rendering to isolate the player"
            icon={{ icon: 'message', color: theme.colorPlum }}
            value={disableChat}
            onValueChange={value => update({ disableChat: value })}
          />
        </SettingsSection>

        <SettingsSection title="Developer Tools">
          <SettingsLinkRow
            title="Debug"
            subtitle="Manual debug helpers and experiments"
            icon={{ icon: 'ladybug', color: theme.colorOrange }}
            onPress={() => router.push('/tabs/settings/debug')}
          />
          <SettingsLinkRow
            title="Cached Images"
            subtitle="Inspect and manage emote and badge media cache"
            icon={{ icon: 'photo.stack', color: theme.colorGreen }}
            onPress={() => router.push('/tabs/settings/cached-images')}
          />
          <SettingsLinkRow
            title="Changelog Demo"
            subtitle="Present sample native changelog payloads"
            icon={{ icon: 'list.bullet.rectangle', color: theme.colorBlue }}
            onPress={() => router.push('/dev-tools/changelog')}
          />
          <SettingsLinkRow
            title="Storybook"
            subtitle="Component previews and design-system inspection"
            icon={{ icon: 'book.closed', color: theme.colorTeal }}
            onPress={() => router.push('/tabs/settings/storybook')}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  iosToggleCopy: {
    flex: 1,
    gap: theme.space4,
    minWidth: 0,
  },
  iosToggleItem: {
    paddingVertical: theme.space8,
  },
  iosToggleLabel: {
    lineHeight: 20,
  },
  iosToggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
    justifyContent: 'space-between',
    width: '100%',
  },
  iosToggleSubtitle: {
    lineHeight: 18,
  },
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
