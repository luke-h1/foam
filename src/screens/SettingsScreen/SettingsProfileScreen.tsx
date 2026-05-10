import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { theme } from '@app/styles/themes';
import { View } from 'react-native';
import { StyleSheet } from 'react-native';
import { ProfileCard } from './components/profile/ProfileCard';

export function SettingsProfileScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" subtitle="Account" size="medium" />
      <ProfileCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.background.dark,
  },
});
