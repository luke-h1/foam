import { ScreenHeader } from '@app/components/ScreenHeader';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
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

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
}));
