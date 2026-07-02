import { StyleSheet, View } from 'react-native';

import { theme } from '@app/styles/themes';

import { ProfileCard } from './components/profile/ProfileCard';

export function SettingsProfileScreen() {
  return (
    <View style={styles.container}>
      <ProfileCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});
