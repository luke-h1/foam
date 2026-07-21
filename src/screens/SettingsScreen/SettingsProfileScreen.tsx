import { StyleSheet, useColorScheme, View } from 'react-native';

import { theme } from '@app/styles/themes';

import { ProfileCard } from './components/profile/ProfileCard';

export function SettingsProfileScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <ProfileCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
