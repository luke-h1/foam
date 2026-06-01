import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';

export function VideoPreferenceScreen() {
  const { update, useUIKitForWebView } = usePreferences();

  return (
    <View style={styles.container}>
      <BodyScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <ScreenHeader
          title="Video"
          subtitle="Playback controls and stream quality"
          size="medium"
        />

        <SettingsSection title="Experiments">
          <SettingsToggleRow
            title="Use UI Kit for WebView"
            subtitle="Render stream playback through the native UIKit WebView experiment"
            icon={{ icon: 'safari', color: theme.colorBlue }}
            value={useUIKitForWebView}
            onValueChange={value => update({ useUIKitForWebView: value })}
          />
        </SettingsSection>
      </BodyScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingBottom: theme.space44,
  },
});
