import { Menu } from '@app/components/Menu/Menu';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';

export function SettingsCacheScreen() {
  return (
    <View style={styles.container}>
      <Menu
        items={[
          {
            description: 'Refetch all data',
            label: 'Clear data',
            icon: {
              color: theme.colors.red.accent,
              name: 'externaldrive.badge.exclamationmark',
              type: 'symbol',
            },
          },
          {
            description:
              'Will hard-refetch all emotes, badges etc. and remove old entries from device cache',
            title: 'Clear Image cache',
            label: 'Clears all emote/badge image cache',
            icon: {
              color: theme.colors.red.accent,
              name: 'externaldrive.connected.to.line.below.fill',
              type: 'symbol',
            },
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
});
