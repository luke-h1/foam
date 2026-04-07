import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import { ProfileCard } from './components/profile/ProfileCard';

export function SettingsProfileScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Profile"
        subtitle="Account info & preferences"
        size="medium"
      />
      <ProfileCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
});
