import { Menu } from '@app/components/Menu/Menu';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/Text/Text';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { SettingsStackParamList } from '@app/navigators/SettingsStackNavigator';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuildStatus } from './components/BuildStatus';

export function SettingsIndexScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();
  const insets = useSafeAreaInsets();
  const { config } = useRemoteConfig();
  const { statusPageUrl, websiteUrl } = config;

  return (
    <View style={styles.container}>
      <Menu
        items={[
          {
            arrow: true,
            icon: {
              name: 'person.circle',
              type: 'symbol',
              color: theme.colors.blue.accent,
            },
            label: 'Profile',
            description: 'Account info & preferences',
            onPress: () => navigate('Profile'),
          },
          null,
          {
            arrow: true,
            icon: {
              name: 'paintpalette',
              type: 'symbol',
              color: theme.colors.violet.accent,
            },
            label: 'Appearance',
            description: 'Theme, colors & display',
            onPress: () => navigate('Appearance'),
          },
          null,
          {
            arrow: true,
            icon: {
              name: 'bubble.left.and.bubble.right',
              type: 'symbol',
              color: theme.colors.green.accent,
            },
            label: 'Chat',
            description: 'Chat options',
            onPress: () => navigate('ChatPreferences'),
          },
          null,
          {
            arrow: true,
            icon: {
              name: 'hammer',
              type: 'symbol',
              color: theme.colors.orange.accent,
            },
            label: 'Dev Tools',
            description: 'Debug options & diagnostics',
            onPress: () => navigate('DevTools'),
          },
          null,
          {
            arrow: true,
            icon: {
              name: 'ellipsis.circle',
              type: 'symbol',
              color: theme.colors.teal.accent,
            },
            label: 'Other',
            description: 'Privacy, licenses & more',
            onPress: () => navigate('Other'),
          },
        ]}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 90 }]}>
        <View style={styles.quickLinks}>
          <PressableArea
            onPress={() => openLinkInBrowser(websiteUrl.value)}
            hitSlop={8}
          >
            <Text type="sm" color="gray.textLow">
              Website
            </Text>
          </PressableArea>
          <Text type="sm" color="gray.border">
            •
          </Text>
          <PressableArea
            onPress={() => openLinkInBrowser(statusPageUrl.value)}
            hitSlop={8}
          >
            <Text type="sm" color="gray.textLow">
              Status
            </Text>
          </PressableArea>
        </View>
        <BuildStatus />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    paddingTop: theme.spacing.lg,
    position: 'absolute',
    right: 0,
    // backgroundColor: theme.colors.gray.bg,
  },
  quickLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
});
