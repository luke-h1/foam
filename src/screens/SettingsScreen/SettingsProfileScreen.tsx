import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { theme } from '@app/styles/themes';
import { Platform, View } from 'react-native';
import { StyleSheet } from 'react-native';
import { ProfileCard } from './components/profile/ProfileCard';

export function SettingsProfileScreen() {
  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? null : (
        <ScreenHeader title='Profile' subtitle='Account' size='medium' />
      )}
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
