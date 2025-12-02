import { ScreenHeader, Typography } from '@app/components';
import { Menu } from '@app/components/Menu';
import { PressableArea } from '@app/components/PressableArea';
import { Screen } from '@app/components/Screen';
import { useAppNavigation } from '@app/hooks';
import { SettingsStackParamList } from '@app/navigators';
import { openLinkInBrowser } from '@app/utils';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { BuildStatus } from './components';

export function SettingsIndexScreen() {
  const { navigate } = useAppNavigation<SettingsStackParamList>();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  return (
    <Screen safeAreaEdges={[]} preset="fixed">
      <View style={styles.container}>
        <Menu
          header={
            <View>
              <ScreenHeader
                title="Settings"
                subtitle="Customize your experience"
                back={false}
                size="large"
              />
            </View>
          }
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

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.quickLinks}>
            <PressableArea
              onPress={() => openLinkInBrowser('https://foam-app.com')}
              hitSlop={8}
            >
              <Typography size="sm" color="gray.textLow">
                Website
              </Typography>
            </PressableArea>
            <Typography size="sm" color="gray.border">
              •
            </Typography>
            <PressableArea
              onPress={() => openLinkInBrowser('https://status.foam-app.com')}
              hitSlop={8}
            >
              <Typography size="sm" color="gray.textLow">
                Status
              </Typography>
            </PressableArea>
          </View>
          <BuildStatus />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
  quickLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    // backgroundColor: theme.colors.gray.bg,
  },
}));
